FROM python:3.9-slim

RUN apt-get update && apt-get install -y \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /code

COPY requirements.txt /code/
RUN pip install --no-cache-dir -r requirements.txt


COPY . /code/

COPY entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh

ENV DJANGO_SECRET_KEY python -c 'import secrets; print(secrets.token_urlsafe(50))'

ENTRYPOINT ["/bin/sh", "/code/entrypoint.sh"]