#!/bin/sh

python manage.py makemigrations
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0:8003 game_lobby.wsgi:application
