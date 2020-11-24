#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

# Printing script usage
program_name=$0
usage () {
  echo "usage: $program_name { dev | prod | --google-env-file google-env-file.json --backend-config-file backend.json }"
  exit 1
}

# Parsing script params
while true; do
  case "$1" in
    --google-env-file ) google_env_file="$2"; shift 2 ;;
    --backend-config-file ) backend_config_file="$2"; shift 2 ;;
    dev ) dev=true; shift 1 ;;
    prod ) prod=true; shift 1;;
    * ) break ;;
  esac
done

if [ "$dev" = true ]; then
    google_env_file="google-dev.tfvars.json"
    backend_config_file="backend-dev.tfvars.json"
fi

if [ "$prod" = true ]; then
    google_env_file="google-prod-eu.tfvars.json"
    backend_config_file="backend-prod-eu.tfvars.json"
fi

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
base_packer_cmd="bash packer.sh --env-file $google_env_file_path --packer-action"
packer_cmd_build="$base_packer_cmd 'build'"
set +e
eval "$packer_cmd_build"
packer_cmd_exit_code=$?
set -e
if [ $packer_cmd_exit_code -ne 0 ]; then
  echo "Packer build failed, maybe the image already exists, check logs for more info"
  read -r -p "Would you like to force deploy the image? (y/n):" input
  if [ "$input" = "y" ]; then
    packer_cmd_build_force="$base_packer_cmd 'build -force'"
    eval "$packer_cmd_build_force"
  fi
fi
echo "Deploying runner image using packer done"
cd "$project_root_path"

# Compile TS
declare -a js_src_folders=("modules/start-and-stop/src" "modules/github-api/src" "modules/github-hook/function")
for js_src_folder in "${js_src_folders[@]}"
do
  cd "$project_root_path/$js_src_folder"
  npm install
  npm run build
done
cd "$project_root_path"

# Deploy terraform
echo "Deploying infra using terraform..."
terraform init -backend-config="$backend_config_file_path"
terraform apply -var-file="$google_env_file_path"
echo "Deploying infra using terraform done"
