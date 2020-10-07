#!/bin/bash

set -e

sleep 10

RUNNER_USER="ubuntu"

sudo apt-get -y update

## Minimum tools
sudo apt-get -y install git
sudo apt-get -y install curl
sudo apt-get -y install jq

## Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $RUNNER_USER

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
