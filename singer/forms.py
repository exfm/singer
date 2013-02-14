from flask.ext.wtf import Form, TextField, Required


class BootstrapForm(Form):
    host = TextField('Hostname to run against', validators=[Required()])
    private_ip = TextField('Private IP of the instance',
        validators=[Required()])
    instance_id = TextField('Instance ID', validators=[Required()])
    user_data = TextField('User Data')


class AssignAppNumberForm(Form):
    instance_id = TextField('Instance ID', validators=[Required()])
    host = TextField('Public Hostname', validators=[Required()])
