#!/bin/sh
# Exit immediately if a command returns a non-zero status
set -e

script_dir=$(dirname "$0")
project_root_path=$(realpath "$script_dir/../..")

cd "$project_root_path"

ci=${CI:-false}
if [ "$ci" = true ]; then
  echo "Running in CI"
  backend_config="backend.tfvars.json"
  var_file="google.tfvars.json"
else
  echo "Not running in CI"
  backend_config="backend-dev.tfvars.json"
  var_file="google-dev.tfvars.json"
fi

terraform init -backend-config="$backend_config"
terraform fmt -check -recursive
terraform validate
terraform plan -var-file="$var_file" -lock=false
