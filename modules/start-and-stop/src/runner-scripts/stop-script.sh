#!/bin/bash

## Catching error, log it, and exit
trap 'catch $? $LINENO' ERR

catch() {
  log_error "error $1 occurred on line $2"
  exit 1    
}

log_debug() {
  gcloud logging write startup-script "$HOSTNAME : $1" --severity=DEBUG
}

log_error() {
  gcloud logging write startup-script "$HOSTNAME : $1" --severity=ERROR
}

log_debug "start stop script"

## Fetch remove token
ZONE=$(curl -H Metadata-Flavor:Google http://metadata/computeMetadata/v1/instance/zone)
FUNCTION_URL=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[github-api-trigger-url]" --format=object)
GITHUB_ORG=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[github-org]" --format=object)
PAYLOAD="{\"scope\":\"actions\",\"function\":\"createRemoveTokenForOrg\",\"params\":{\"org\":\"$GITHUB_ORG\"}}"
REMOVE_TOKEN_RESULT=$(curl "$FUNCTION_URL" -H "Authorization: Bearer $(gcloud auth print-identity-token)" -d "$PAYLOAD" -H "Content-Type: application/json")
REMOVE_TOKEN=$(jq -r .token <<< "$REMOVE_TOKEN_RESULT")

if [ -n "$REMOVE_TOKEN" ]; then
  log_debug "remove token fetched with success"
else
  log_error "error fetching remove token"
fi

## Runner
cd /home/ubuntu/actions-runner || exit 1
sudo -u ubuntu ./config.sh remove --token "$REMOVE_TOKEN"
cd /home/ubuntu || exit 1
rm -rf actions-runner

log_debug "end stop with success"

exit 0
