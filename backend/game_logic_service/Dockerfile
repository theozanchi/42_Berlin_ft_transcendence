# syntax=docker/dockerfile:1
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /code

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    && apt-get clean

# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

# Install Python dependencies
COPY requirements.txt /code/
RUN pip install -r requirements.txt

# Install Vite globally
RUN npm install -g vite
RUN npm install @tweenjs/tween.js

# Copy Vite project files
COPY pong /code/pong

# Build the Vite project
WORKDIR /code/pong
RUN npm install
RUN npm run build

# Copy Django project files
WORKDIR /code
COPY . /code/

# Expose the port
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/bin/sh", "/code/entrypoint.sh"]
