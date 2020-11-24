#!/bin/bash

set -e

# Hack to ensure VM is well started
sleep 15

RUNNER_USER="runner"

# Add runner user with home folder
sudo useradd -m $RUNNER_USER

## Minimum tools
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
sudo apt-get -y install docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $RUNNER_USER

## Stack driver
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
sudo bash add-monitoring-agent-repo.sh
sudo apt-get -y update
sudo apt-get install -y 'stackdriver-agent=6.*'

## Runner
cd /home/$RUNNER_USER
sudo -u $RUNNER_USER mkdir actions-runner && cd "$_"
sudo -u $RUNNER_USER curl -O -L https://github.com/actions/runner/releases/download/v2.274.2/actions-runner-linux-x64-2.274.2.tar.gz
sudo -u $RUNNER_USER tar xzf ./actions-runner-linux-x64-2.274.2.tar.gz
exit 0
