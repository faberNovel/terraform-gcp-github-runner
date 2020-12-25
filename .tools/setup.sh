#!/bin/bash

# Exit immediately if a command returns a non-zero status
set -e

cat << EOF
The script will:
- parse google-dev.tfvars.json, github-dev.tfvars.json and terraform.tfvars.json from the root folder of the project 
- export google and github env vars (if sourced)
- generate .env file from calling directory
Warning : Values are evaluated from best effort parsing of terraform vars files. As some values are
locals terraform vars or constants, this script could need update in the future.
EOF

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
project_root_path=$(realpath "$script_dir/..")
default_tfvars_json_path="$project_root_path/terraform.tfvars.json"
google_path=$project_root_path/google-dev.tfvars.json
github_path=$project_root_path/github-dev.tfvars.json
env_file_path=$project_root_path/dev.env

# shellcheck source=.tools/extract-and-export.sh
source "$project_root_path"/.tools/extract-and-export.sh "$default_tfvars_json_path"

# shellcheck source=.tools/extract-and-export.sh
source "$project_root_path"/.tools/extract-and-export.sh "$google_path"

# shellcheck source=.tools/load-google-auth.sh
source "$project_root_path"/.tools/load-google-auth.sh "$google_path"

# shellcheck source=.tools/extract-and-export.sh
source "$project_root_path"/.tools/extract-and-export.sh "$github_path"

# clear dev.env file
true > "$env_file_path"
# generate dev.env file.
{
    echo "GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS"
    echo "GOOGLE_ZONE=$GOOGLE_ZONE"
    echo "GOOGLE_ENV=$GOOGLE_ENV"
    echo "GOOGLE_PROJECT=$GOOGLE_PROJECT"
    echo "GOOGLE_TIMEZONE=$GOOGLE_TIMEZONE"
    echo "RUNNER_MACHINE_TYPE=$RUNNER_MACHINE_TYPE"
    echo "RUNNER_TAINT_LABELS=$RUNNER_TAINT_LABELS"
    echo "RUNNER_SERVICE_ACCOUNT=runner-user@$GOOGLE_PROJECT.iam.gserviceaccount.com"
    echo "SCALING_IDLE_COUNT=$SCALING_IDLE_COUNT"
    echo "SCALING_IDLE_SCHEDULE=$SCALING_IDLE_SCHEDULE"
    echo "SCALING_UP_RATE=$SCALING_UP_RATE"
    echo "SCALING_UP_MAX=$SCALING_UP_MAX"
    echo "SCALING_DOWN_RATE=$SCALING_DOWN_RATE"
    echo "SECRET_GITHUB_JSON_RESOURCE_NAME=projects/$GOOGLE_PROJECT/secrets/github-json/versions/latest"
    echo "SECRET_GITHUB_JSON_ID=github-json"
    echo "START_AND_STOP_TOPIC_NAME=start-and-stop-topic"
    echo "GITHUB_API_TRIGGER_URL=https://$GOOGLE_REGION-$GOOGLE_PROJECT.cloudfunctions.net/github_api_function"
    echo "GITHUB_ORG=$GITHUB_ORG"
    echo "GITHUB_KEY_B64=$GITHUB_KEY_B64"
    echo "GITHUB_APP_ID=$GITHUB_APP_ID"
    echo "GITHUB_INSTALLATION_ID=$GITHUB_INSTALLATION_ID"
    echo "GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID"
    echo "GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET"
    echo "GITHUB_WEBHOOK_SECRET=$GITHUB_WEBHOOK_SECRET"
} >> "$env_file_path"
