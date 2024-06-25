FROM python:3.9-slim

WORKDIR /code

COPY . /code/

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh

ENV DJANGO_SECRET_KEY python -c 'import secrets; print(secrets.token_urlsafe(50))'

ENTRYPOINT ["/bin/sh", "/code/entrypoint.sh"]
