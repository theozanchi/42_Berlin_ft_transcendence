#!/bin/bash
set -x
# Deployment script for deploying application to Oracle Cloud Infrastructure

BRANCH=$1
INSTANCE_IP=$2
SSH_KEY_PATH=~/.ssh/id_rsa
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

cat ~/.ssh/id_rsa

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
    docker-compose down
    docker-compose up --build -d
EOF

echo "Deployment to $BRANCH instance completed."
