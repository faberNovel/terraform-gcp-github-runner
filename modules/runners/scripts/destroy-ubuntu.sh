#!/bin/bash
while true; do
  case "$1" in
    --token ) token="$2"; shift 2 ;;
    * ) break ;;
  esac
done

## Runner
cd actions-runner
sudo ./svc.sh uninstall
./config.sh remove --token $token
