#!/bin/bash
while true; do
  case "$1" in
    --token ) token="$2"; shift 2 ;;
    --name ) name="$2"; shift 2 ;;
    --org ) org="$2"; shift 2 ;;
    * ) break ;;
  esac
done

sudo apt-get -y update

## Minimum tools
sudo apt-get -y install git
sudo apt-get -y install curl
sudo apt-get -y install jq

## Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo groupadd docker
sudo usermod -aG docker $USER

## Auto clean
crontab croncleaner

## Runner
mkdir actions-runner && cd actions-runner
curl -O -L https://github.com/actions/runner/releases/download/v2.169.1/actions-runner-linux-x64-2.169.1.tar.gz
tar xzf ./actions-runner-linux-x64-2.169.1.tar.gz
./config.sh  --unattended --url https://github.com/$org --token $token --labels docker --name $name
sudo ./svc.sh install
sudo ./svc.sh start
