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
    curl \
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
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . /app/
