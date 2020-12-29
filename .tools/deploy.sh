#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

# Printing script usage
program_name=$0
usage () {
  echo "usage: $program_name { dev | prod | --google-env-file google-env-file.json --github-env-file github-env-file.json --backend-config-file backend.json } [ --skip-packer-deploy ] [ --skip-terraform-deploy ]"
  exit 1
}

packer_deploy () {
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
}

terraform_deploy () {
  # Compile TS
  declare -a js_src_folders=("modules/start-and-stop/function" "modules/github-api/src" "modules/github-hook/function")
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
  terraform apply -var-file="$google_env_file_path" -var-file="$github_env_file_path"
  echo "Deploying infra using terraform done"
}

skip_packer_deploy=false
skip_terraform_deploy=false

# Parsing script params
while true; do
  case "$1" in
    --google-env-file ) google_env_file="$2"; shift 2 ;;
    --github-env-file ) github_env_file="$2"; shift 2 ;;
    --backend-config-file ) backend_config_file="$2"; shift 2 ;;
    dev ) dev=true; shift 1 ;;
    prod ) prod=true; shift 1;;
    --skip-packer-deploy ) skip_packer_deploy=true; shift 1;;
    --skip-terraform-deploy ) skip_terraform_deploy=true; shift 1;;
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

if [ "$skip_packer_deploy" = true ]; then
  echo "Skipping packer deploy"
else
  packer_deploy
fi

if [ "$skip_terraform_deploy" = true ]; then
  echo "Skipping terraform deploy"
else
  terraform_deploy
fi

