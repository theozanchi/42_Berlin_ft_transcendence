# syntax=docker/dockerfile:1
FROM python:3.9-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY requirements.txt /code/
RUN pip install -r requirements.txt
RUN pip install djangorestframework
COPY . /code/
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:8001", "game_config.wsgi:application"]
