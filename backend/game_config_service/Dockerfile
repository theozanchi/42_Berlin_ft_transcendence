FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /code/
RUN pip install -r requirements.txt

# Copy Django project files
COPY . /code/

# Collect static files, makemigration migrate data model and run gunicorn
CMD	python manage.py collectstatic --noinput && \
	python manage.py makemigrations base && \
	python manage.py migrate base && \
	gunicorn --workers 3 --bind 0.0.0.0:8001 game_config.wsgi:application
