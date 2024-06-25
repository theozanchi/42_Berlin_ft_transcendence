#!/bin/sh

python manage.py makemigrations api
python manage.py migrate

# Start the Daphne server
echo "Starting Daphne"
daphne -b 0.0.0.0 -p 8000 api_gateway.asgi:application &

# Start the Gunicorn server
echo "Starting Gunicorn"
gunicorn --workers 3 --bind 0.0.0.0:8001 api_gateway.wsgi:application

