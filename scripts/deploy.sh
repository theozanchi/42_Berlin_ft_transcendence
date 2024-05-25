#!/bin/bash
set -x
# Deployment script for deploying application to Oracle Cloud Infrastructure

BRANCH=$1
INSTANCE_IP=$2
SSH_KEY=$3
USER=ubuntu
REMOTE_DIR=/home/ubuntu/42_Berlin_ft_transcendence

# Check that arguments are valid
if [ -z "$BRANCH" ]; then
	echo "Branch not specified."
    echo "Usage: ./deploy.sh <branch> <instance_ip> <ssh_key>"
    exit 1
fi

if [ -z "$INSTANCE_IP" ]; then
	echo "Instance IP not specified."
    echo "Usage: ./deploy.sh <branch> <instance_ip> <ssh_key>"
    exit 1
fi

if [ -z "$SSH_KEY" ]; then
	echo "SSH key missing"
    echo "Usage: ./deploy.sh <branch> <instance_ip> <ssh_key>"
    exit 1
fi

# Save the key in a file
echo $SSH_KEY > ~/.ssh/id_rsa

# SSH into the instance and pull latest changes from the specified branch
ssh $USER@$INSTANCE_IP << EOF
    cd $REMOTE_DIR
    git fetch origin $BRANCH
    git checkout $BRANCH
    git pull origin $BRANCH
EOF

# Restarting the application
ssh $USER@$INSTANCE_IP << EOF
    cd $REMOTE_DIR
    docker-compose down
    docker-compose up --build -d
EOF

echo "Deployment to $BRANCH instance completed."
