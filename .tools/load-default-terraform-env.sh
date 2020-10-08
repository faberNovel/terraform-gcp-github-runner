#!/bin/bash

echo $project_root_path
echo "Parsing terraform.tfvars.json"
project_root_path=$(realpath "$(dirname "$0")/..")
defaultTfvarsJsonPath="$project_root_path/terraform.tfvars.json"

export RUNNER_MACHINE_TYPE=$(jq -r .runner.type $defaultTfvarsJsonPath)
export RUNNER_IDLE_COUNT=$(jq -r .runner.idle_count $defaultTfvarsJsonPath)
export RUNNER_TOTAL_COUNT=$(jq -r .runner.total_count $defaultTfvarsJsonPath)
