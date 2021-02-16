#!/bin/bash
# Exit immediately if a command returns a non-zero status
set -e

script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
project_root_path=$(realpath "$script_dir/../..")

cd "$project_root_path"

declare -a js_src_folders=("modules/start-and-stop/function" "modules/github-api/src" "modules/github-hook/function")
for js_src_folder in "${js_src_folders[@]}"
do
    cd "$project_root_path/$js_src_folder"
    npm ci
    npm run build
    npm run lint
    npm run test
done
