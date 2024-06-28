FROM python:3.9-slim

ENV DJANGO_SECRET_KEY python -c 'import secrets; print(secrets.token_urlsafe(50))'
ENV DJANGO_SETTINGS_MODULE=api_gateway.settings
ENV PYTHONPATH=/code:$PYTHONPATH

WORKDIR /code

COPY . /code/

RUN pip install  -r requirements.txt

COPY entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh


ENTRYPOINT ["/bin/sh", "/code/entrypoint.sh"]
