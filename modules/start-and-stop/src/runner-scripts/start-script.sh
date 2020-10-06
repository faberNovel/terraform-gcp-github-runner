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

log_debug "start startup script"

RUNNER_USER="ubuntu"

## Fetch registration token
ZONE=$(curl -H Metadata-Flavor:Google http://metadata/computeMetadata/v1/instance/zone)
TOKEN=$(gcloud auth print-identity-token)
FUNCTION_URL=$(gcloud compute instances describe $HOSTNAME --zone $ZONE --flatten="metadata[github-api-trigger-url]" --format=object)
GITHUB_ORG=$(gcloud compute instances describe $HOSTNAME --zone $ZONE --flatten="metadata[github-org]" --format=object)
PAYLOAD="{\"scope\":\"actions\",\"function\":\"createRegistrationTokenForOrg\",\"params\":{\"org\":\"$GITHUB_ORG\"}}"
REGISTRATION_TOKEN_RESULT=$(curl $FUNCTION_URL -H "Authorization: Bearer $(gcloud auth print-identity-token)" -d $PAYLOAD -H "Content-Type: application/json")
REGISTRATION_TOKEN=$(jq -r .token <<< "$REGISTRATION_TOKEN_RESULT")

if [ -n "$REGISTRATION_TOKEN" ]; then
  log_debug "registration token fetched with success"
else
  log_error "error fetching registration token"
fi

## Runner
cd "/home/$RUNNER_USER/actions-runner"
sudo -u $RUNNER_USER ./config.sh  --unattended --url https://github.com/$GITHUB_ORG --token $REGISTRATION_TOKEN --labels docker --name $HOSTNAME
sudo -u $RUNNER_USER ./run.sh &

log_debug "end startup script with success"

exit 0
