#!/bin/bash

# Exit immediately if a command returns a non-zero status
set -e

if [ -z "$1" ]; then
    echo "usage: source $0 [your-google-file.tfvars.json]"
    exit 1
else
  json_file_path=$(realpath "$1")
fi

echo "Parsing $json_file_path file to load auth as https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable"

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
project_root_path=$(realpath "$script_dir/..")
auth_path="$project_root_path/auth.json"

# Setup google credentials
credentials_json_b64=$(jq -r .google.credentials_json_b64 "$json_file_path")
credentials_json=$(echo "$credentials_json_b64" | base64 -d)
echo "$credentials_json" > "$auth_path"
export GOOGLE_APPLICATION_CREDENTIALS="$auth_path"
