#!/bin/bash

if [ ! -f .env ]; then
	echo "No env file is present, a local one will be generated..."
	echo "PORT=8080" > .env
	echo "SPORT=8443" >> .env
	echo "NODE_ENV=development" >> .env
	echo "SERVER_NAME=localhost" >> .env
	echo "CERTS_DIR=/tmp/certs" >> .env
	echo "Done"
else
	echo "Using local .env file"
fi
