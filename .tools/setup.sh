#!/bin/bash

# Exit immediately if a command returns a non-zero status
set -e

cat << EOF
The script will:
- parse google-dev.tfvars.json, github.auto.tfvars.json and terraform.tfvars.json from the root folder of the project 
- export google and github env vars (if sourced)
- generate .env file from calling directory
Warning : Values are evaluated from best effort parsing of terraform vars files. As some values are
locals terraform vars or constants, this script could need update in the future.
EOF

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
project_root_path=$(realpath "$script_dir/..")
google_path=$project_root_path/google-dev.tfvars.json
github_path=$project_root_path/github.auto.tfvars.json

# shellcheck source=.tools/load-default-terraform-env.sh
source "$project_root_path"/.tools/load-default-terraform-env.sh
# shellcheck source=.tools/load-google-env.sh
source "$project_root_path"/.tools/load-google-env.sh "$google_path"
# shellcheck source=.tools/load-github-env.sh
source "$project_root_path"/.tools/load-github-env.sh "$github_path"

# clear .env file
true > .env
# generate .env file.
{
    echo "GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS"
    echo "GOOGLE_ZONE=$GOOGLE_ZONE"
    echo "GOOGLE_ENV=$GOOGLE_ENV"
    echo "GOOGLE_PROJECT=$GOOGLE_PROJECT"
    echo "RUNNER_MACHINE_TYPE=$RUNNER_MACHINE_TYPE"
    echo "RUNNER_IDLE_COUNT=$RUNNER_IDLE_COUNT"
    echo "RUNNER_TOTAL_COUNT=$RUNNER_TOTAL_COUNT"
    echo "RUNNER_TAINT_LABELS=$RUNNER_TAINT_LABELS"
    echo "RUNNER_SERVICE_ACCOUNT=runner-user@$GOOGLE_PROJECT.iam.gserviceaccount.com"
    echo "SECRET_GITHUB_JSON_RESOURCE_NAME=projects/$GOOGLE_PROJECT/secrets/github-json/versions/latest"
    echo "SECRET_GITHUB_JSON_ID=github-json"
    echo "GITHUB_API_TRIGGER_URL=https://$GOOGLE_REGION-$GOOGLE_PROJECT.cloudfunctions.net/github_api_function"
    echo "GITHUB_ORG=$GITHUB_ORG"
    echo "GITHUB_KEY_B64=$GITHUB_KEY_B64"
    echo "GITHUB_APP_ID=$GITHUB_APP_ID"
    echo "GITHUB_INSTALLATION_ID=$GITHUB_INSTALLATION_ID"
    echo "GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID"
    echo "GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET"
    echo "GITHUB_WEBHOOK_SECRET=$GITHUB_WEBHOOK_SECRET"
} >> .env
