#!/bin/sh

export DJANGO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')

python manage.py makemigrations
python manage.py migrate

# Start the Gunicorn server
echo "Starting Gunicorn"
exec gunicorn --workers 3 --bind 0.0.0.0 game_manager_service.wsgi:application