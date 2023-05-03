#!/bin/bash

set -e

# Hack to ensure VM is well started
sleep 15

RUNNER_USER="runner"

# Add runner user with home folder
sudo useradd -m $RUNNER_USER

## Minimum tools
echo 'debconf debconf/frontend select Noninteractive' | sudo debconf-set-selections
sudo apt-get -y update
sudo apt-get -y install \
    git \
    curl \
    jq

## Docker
sudo apt-get -y install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/debian \
   $(lsb_release -cs) \
   stable"
sudo apt-get -y update
DOCKER_VERSION="5:23.0.5-1~debian.11~bullseye"
sudo apt-get -y install docker-ce=$DOCKER_VERSION docker-ce-cli=$DOCKER_VERSION containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $RUNNER_USER
# Esnure Docker is correctly setup
sudo -u $RUNNER_USER docker run hello-world

## Stack driver
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
sudo bash add-monitoring-agent-repo.sh
sudo apt-get -y update
sudo apt-get install -y 'stackdriver-agent=6.*'

## Runner
cd /home/$RUNNER_USER
sudo -u $RUNNER_USER mkdir actions-runner && cd "$_"
ACTIONS_RUNNER_DATA=$(curl -sL https://api.github.com/repos/actions/runner/releases/latest)
# Get latest runner version, omitting the version prefix (v)
ACTIONS_RUNNER_LATEST_VERSION=$(jq -r '.tag_name' <<< "$ACTIONS_RUNNER_DATA" | cut -c 2-)
ACTIONS_RUNNER_URL=$(jq -r --arg latest_version "$ACTIONS_RUNNER_LATEST_VERSION" '.assets[] | select(.name | contains("actions-runner-linux-x64-" + $latest_version + ".tar.gz")) | .browser_download_url' <<< "$ACTIONS_RUNNER_DATA")
echo "Download latest runner version from $ACTIONS_RUNNER_URL"
sudo -u $RUNNER_USER curl -O -L "$ACTIONS_RUNNER_URL"
sudo -u $RUNNER_USER tar xzf ./actions-runner-linux-x64-*.tar.gz
exit 0
