#!/bin/bash
# Exit immediately if a command returns a non-zero status
saved_options=$(set +o)
set -e

# Printing script usage
program_name=$0
usage () {
  echo "usage: $program_name [--env-file google-env-file.json] [--packer-action build]"
  exit 1
}

# Parsing script params
while true; do
  case "$1" in
    --env-file ) env_file="$2"; shift 2 ;;
    --packer-action ) packer_action="$2"; shift 2;;
    * ) break ;;
  esac
done

# Checking script params
if [ -z "$env_file" ]; then
    usage
fi

if [ -z "$packer_action" ]; then
    usage
fi

env_file_path=$(realpath $env_file)
echo $env_file_path

source ../.tools/load-google-env.sh $env_file_path
source ../.tools/load-default-terraform-env.sh

packer $packer_action \
  -var region=$GOOGLE_REGION \
  -var zone=$GOOGLE_ZONE \
  -var machine_type=$RUNNER_MACHINE_TYPE \
  -var project_id=$GOOGLE_PROJECT \
  runner.json

eval "$saved_options"
