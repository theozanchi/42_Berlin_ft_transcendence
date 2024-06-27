FROM python:3.9-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV DJANGO_SETTINGS_MODULE=game_manager_service.settings
ENV PYTHONPATH=/code:$PYTHONPATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /code

COPY requirements.txt /code/
RUN pip install -r requirements.txt

COPY . /code/

COPY entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh

RUN echo DJANGO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))') >> .env

ENTRYPOINT ["/bin/sh", "/code/entrypoint.sh"]