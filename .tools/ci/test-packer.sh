#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

script_dir=$(dirname "$0")
project_root_path=$(realpath "$script_dir/../..")

cd "$project_root_path"

ci=${CI:-false}
if [ "$ci" = true ]; then
  echo "Running in CI"
  env_file="google.tfvars.json"
else
  echo "Not running in CI"
  env_file="google-dev.tfvars.json"
fi

apk add jq
bash image/packer.sh --env-file "$env_file" --packer-action validate
