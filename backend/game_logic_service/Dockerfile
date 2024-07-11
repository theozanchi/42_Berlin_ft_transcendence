FROM python:3.9-slim

# Set environment variables
ENV DJANGO_SETTINGS_MODULE=game_logic_service.settings
ENV PYTHONPATH=/code:$PYTHONPATH
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

# Copy the entrypoint script
COPY entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh

# Use the entrypoint script to start the application
CMD ["/code/entrypoint.sh"]