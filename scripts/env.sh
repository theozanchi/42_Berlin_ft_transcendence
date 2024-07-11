#!/bin/bash

if [ ! -f .env ]; then
	echo "No env file is present, a local one will be generated..."
	echo "PORT=8080" > .env
	echo "SPORT=8443" >> .env
	echo "NODE_ENV=development" >> .env
	echo "SERVER_NAME=localhost" >> .env
	echo "CERTS_DIR=/tmp/certs" >> .env
	echo "POSTGRES_NAME=postgres" >> .env
	echo "POSTGRES_USER=postgres" >> .env
	echo "POSTGRES_PASSWORD=postgres" >> .env
	echo "REDIS_PASSWORD=redis" >> .env
	echo "DJANGO_SUPERUSER_USERNAME=admin" >> .env
	echo "DJANGO_SUPERUSER_EMAIL=admin@pongerpuffgirl.fun" >> .env
	echo "DJANGO_SUPERUSER_PASSWORD=admin" >> .env
	echo "Done"
else
	echo "Using local .env file"
fi
