FROM python:3.9-slim 

RUN apt-get update && apt-get install -y \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /code

# Copy and install requirements
COPY requirements.txt /code/
RUN	pip install -r requirements.txt

# Copy the rest of the code
COPY . /code/

# Collect static files, makemigration migrate data model and run gunicorn
CMD	python manage.py collectstatic --noinput && \
	python manage.py makemigrations authentication && \
	python manage.py migrate authentication && \
	gunicorn --workers 3 --bind 0.0.0.0:8003 authentication.wsgi:application
