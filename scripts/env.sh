#!/bin/bash

if [ -f .env ]; then
	rm .env
fi
	
echo "Generating .env..."
echo "PORT=8080" > .env
echo "SPORT=8443" >> .env
echo "NODE_ENV=development" >> .env
echo "SERVER_NAME=$(echo $SESSION_MANAGER | awk -F'/' '{print $2}' | sed 's/:@$//')" >> .env
# echo "SERVER_NAME=localhost" >> .env
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
echo "CLIENT_ID=u-s4t2ud-98e0a744ce6bf1e73c7bcdca10401695ec5530172f76df93352404c9cb311c19" >> .env
echo "CLIENT_SECRET=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" >> .env
echo "DJANGO_SECRET_KEY=secret" >> .env
echo "Done"
