#!/bin/bash
set -e

# Install Vite globally if not already installed
if ! command -v vite &> /dev/null; then
    echo "Installing Vite globally..."
    npm install -g vite
fi

# Install Tween.js globally if not already installed
if ! command -v tween.js &> /dev/null; then
    echo "Installing Tween.js globally..."
    npm install -g @tweenjs/tween.js
fi

# Change directory to your frontend project inside the container
cd /usr/share/nginx/html/js/pong

# Install local dependencies for the Vite project
echo "Installing local dependencies..."
npm install

# Build the Vite project
echo "Building the Vite project..."
npm run build

# Start Nginx server
echo "Starting Nginx server..."
nginx -g 'daemon off;'
