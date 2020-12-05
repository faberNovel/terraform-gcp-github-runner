#!/bin/bash

echo "start startup script"

RUNNER_USER="runner"

## Start stack driver
sudo service stackdriver-agent start

## Fetch registration token
ZONE=$(curl -H Metadata-Flavor:Google http://metadata/computeMetadata/v1/instance/zone)
FUNCTION_URL=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[github-api-trigger-url]" --format=object)
GITHUB_ORG=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[github-org]" --format=object)
TAINT_LABELS=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[taint-labels]" --format=object)
RUNNER_TYPE=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[runner-type]" --format=object)
GOOGLE_ENV=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="labels[env]" --format=object)
PAYLOAD="{\"scope\":\"actions\",\"function\":\"createRegistrationTokenForOrg\",\"params\":{\"org\":\"$GITHUB_ORG\"}}"
REGISTRATION_TOKEN_RESULT=$(curl "$FUNCTION_URL" -H "Authorization: Bearer $(gcloud auth print-identity-token)" -d "$PAYLOAD" -H "Content-Type: application/json")
REGISTRATION_TOKEN=$(jq -r .token <<< "$REGISTRATION_TOKEN_RESULT")

if [ -n "$REGISTRATION_TOKEN" ]; then
  echo "registration token fetched with success"
else
  echo "error fetching registration token" >&2
fi

## Runner
cd "/home/$RUNNER_USER/actions-runner" || exit 1
if [ "$TAINT_LABELS" = true ]; then
  echo "runner labels will be tainted"
  docker_label="docker-$GOOGLE_ENV"
else
  echo "runner labels will not be tainted"
  docker_label="docker"
fi
sudo -u $RUNNER_USER ./config.sh  --unattended --url https://github.com/"$GITHUB_ORG" --token "$REGISTRATION_TOKEN" --labels "$docker_label","$GOOGLE_ENV","$HOSTNAME" --name "$HOSTNAME"
if [ "$RUNNER_TYPE" = "ghost" ]; then
  echo "ghost runner, not launching runner"
  sudo -u $RUNNER_USER ./run.sh &
else   
  echo "runner type $RUNNER_TYPE, launching runner"
  sudo -u $RUNNER_USER ./run.sh &
fi

echo "end startup script with success"

exit 0
