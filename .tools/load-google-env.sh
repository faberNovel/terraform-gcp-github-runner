#!/bin/bash

# Usage: 
# extract_google_params_from_json_file json_key json_file_path
# return "null" if not found
extract_params_from_json_file() {
  local json_key="$1"
  local json_file_path="$2"
  jq -r "$json_key" "$json_file_path"
}

# Usage: 
# export_if_not_null key value
export_if_not_null() {
  local key="$1"
  local value="$2"
  if [ "$value" != "null" ]; then
    export "$key"="$value"
  fi
}

# Usage: 
# extract_and_export json_key json_file_path export_key
extract_and_export() {
  local json_key="$1"
  local json_file_path="$2"
  local export_key="$3"
  value=$(extract_params_from_json_file "$json_key" "$json_file_path")
  export_if_not_null "$export_key" "$value"
}

# Exit immediately if a command returns a non-zero status
set -e

if [ -z "$1" ]; then
    echo "usage: source $0 [your-google-file.tfvars.json]"
    exit 1
else
  json_file_path=$(realpath "$1")
fi
echo "Parsing $json_file_path file to load gcp env and auth as https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable"

# Setup google credentials
credentials_json_b64=$(extract_params_from_json_file .google.credentials_json_b64 "$json_file_path")
credentials_json=$(echo "$credentials_json_b64" | base64 -d)
echo "$credentials_json" > auth.json
auth_path=$(realpath auth.json)
export GOOGLE_APPLICATION_CREDENTIALS="$auth_path"

# Setup project envs vars
extract_and_export ".google.region" "$json_file_path" "GOOGLE_REGION"
extract_and_export ".google.zone" "$json_file_path" "GOOGLE_ZONE"
extract_and_export ".google.env" "$json_file_path" "GOOGLE_ENV"
extract_and_export ".google.project" "$json_file_path" "GOOGLE_PROJECT"

extract_and_export ".runner.type" "$json_file_path" "RUNNER_MACHINE_TYPE"
extract_and_export ".runner.idle_count" "$json_file_path" "RUNNER_IDLE_COUNT"
extract_and_export ".runner.total_count" "$json_file_path" "RUNNER_TOTAL_COUNT"
