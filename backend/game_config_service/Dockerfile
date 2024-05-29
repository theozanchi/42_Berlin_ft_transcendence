# syntax=docker/dockerfile:1
FROM python:3
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /code

COPY requirements.txt /code/
RUN pip install -r requirements.txt

# Collect static files
RUN echo "Collect static files" \
    python manage.py collectstatic --noinput

# Apply database migrations
RUN echo "Apply database migrations" \
    python manage.py migrate

COPY . /code/
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:8001", "game_config.wsgi:application"]
