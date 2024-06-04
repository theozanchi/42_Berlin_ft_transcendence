#!/bin/sh

python manage.py makemigrations game_logic
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0:8003 game_logic_service.wsgi:application
