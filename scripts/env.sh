#!/bin/bash

if [ -f .env ]; then
	rm .env
fi
	
echo "Generating .env..."
echo "PORT=8080" > .env
echo "SPORT=8443" >> .env
echo "NODE_ENV=development" >> .env
echo "SERVER_NAME=$(echo $SESSION_MANAGER | awk -F'/' '{print $2}' | sed 's/:@$//')" >> .env
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
echo "CLIENT_ID=u-s4t2ud-6f92d8e490cf1c3094b3b3b5f78a3aced3b3e6259f214a2a9425ff138e6d6ed3" >> .env
echo "CLIENT_SECRET=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" >> .env
echo "DJANGO_SECRET_KEY=secret" >> .env
echo "Done"
