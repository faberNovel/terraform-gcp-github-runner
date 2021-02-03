#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

script_dir=$(dirname "$0")
project_root_path=$(realpath "$script_dir/../..")

cd "$project_root_path"

env_file="google-ci.tfvars.json"

apk add jq
bash image/packer.sh --env-file "$env_file" --packer-action validate
