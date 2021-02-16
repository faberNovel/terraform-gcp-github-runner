#!/bin/sh
# Exit immediately if a command returns a non-zero status
set -e

script_dir=$(dirname "$0")
project_root_path=$(realpath "$script_dir/../..")

cd "$project_root_path"

terraform init -backend=false
terraform fmt -check -recursive
terraform validate
