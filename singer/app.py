from flask import Flask

from functools import wraps

app = Flask('singer')
app.config['CSRF_ENABLED'] = False
app.config['SECRET_KEY'] = ''

_redis = None


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
