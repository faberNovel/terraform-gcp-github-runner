#!/bin/bash

# Usage: 
# extract_github_params_from_json_file key file_path
extract_github_params_from_json_file() {
  local key="$1"
  local file_path="$2"
  echo $(jq -r ".github.$key" $file_path)
}

# Exit immediately if a command returns a non-zero status
set -e

if [ -z "$1" ]; then
    echo "usage: source $0 [your-github-file.tfvars.json]"
    exit 1
fi

echo "Parsing $1 file to load github envs"

org=$(extract_github_params_from_json_file organisation $1)
key=$(extract_github_params_from_json_file key_pem_b64 $1)
app_id=$(extract_github_params_from_json_file app_id $1)
installation_id=$(extract_github_params_from_json_file app_installation_id $1)
client_id=$(extract_github_params_from_json_file client_id $1)
client_secret=$(extract_github_params_from_json_file client_secret $1)

export GITHUB_ORG=$org
export GITHUB_KEY_B64=$key
export GITHUB_APP_ID=$app_id
export GITHUB_INSTALLATION_ID=$installation_id
export GITHUB_CLIENT_ID=$client_id
export GITHUB_CLIENT_SECRET=$client_secret
