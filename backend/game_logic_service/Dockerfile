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

ENV DJANGO_SECRET_KEY python -c 'import secrets; print(secrets.token_urlsafe(50))'

# Collect static files, makemigration migrate data model and run daphne
CMD	["/bin/sh", "/code/entrypoint.sh"]
