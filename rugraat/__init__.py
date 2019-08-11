import os

from flask import (Flask, request, session, g, redirect, url_for, abort,
	render_template, flash)
from click import echo

app = Flask(__name__)
app.config.from_object(__name__)

@app.route('/')
def index():
	wrapper = 'wrapper-1.html'
	wrapper_index = request.args.get('i')
	if wrapper_index:
		wrapper_index = int(wrapper_index) # make sure we only allow index integers
		wrapper = f'wrapper-{wrapper_index}.html'
	return render_template('index.html', wrapper= wrapper)

SHELL_RM_PYCHACHE = '''find . -name '__pycache__' -exec rm -rf {} \;'''
'''remove all `__pycache__` directories on a *nix machine using `find` and `rm`.

https://stackoverflow.com/a/28365204/4434121 thanks buddy, wanted to comment but I don't have the cred. I just used rm in my find.
'''

@app.cli.command()
def rm_pycache():
	r = os.system(SHELL_RM_PYCHACHE)
	echo(r)
	return r