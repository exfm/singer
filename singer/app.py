from flask import Flask, request, jsonify
import requests
import json
import time
import redis
import re
import boto
from boto.route53.record import ResourceRecordSets

from functools import wraps

app = Flask('singer')
app.config['CSRF_ENABLED'] = False
app.config['SECRET_KEY'] = ''

_redis = None


def get_redis():
    global _redis
    if not _redis:
        _redis = redis.Redis(host=app.config['redis']['host'],
            db=app.config['redis']['db'])
    return _redis


def connect_to_autoscale():
    return boto.connect_autoscale(app.config['aws']['key'],
        app.config['aws']['secret'])


def connect_to_ec2():
    return boto.connect_ec2(app.config['aws']['key'],
        app.config['aws']['secret'])


def delete_cname(zone_id, src, dest):
    conn = boto.connect_route53(app.config['aws']['key'],
        app.config['aws']['secret'])

    changes = ResourceRecordSets(conn, zone_id, '')
    change = changes.add_change('DELETE', dest, 'CNAME', 300)
    change.set_alias(None, None)
    change.add_value(src)
    changes.commit()


def add_cname(zone_id, src, dest, _type='CNAME'):
    app.logger.info("Add cname: {}, {}, {}, {}".format(zone_id, src, dest, _type))
    conn = boto.connect_route53(app.config['aws']['key'],
        app.config['aws']['secret'])

    changes = ResourceRecordSets(conn, zone_id, '')
    change = changes.add_change("CREATE", dest, _type, 300)
    change.add_value(src)
    changes.commit()


def get_next_service_number(service_name):
    service_numbers = []
    pattern = re.compile("^{}([0-9]+)\.ex\.fm\.$".format(service_name))
    r53 = boto.connect_route53(app.config['aws']['key'],
        app.config['aws']['secret'])

    zone_id = app.config['dns']['external_zone_id']

    sets = r53.get_all_rrsets(zone_id)
    for i in xrange(len(sets)):
        if sets[i].resource_records:
            if (sets[i].type == 'CNAME'):
                match = pattern.match(sets[i].name)
                if match:
                    service_numbers.append(int(match.group(1)))
    service_numbers.sort()
    missing = find_missing_numbers(service_numbers)
    if missing:
        return missing[0]
    return service_numbers[len(service_numbers) - 1] + 1


def find_missing_numbers(service_numbers):
    missing = []
    service_numbers.insert(0, 0)
    for rank in xrange(0, len(service_numbers) - 1):
        if service_numbers[rank + 1] - service_numbers[rank] > 2:
            for i in range(service_numbers[rank] + 1, service_numbers[rank + 1]):
                missing.append(i)
        elif service_numbers[rank + 1] - service_numbers[rank] == 2:
            missing.append(service_numbers[rank] + 1)
    return missing


def retry_on_exception():
    def decorator(func):
        max_retries = 5
        func.retries = max_retries

        @wraps(func)
        def retry(*args, **kwargs):
            done = False
            while func.retries >= 0 and not done:
                app.logger.warning('{} attempt {} of {}'.format(
                    func.func_name,
                    max_retries - func.retries + 1,
                    max_retries
                ))
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception, e:
                    func.retries -= 1
                    app.logger.error("Exception: %s" % e)
            raise e
        return retry
    return decorator


@app.route('/api/hosts/<service_name>')
def hosts_for_service_name(service_name):
    r = get_redis()
    d = r.hgetall(service_name)
    hosts = []
    if d:
        for k in d:
            hosts.append(json.loads(d[k])['hostname'])
    return jsonify({'hosts': hosts})


@app.route('/api/hosts')
def all_hosts():
    """Useful for service lookups."""
    pass


@app.route('/api/autoscaling-notification', methods=['POST'])
def autoscaling_notification():
    app.logger.info('/api/autoscaling-notification called.')
    post_data = json.loads(request.data)
    app.logger.info(post_data)
    if post_data.get('Type') == 'SubscriptionConfirmation':
        return handle_confirmation(post_data)
    elif post_data.get('Type') == 'Notification':
        return handle_notification(post_data)


@app.route('/api/bootstrap/<service_name>', methods=['POST'])
def bootstrap_service(service_name):
    """Called by bootstrap.py on instance start."""
    pass


def handle_confirmation(post_data):
    res = requests.get(post_data['SubscribeURL'])
    app.logger.info('Subscription confirmation response:\ncontent: {}\nstatus_code: {}\njson: {}\nerror: {}'.format(
        res.content, res.status_code, res.json, res.error))
    if not res.ok:
        raise Exception('SNS subscription confirmation response is not ok')


def wait_for_instance_to_start(instance_id):
    ec2_conn = connect_to_ec2()
    instance_state = ec2_conn.get_all_instance_status(instance_id)[0].state_name
    app.logger.info('instance state: {}'.format(instance_state))
    while instance_state != 'running':
        time.sleep(10)
        instance_state = ec2_conn.get_all_instance_status(instance_id)[0].state_name
        app.logger.info('instance state: {}'.format(instance_state))


def handle_notification(post_data):
    """@todo (lucas) The environment should be backed into the ASG name as well.
    @todo (lucas) Add support for internal DNS (private IP)"""
    message = json.loads(post_data.get('Message'))
    event = message.get('Event')
    service_name = message.get('AutoScalingGroupName').split('-')[0]
    instance_id = message.get('EC2InstanceId').encode('utf-8')

    autoscale_conn = connect_to_autoscale()
    ec2_conn = connect_to_ec2()

    r = get_redis()

    app.logger.info('Got notification for event: {}'.format(event))

    if event == 'autoscaling:EC2_INSTANCE_LAUNCH':
        wait_for_instance_to_start(instance_id)
        group = autoscale_conn.get_all_groups([message.get(
            'AutoScalingGroupName').encode('utf-8')])[0]

        public_dns = ec2_conn.get_all_instances(
                instance_id)[0].instances[0].public_dns_name

        instance_number = get_next_service_number(service_name)
        new_hostname = '{}{}.{}'.format(service_name, instance_number,
            app.config['dns']['external'])

        app.logger.info('instance number: {}'.format(instance_number))
        app.logger.info('group: {}'.format(group.name))
        app.logger.info('public dns: {}'.format(public_dns))
        app.logger.info('service name: {}'.format(service_name))
        app.logger.info('new hostname: {}'.format(new_hostname))

        instance_info = {'hostname': new_hostname, 'public_dns': public_dns}

        # Insert the instance information into Redis for instance termination
        r.hset(service_name, instance_id, json.dumps(instance_info))

        app.logger.info('Persisted instance info for {}: {}'.format(
            instance_id, instance_info))

        try:
            add_cname(app.config['dns']['external_zone_id'],
                public_dns, new_hostname)
        except Exception, e:
            app.logger.info(e)

        # Set instance name
        ec2_conn.create_tags([instance_id], {
            'Name': new_hostname,
            'Service Name': service_name,
            'Pricing': 'on demand'
        })

    elif event == 'autoscaling:EC2_INSTANCE_TERMINATE':
        record = r.hget(service_name, instance_id)
        if record:
            instance_info = json.loads(record)
            app.logger.info("Terminating {} instance {} with CNAME {}".format(
                service_name, instance_id, instance_info.get('hostname')))

            delete_cname(app.config['dns']['external_zone_id'],
                instance_info.get('public_dns'), instance_info.get('hostname'))

            r.hdel(service_name, instance_id)
        else:
            app.logger.info("Record not found for {} instance {}".format(
                service_name, instance_id))
    else:
        app.logger.warning("Don't know how to handle event: {}".format(event))

    return 'ack'
