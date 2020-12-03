#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

# Printing script usage
program_name=$0
usage () {
  echo "usage: $program_name { dev | prod | --google-env-file google-env-file.json --github-env-file github-env-file.json --backend-config-file backend.json }"
  exit 1
}

dev=false
prod=false

# Parsing script params
while true; do
  case "$1" in
    --google-env-file ) google_env_file="$2"; shift 2 ;;
    --github-env-file ) github_env_file="$2"; shift 2 ;;
    --backend-config-file ) backend_config_file="$2"; shift 2 ;;
    dev ) dev=true; shift 1 ;;
    prod ) prod=true; shift 1;;    
    * ) break ;;
  esac
done

if [ "$dev" = true ]; then
    google_env_file="google-dev.tfvars.json"
    github_env_file="github-dev.tfvars.json"    
    backend_config_file="backend-dev.tfvars.json"
fi

if [ "$prod" = true ]; then
    google_env_file="google-prod.tfvars.json"
    github_env_file="github-prod.tfvars.json"    
    backend_config_file="backend-prod.tfvars.json"
fi

# Checking script params
if [ -z "$google_env_file" ]; then
    usage
fi

if [ -z "$github_env_file" ]; then
    usage
fi

if [ -z "$backend_config_file" ]; then
    usage
fi

google_env_file_path=$(realpath "$google_env_file")
github_env_file_path=$(realpath "$github_env_file")
backend_config_file_path=$(realpath "$backend_config_file")
project_root_path=$(realpath "$(dirname "$0")/..")

# cd project root directory
cd "$project_root_path"

# Destroy terraform
echo "Destroying infra using terraform..."
terraform init -backend-config="$backend_config_file_path"
terraform destroy -var-file="$google_env_file_path" -var-file="$github_env_file_path"
echo "Destroying infra using terraform done"
