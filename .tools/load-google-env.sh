#!/bin/bash

# Usage: 
# extract_google_params_from_json_file key file_path
extract_google_params_from_json_file() {
  local key="$1"
  local file_path="$2"
  jq -r ".google.$key" "$file_path"
}

# Exit immediately if a command returns a non-zero status
set -e

if [ -z "$1" ]; then
    echo "usage: source $0 [your-google-file.tfvars.json]"
    exit 1
fi
echo "Parsing $1 file to load gcp env and auth as https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable"

credentials_json_b64=$(extract_google_params_from_json_file credentials_json_b64 "$1")
credentials_json=$(echo "$credentials_json_b64" | base64 -d)
echo "$credentials_json" > auth.json
auth_path=$(realpath auth.json)

google_region=$(extract_google_params_from_json_file region "$1")
google_zone=$(extract_google_params_from_json_file zone "$1")
google_env=$(extract_google_params_from_json_file env "$1")
google_project=$(extract_google_params_from_json_file project "$1")

export GOOGLE_APPLICATION_CREDENTIALS=$auth_path
export GOOGLE_REGION=$google_region
export GOOGLE_ZONE=$google_zone
export GOOGLE_ENV=$google_env
export GOOGLE_PROJECT=$google_project
