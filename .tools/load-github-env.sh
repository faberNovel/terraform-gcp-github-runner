#!/bin/bash

echo "Parsing $1 file to load github envs"

export ORG=$(jq -r .github.organisation $1)
export KEY=$(jq -r .github.key_pem_b64 $1 | base64 -d)
export APP_ID=$(jq -r .github.app_id $1)
export INSTALLATION_ID=$(jq -r .github.app_installation_id $1)
export CLIENT_ID=$(jq -r .github.client_id $1)
export CLIENT_SECRET=$(jq -r .github.client_secret $1)