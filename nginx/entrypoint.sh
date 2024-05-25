#!/bin/bash

VARS_TO_SUBSTITUTE='$SERVER_NAME $NODE_ENV $CERTS_DIR'

envsubst "$VARS_TO_SUBSTITUTE" < /tmp/nginx.conf > /tmp/nginx.conf.tmp

mkdir -p /etc/nginx/templates
mv /tmp/nginx.conf.tmp /etc/nginx/nginx.conf

nginx -g 'daemon off;'
