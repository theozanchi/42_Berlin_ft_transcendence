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

# Expose the port
EXPOSE 8000

# Collect static files, makemigration migrate data model and run daphne
CMD	python manage.py collectstatic --noinput && \
	python manage.py makemigrations game_logic && \
	python manage.py migrate game_logic && \
	daphne -b 0.0.0.0 -p 8002 game_logic_service.asgi:application
