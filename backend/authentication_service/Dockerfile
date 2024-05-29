# syntax=docker/dockerfile:1
FROM python:3
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=authentication.settings
WORKDIR /code
COPY requirements.txt /code/
RUN	pip install -r requirements.txt && \
	pip install djangorestframework
COPY . /code/
CMD	python manage.py collectstatic --noinput && \
	gunicorn --workers 3 --bind 0.0.0.0:8003 authentication.wsgi:application
