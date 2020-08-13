#!/bin/sh

if [ $(id -u) -ne 0 ] ; then echo "Please run as root" ; exit 1 ; fi
rm -r /home/ubuntu/actions-runner/_work/_temp
docker image prune -a -f