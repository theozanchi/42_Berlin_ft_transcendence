#!/bin/sh

apt install redis-tools
# Collect static files
python manage.py collectstatic --noinput

# Make migrations
python manage.py makemigrations game_logic

# Migrate the database
python manage.py migrate game_logic

# Start Daphne server
#daphne -b 0.0.0.0 -p 8001 game_logic_service.asgi:application
gunicorn --workers 3 --bind 0.0.0.0:8000 game_logic_service.wsgi:application
