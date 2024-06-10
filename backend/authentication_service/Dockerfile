FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /code

# Copy and install requirements
COPY requirements.txt /code/
RUN	pip install -r requirements.txt

# Copy the rest of the code
COPY . /code/

# Collect static files and run gunicorn
CMD	python manage.py collectstatic --noinput && \
	gunicorn --workers 3 --bind 0.0.0.0:8003 authentication.wsgi:application
