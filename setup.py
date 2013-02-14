#!/usr/bin/env python

import os
import sys

import singer

try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

if sys.argv[-1] == 'publish':
    os.system('python setup.py sdist upload')
    sys.exit()

packages = [
    'singer'
]

requires = []

setup(
    name='singer',
    version=singer.__version__,
    description='Server side helper for Fabric and AWS.',
    long_description='',
    author='Jonathan Marmor',
    author_email='jm@ex.fm',
    url='http://github.com/exfm/singer',
    packages=packages,
    package_dir={'singer': 'singer'},
    include_package_data=True,
    install_requires=requires,
    license='MIT',
    zip_safe=False,
    classifiers=(
        'Intended Audience :: Developers',
        'Natural Language :: English',
        'License :: OSI Approved :: MIT',
        'Programming Language :: Python'
    ),
)
