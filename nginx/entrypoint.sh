#!/bin/bash

envsubst < /tmp/nginx.conf > /tmp/nginx.conf.tmp

mkdir -p /etc/nginx/templates
mv /tmp/nginx.conf.tmp /etc/nginx/templates/nginx.conf

nginx -g 'daemon off;'

