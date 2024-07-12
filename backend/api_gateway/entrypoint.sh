#!/bin/sh

export DJANGO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')

python manage.py makemigrations api
python manage.py migrate
django-admin createsuperuser --noinput

# Install Redis CLI
apt-get update && apt-get install -y redis-tools

# Start the Daphne server
echo "Starting Daphne"
daphne -b 0.0.0.0 -p 8001 api_gateway.asgi:application

# Start the Gunicorn server
#echo "Starting Gunicorn"
#gunicorn --workers 3 --bind 0.0.0.0:8002 api_gateway.wsgi:application

