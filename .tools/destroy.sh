#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

# Printing script usage
program_name=$0
usage () {
  echo "usage: $program_name --google-env-file google-env-file.json --backend-config-file backend.json"
  exit 1
}

# Parsing script params
while true; do
  case "$1" in
    --google-env-file ) google_env_file="$2"; shift 2 ;;
    --backend-config-file ) backend_config_file="$2"; shift 2 ;;
    * ) break ;;
  esac
done

# Checking script params
if [ -z "$google_env_file" ]; then
    usage
fi

if [ -z "$backend_config_file" ]; then
    usage
fi

google_env_file_path=$(realpath "$google_env_file")
backend_config_file_path=$(realpath "$backend_config_file")
project_root_path=$(realpath "$(dirname "$0")/..")

# cd project root directory
cd "$project_root_path"

# Destroy terraform
echo "Destroying infra using terraform..."
terraform init -backend-config="$backend_config_file_path"
terraform destroy -var-file="$google_env_file_path"
echo "Destroying infra using terraform done"
