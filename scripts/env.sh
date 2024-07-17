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
	echo "POSTGRES_HOST=db" >> .env
	echo "POSTGRES_PORT=5432" >> .env
	echo "REDIS_PASSWORD=redis" >> .env
	echo "DJANGO_SUPERUSER_USERNAME=admin" >> .env
	echo "DJANGO_SUPERUSER_EMAIL=admin@pongerpuffgirl.fun" >> .env
	echo "DJANGO_SUPERUSER_PASSWORD=admin" >> .env
	echo "CLIENT_ID=u-s4t2ud-9e96f9ff721ed4a4fdfde4cd65bdccc71959f355f62c3a5079caa896688bffe8" >> .env
	echo "CLIENT_SECRET=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" >> .env
	echo "DJANGO_SECRET_KEY=secret" >> .env
	echo "Done"
else
	echo "Using local .env file"
fi