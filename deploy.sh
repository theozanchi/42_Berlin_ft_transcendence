#!/bin/bash

# Deployment script for deploying application to Oracle Cloud Infrastructure

BRANCH=$1
INSTANCE_IP=$2
$USER=ubuntu
SSH_KEY_PATH=~/.ssh/id_rsa
REMOTE_DIR=/home/ubuntu/42_Berlin_ft_transcendence

# Check that arguments are valid
if [ -z "$BRANCH" ]; then
    echo "Usage: ./deploy.sh <branch> <instance_ip>"
    exit 1
fi
if [ -z "$INSTANCE_IP" ]; then
    echo "Usage: ./deploy.sh <branch> <instance_ip>"
    exit 1
fi

# Assigning the correct env file based on the branch
if [ "$BRANCH" == "main" ]; then
	ENV_FILE="env/.env.prod"
	INSTANCE_NAME="production"
elif [ "$BRANCH" == "development" ]; then
	ENV_FILE="env/.env.dev"
	INSTANCE_NAME="development"
else
	echo "Unsupported branch: $BRANCH"
	exit 1
fi

# SSH into the instance and pull latest changes from the specified branch
ssh -i $SSH_KEY_PATH $USER@$INSTANCE_IP << EOF
    cd $REMOTE_DIR
    git fetch origin $BRANCH
    git checkout $BRANCH
    git pull origin $BRANCH
EOF

# Restarting the application
ssh -i $SSH_KEY_PATH $USER@$INSTANCE_IP << EOF
    cd $REMOTE_DIR
    docker-compose --env-file $ENV_FILE down
    docker-compose --env-file $ENV_FILE up --build -d
EOF

echo "Deployment to $INSTANCE_NAME production ($INSTANCE_IP) completed."
