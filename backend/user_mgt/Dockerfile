# Use an official Python runtime as a parent image
FROM python:3.9-slim

RUN apt-get update && apt-get install -y netcat-openbsd

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install  -r requirements.txt
RUN pip install  -r requirements.txt


# Copy the current directory contents into the container at /app
COPY . /app/

# Make port 8000 available to the world outside this container
# EXPOSE 80

# Define environment variable
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Run the command to run migrations and then start the server

# 	echo \"from django.contrib.auth import get_user_model; User = get_user_model(); if not User.objects.filter(username='${USR_ADMIN}').exists(): User.objects.create_superuser('${USR_ADMIN}', '${USR_EMAIL}', '${USR_PASSWORD}')\" | python manage.py shell && \

CMD ["sh", "-c", " \
	python manage.py makemigrations oauth42 && \
	python manage.py migrate oauth42 && \
	python create_superuser.py && \
	gunicorn --bind 0.0.0.0 user_mgt.wsgi:application"]