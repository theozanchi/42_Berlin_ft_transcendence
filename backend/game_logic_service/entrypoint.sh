#!/bin/sh

# Generate a secret key
export DJANGO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')

apt install redis-tools
# Collect static files
python manage.py collectstatic --noinput

# Make migrations
python manage.py makemigrations game_logic

# Migrate the database
python manage.py migrate game_logic

# Start Daphne server
daphne -b 0.0.0.0 -p 8001 game_logic_service.asgi:application
