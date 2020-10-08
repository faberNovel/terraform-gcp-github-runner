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

project_root_path=$(realpath "$(dirname "$0")/..")
google_path=$project_root_path/google-dev.tfvars.json
github_path=$project_root_path/github.auto.tfvars.json

source $project_root_path/.tools/load-google-env.sh $google_path
source $project_root_path/.tools/load-github-env.sh $github_path
source $project_root_path/.tools/load-default-terraform-env.sh

# clear .env file
> .env
# generate .env file.
echo "GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS" >> .env
echo "GOOGLE_ZONE=$GOOGLE_ZONE" >> .env
echo "GOOGLE_ENV=$GOOGLE_ENV" >> .env
echo "RUNNER_MACHINE_TYPE=$RUNNER_MACHINE_TYPE" >> .env
echo "RUNNER_IDLE_COUNT=$RUNNER_IDLE_COUNT" >> .env
echo "RUNNER_TOTAL_COUNT=$RUNNER_TOTAL_COUNT" >> .env
echo "RUNNER_SERVICE_ACCOUNT=runner-user@$GOOGLE_PROJECT.iam.gserviceaccount.com" >> .env
echo "SECRET_GITHUB_JSON_RESOURCE_NAME=projects/$GOOGLE_PROJECT/secrets/github-json/versions/latest" >> .env
echo "SECRET_GITHUB_JSON_ID=github-json" >> .env
echo "GITHUB_API_TRIGGER_URL=https://$GOOGLE_REGION-$GOOGLE_PROJECT.cloudfunctions.net/github_api_function" >> .env
echo "GITHUB_ORG=$GITHUB_ORG" >> .env
echo "GITHUB_KEY_B64=$GITHUB_KEY_B64" >> .env
echo "GITHUB_APP_ID=$GITHUB_APP_ID" >> .env
echo "GITHUB_INSTALLATION_ID=$GITHUB_INSTALLATION_ID" >> .env
echo "GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID" >> .env
echo "GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET" >> .env
