#!/bin/sh

python manage.py makemigrations game_logic
python manage.py migrate

echo "Starting Daphne"
exec daphne -b 0.0.0.0 -p 8002 game_logic_service.asgi:application