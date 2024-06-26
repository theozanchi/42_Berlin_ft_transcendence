#!/bin/sh

python manage.py makemigrations game_logic
python manage.py migrate

# Start the Daphne server
echo "Starting Daphne"
daphne -b 0.0.0.0 -p 8001 game_logic_service.asgi:application &

# Start the Gunicorn server
echo "Starting Gunicorn"
gunicorn --workers 3 --bind 0.0.0.0:8002 game_logic_service.wsgi:application

