#!/bin/bash

echo "$project_root_path"
echo "Parsing terraform.tfvars.json"

project_root_path=$(realpath "$(dirname "$0")/..")
default_tfvars_json_path="$project_root_path/terraform.tfvars.json"

runner_machine_type=$(jq -r .runner.type "$default_tfvars_json_path")
runner_idle_count=$(jq -r .runner.idle_count "$default_tfvars_json_path")
runner_total_count=$(jq -r .runner.total_count "$default_tfvars_json_path")

export RUNNER_MACHINE_TYPE=$runner_machine_type
export RUNNER_IDLE_COUNT=$runner_idle_count
export RUNNER_TOTAL_COUNT=$runner_total_count