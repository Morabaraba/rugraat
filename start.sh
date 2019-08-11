#!/bin/bash
PORT=$1
HOST=$2
if [ -z "$1" ]
then
	PORT=8086
fi
if [ -z "$2" ]
then
	HOST=127.0.0.1
fi

if hash flask 2>/dev/null; then
	echo # flask avail
else
	source venv/bin/activate
fi

source export
flask run --port=$PORT --host=$HOST
