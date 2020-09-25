#!/bin/bash
echo "Export google and github env vars (if sourced) and generate .env file for nodejs file"

baseDir=$(pwd)
scriptDir="$(dirname "$0")"
echo "baseDir=$baseDir"
echo "scriptDir=$scriptDir"

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