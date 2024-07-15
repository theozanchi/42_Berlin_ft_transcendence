FROM python:3.9-slim

ENV DJANGO_SETTINGS_MODULE=api_gateway.settings
ENV PYTHONPATH=/code:$PYTHONPATH

WORKDIR /code

COPY . /code/

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh /code/entrypoint.sh
RUN chmod +x /code/entrypoint.sh


ENTRYPOINT ["/bin/sh", "/code/entrypoint.sh"]
