FROM python:3.9-slim
RUN apt-get update && apt-get install -y \
    libpq-dev \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /code
COPY requirements.txt /code/
RUN pip install -r requirements.txt
COPY . /code/
RUN pip install djangorestframework
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:8002", "game_logic.wsgi:application"]
