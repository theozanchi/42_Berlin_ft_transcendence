#!/bin/sh

python manage.py makemigrations game_manager
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0 game_manager_service.wsgi:application
