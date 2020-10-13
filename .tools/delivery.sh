#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

# Printing script usage
program_name=$0
usage () {
  echo "usage: $program_name --google-env-file google-env-file.json --backend-config-file backend.json --force"
  exit 1
}

# Parsing script params
while true; do
  case "$1" in
    --google-env-file ) google_env_file="$2"; shift 2 ;;
    --backend-config-file ) backend_config_file="$2"; shift 2 ;;
    --force ) force=true; shift 1 ;;
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

# Deploy packer image
echo "Deploying runner image using packer..."
cd image
set +e
packer_cmd="bash packer.sh --env-file $google_env_file_path --packer-action"
if [ "$force" = true ]; then
  packer_cmd="$packer_cmd 'build -force'"
else
  packer_cmd="$packer_cmd 'build'"
fi

if ! eval "$packer_cmd"; then
  echo "Packer build failed, maybe the image already exists, check logs for more info"
fi
set -e
echo "Deploying runner image using packer done"
cd "$project_root_path"

# Deploy terraform
echo "Deploying infra using terraform..."
terraform init -backend-config="$backend_config_file_path"
terraform apply -var-file="$google_env_file_path"
echo "Deploying infra using terraform done"
