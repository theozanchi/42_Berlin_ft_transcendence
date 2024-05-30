#!/bin/sh

echo "Make migrations"
python manage.py makemigrations

echo "Apply database migrations"
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0:8001 game_logic.wsgi:application
