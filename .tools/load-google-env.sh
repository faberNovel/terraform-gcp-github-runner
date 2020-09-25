#!/bin/bash

echo "Parsing $1 file to auth gcp as https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable"

credentials_json_b64=$(jq -r .google.credentials_json_b64 $1)
credentials_json=$(echo $credentials_json_b64 | base64 -d)
echo $credentials_json > auth.json
authPath=$(realpath auth.json) 
export GOOGLE_APPLICATION_CREDENTIALS=$authPath
export GOOGLE_ZONE=$(jq -r .google.zone $1)
export GOOGLE_ENV=$(jq -r .google.env $1)
export GOOGLE_PROJECT=$(jq -r .google.project $1)
