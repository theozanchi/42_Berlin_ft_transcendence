#!/bin/sh

python manage.py makemigrations game_manager
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0:8001 api_gateway.wsgi:application
