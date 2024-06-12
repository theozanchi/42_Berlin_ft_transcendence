#!/bin/sh

python manage.py makemigrations game_lobby
python manage.py migrate

# Start Gunicorn for HTTP requests
exec gunicorn --workers 3 --bind 0.0.0.0:8004 game_lobby_service.wsgi:application

# Start Daphne for WebSocket connections (bind to another port than wsgi app!!)
exec daphne -b 0.0.0.0 -p 8005 game_lobby_service.asgi:application