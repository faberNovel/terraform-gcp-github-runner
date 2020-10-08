#!/bin/bash

set -e

# Hack to ensure VM is well started
sleep 15

RUNNER_USER="ubuntu"

sudo apt-get -y update

## Minimum tools
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
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
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

## Auto clean
cd "/home/$RUNNER_USER"
CLEANER_FILE="cleaner.sh"
sudo -u $RUNNER_USER touch $CLEANER_FILE
> $CLEANER_FILE
cat << EOF > $CLEANER_FILE
if [ $(id -u) -ne 0 ] ; then echo\"Please run as root\" ; exit 1 ; fi
rm -r /home/ubuntu/actions-runner/_work/_temp
docker image prune -a -f
EOF
echo "0 */6 * * * sudo sh /home/$RUNNER_USER/$CLEANER_FILE >> /home/$RUNNER_USER/cron-cleaner-log 2>&1" | sudo -u $RUNNER_USER crontab -

## Runner
cd "/home/$RUNNER_USER"
sudo -u $RUNNER_USER mkdir actions-runner && cd $_
sudo -u $RUNNER_USER curl -O -L https://github.com/actions/runner/releases/download/v2.169.1/actions-runner-linux-x64-2.169.1.tar.gz
sudo -u $RUNNER_USER tar xzf ./actions-runner-linux-x64-2.169.1.tar.gz

exit 0
