#!/bin/bash

# Exit immediately if a command returns a non-zero status
saved_options=$(set +o)
set -e

if [ -z "$1" ]; then
    echo "usage: source $0 [your-google-file.tfvars.json]"
    exit 1
fi

echo "Parsing $1 file to load gcp env and auth as https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable"

credentials_json_b64=$(jq -r .google.credentials_json_b64 $1)
credentials_json=$(echo $credentials_json_b64 | base64 -d)
echo $credentials_json > auth.json
auth_path=$(realpath auth.json)

google_region=$(jq -r .google.region $1)
google_zone=$(jq -r .google.zone $1)
google_env=$(jq -r .google.env $1)
google_project=$(jq -r .google.project $1)

export GOOGLE_APPLICATION_CREDENTIALS=$auth_path
export GOOGLE_REGION=$google_region
export GOOGLE_ZONE=$google_zone
export GOOGLE_ENV=$google_env
export GOOGLE_PROJECT=$google_project

eval "$saved_options"
