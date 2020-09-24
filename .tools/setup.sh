#!/bin/bash
echo "Export google and github env vars (if sourced) and generate .env file for nodejs file"

baseDir=$(pwd)
scriptDir="$(dirname "$0")"
echo "baseDir=$baseDir"
echo "scriptDir=$scriptDir"

cd "$scriptDir"

source ./load-google-env.sh ../google-dev.tfvars.json
source ./load-github-env.sh ../github.auto.tfvars.json

cd "$baseDir"

# clear .env file
> .env
# generate .env file
echo "GOOGLE_APPLICATION_CREDENTIALS=$GOOGLE_APPLICATION_CREDENTIALS" >> .env
echo "ZONE=$ZONE" >> .env
