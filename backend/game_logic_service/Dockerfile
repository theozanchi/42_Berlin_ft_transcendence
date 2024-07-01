FROM python:3.9-slim

# Set environment variables
ENV DJANGO_SETTINGS_MODULE=game_logic_service.settings
ENV PYTHONPATH=/code:$PYTHONPATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/* && \
    redis-tools

# Install Python dependencies
COPY requirements.txt /code/
RUN pip install -r requirements.txt

# Copy Django project files
COPY . /code/

ENV DJANGO_SECRET_KEY python -c 'import secrets; print(secrets.token_urlsafe(50))'

# Collect static files, makemigration migrate data model and run daphne
CMD	python manage.py collectstatic --noinput && \
	python manage.py makemigrations game_logic && \
	python manage.py migrate game_logic && \
	gunicorn -b 0.0.0.0 game_logic_service.wsgi:application && \
    #daphne -b 0.0.0.0 -p 8001 game_logic_service.asgi:application