# Use the official Nginx image as the base image
FROM nginx:latest

# Set the working directory in the container
WORKDIR /frontend

# Install system dependencies
RUN apt-get update && apt-get install -y \
build-essential \
curl \
libpq-dev \
&& apt-get clean

# Install Node.js and npm (if needed) to manage JavaScript dependencies
RUN apt-get update && apt-get install -y \
gnupg \
&& curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
&& apt-get install -y nodejs

# Install Three.js and any other JavaScript dependencies using npm
RUN npm install three

# Install Vite globally
RUN npm install -g vite
RUN npm install @tweenjs/tween.js

# Build the Vite project
WORKDIR /frontend/js/pong
RUN npm install
RUN npm run build

# Copy the project files
COPY . /frontend/

# Expose port 80 to the Docker host, so external connections can be made to your container
EXPOSE 80

# Start Nginx server (this is the default CMD of the nginx image)
CMD ["nginx", "-g", "daemon off;"]
