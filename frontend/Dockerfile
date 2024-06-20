# Use the official Nginx image as the base image
FROM nginx:latest

WORKDIR /usr/share/nginx/html

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

# Remove default nginx index page
RUN rm /usr/share/nginx/html/index.html

# Copy frontend files into the container
COPY ./src /usr/share/nginx/html

# Expose port 80 to the Docker host, so external connections can be made to your container
EXPOSE 80

# Set the default command to start Nginx (handled by entrypoint script)
CMD ["/docker-entrypoint.sh"]