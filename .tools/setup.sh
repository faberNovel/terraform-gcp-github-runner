#!/bin/bash

# Exit immediately if a command returns a non-zero status
saved_options=$(set +o)
set -e

cat << EOF
The script will:
- parse google-dev.tfvars.json, github.auto.tfvars.json and terraform.tfvars.json from the root folder of the project 
- export google and github env vars (if sourced)
- generate .env file from calling directory

EOF

baseDir=$(pwd)
scriptDir="$(dirname "$0")"

cd "$scriptDir"

source ./load-google-env.sh ../google-dev.tfvars.json
source ./load-github-env.sh ../github.auto.tfvars.json
source ./load-default-terraform-env.sh

cd "$baseDir"

# clear .env file
> .env
# generate .env file
echo "GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS" >> .env
echo "GOOGLE_ZONE=$GOOGLE_ZONE" >> .env
echo "GOOGLE_ENV=$GOOGLE_ENV" >> .env
echo "RUNNER_MACHINE_TYPE=$RUNNER_MACHINE_TYPE" >> .env
echo "RUNNER_IDLE_COUNT=$RUNNER_IDLE_COUNT" >> .env
echo "RUNNER_TOTAL_COUNT=$RUNNER_TOTAL_COUNT" >> .env
echo "RUNNER_SERVICE_ACCOUNT=runner-user@$GOOGLE_PROJECT.iam.gserviceaccount.com" >> .env
echo "SECRET_GITHUB_JSON_RESOURCE_NAME=projects/$GOOGLE_PROJECT/secrets/github-json/versions/latest" >> .env
echo "SECRET_GITHUB_JSON_ID=github-json" >> .env

eval "$saved_options"
