# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory
WORKDIR /app

# Install Oh My Zsh
RUN apt-get update && apt-get install -y zsh && \
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install PostgresSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    postgresql \
    postgresql-contrib \
    make \
    docker.io \
    curl
# psql \
# && curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose \
# && chmod +x /usr/local/bin/docker-compose

# service postgresql start
# su - postgres -c "psql -c \"CREATE USER $(POSTGRES_USER) WITH PASSWORD $(POSTGRES_PASSWORD);\""
# su - postgres -c "psql -c \"CREATE DATABASE $(POSTGRES_DB) OWNER $(POSTGRES_USER);\""

# COPY .zshrc /root
# Set Zsh as the default shell
SHELL ["/bin/zsh", "-c"]

# Install dependencies
COPY .devcontainer/requirements.txt /app/
RUN pip install  -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . /app/


# Version: 1.87.2
# Commit: 863d2581ecda6849923a2118d93a088b0745d9d6
# Date: 2024-03-08T15:14:59.643Z
# Electron: 27.3.2
# ElectronBuildId: 26836302
# Chromium: 118.0.5993.159
# Node.js: 18.17.1
# V8: 11.8.172.18-electron.0
# OS: Linux x64 5.15.0-113-generic