#!/bin/bash

echo "start stop script"

RUNNER_USER="runner"

RUNNER_TYPE=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="labels[type]" --format=object)
if [ "$RUNNER_TYPE" = "ghost" ]; then
  echo "Ghost runner, exiting"
  exit 0
fi

## Fetch remove token
ZONE=$(curl -H Metadata-Flavor:Google http://metadata/computeMetadata/v1/instance/zone)
FUNCTION_URL=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[github-api-trigger-url]" --format=object)
GITHUB_ORG=$(gcloud compute instances describe "$HOSTNAME" --zone "$ZONE" --flatten="metadata[github-org]" --format=object)
PAYLOAD="{\"scope\":\"actions\",\"function\":\"createRemoveTokenForOrg\",\"params\":{\"org\":\"$GITHUB_ORG\"}}"
REMOVE_TOKEN_RESULT=$(curl "$FUNCTION_URL" -H "Authorization: Bearer $(gcloud auth print-identity-token)" -d "$PAYLOAD" -H "Content-Type: application/json")
REMOVE_TOKEN=$(jq -r .token <<< "$REMOVE_TOKEN_RESULT")

if [ -n "$REMOVE_TOKEN" ]; then
  echo "remove token fetched with success"
else
  echo "error fetching remove token" >&2
fi

## Runner
cd "/home/$RUNNER_USER/actions-runner" || exit 1
sudo -u $RUNNER_USER ./config.sh remove --token "$REMOVE_TOKEN"
cd /home/$RUNNER_USER || exit 1

echo "end stop with success"

exit 0
