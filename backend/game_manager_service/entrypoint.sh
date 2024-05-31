#!/bin/sh

python manage.py makemigrations base
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0:8001 game_manager.wsgi:application
