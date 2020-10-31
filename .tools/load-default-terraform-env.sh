#!/bin/bash

echo "Parsing terraform.tfvars.json"

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
project_root_path=$(realpath "$script_dir/..")
default_tfvars_json_path="$project_root_path/terraform.tfvars.json"

runner_machine_type=$(jq -r .runner.type "$default_tfvars_json_path")
runner_idle_count=$(jq -r .runner.idle_count "$default_tfvars_json_path")
runner_total_count=$(jq -r .runner.total_count "$default_tfvars_json_path")

export RUNNER_MACHINE_TYPE=$runner_machine_type
export RUNNER_IDLE_COUNT=$runner_idle_count
export RUNNER_TOTAL_COUNT=$runner_total_count