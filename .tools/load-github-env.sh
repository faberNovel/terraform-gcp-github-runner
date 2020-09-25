#!/bin/bash

# Exit immediately if a command returns a non-zero status
saved_options=$(set +o)
set -e

if [ -z "$1" ]; then
    echo "usage: source $0 [your-github-file.tfvars.json]"
    exit 1
fi

echo "Parsing $1 file to load github envs"

org=$(jq -r .github.organisation $1)
key=$(jq -r .github.key_pem_b64 $1 | base64 -d)
app_id=$(jq -r .github.app_id $1)
installation_id=$(jq -r .github.app_installation_id $1)
client_id=$(jq -r .github.client_id $1)
client_secret=$(jq -e -r .github.client_secret $1)

export ORG=$org
export KEY=$key
export APP_ID=$app_id
export INSTALLATION_ID=$installation_id
export CLIENT_ID=$client_id
export CLIENT_SECRET=$client_secret

eval "$saved_options"
