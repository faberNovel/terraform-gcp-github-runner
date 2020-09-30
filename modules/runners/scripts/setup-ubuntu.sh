#!/bin/bash

## Ensure all setup succeed
set -e

while true; do
  case "$1" in
    --token ) token="$2"; shift 2 ;;
    --name ) name="$2"; shift 2 ;;
    --org ) org="$2"; shift 2 ;;
    * ) break ;;
  esac
done

# Hack to ensure VM is well started
sleep 15

sudo apt-get -y update

## Minimum tools
sudo apt-get -y install \
    git \
    curl \
    jq

## Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

## Auto clean
crontab cron-cleaner

## Runner
mkdir actions-runner && cd actions-runner
curl -O -L https://github.com/actions/runner/releases/download/v2.169.1/actions-runner-linux-x64-2.169.1.tar.gz
tar xzf ./actions-runner-linux-x64-2.169.1.tar.gz
./config.sh  --unattended --url https://github.com/$org --token $token --labels docker --name $name
sudo ./svc.sh install
sudo ./svc.sh start

exit 0