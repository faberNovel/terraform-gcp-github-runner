#!/bin/sh
# Exit immediately if a command returns a non-zero status
set -e

script_dir=$(dirname "$0")
project_root_path=$(realpath "$script_dir/../..")

cd "$project_root_path"

ci=${CI:-false}
if [ "$ci" = true ]; then
  echo "Running in CI"
  volume_options="--volumes-from runner --workdir $GITHUB_WORKSPACE"
else
  echo "Not running in CI"
  volume_options="-v $PWD:/wd --workdir /wd"
  cat ~/.terraform.d/credentials.tfrc.json > terraformrc
fi
export TF_CLI_CONFIG_FILE="terraformrc"

# Read versions
node_version=$(head -n 1 .nvmrc)
terraform_version=$(head -n 1 .terraform-version)

echo "node version : $node_version"
echo "terraform version : $terraform_version"

# Run JS tests
echo "Build and test JS/TS"
js_cmd="docker run \
$volume_options --entrypoint /bin/bash --rm \
--env CI \
node:$node_version .tools/ci/test-js.sh"
echo "$js_cmd"
eval "$js_cmd"

# Run TF tests
echo "Build and test TF"
tf_cmd="docker run \
$volume_options --entrypoint /bin/sh --rm \
--env TF_CLI_CONFIG_FILE --env CI \
hashicorp/terraform:$terraform_version .tools/ci/test-tf.sh"
echo "$tf_cmd"
eval "$tf_cmd"

echo "Lint Packer"
packer_cmd="docker run \
$volume_options --entrypoint /bin/bash --rm --env CI \
hashicorp/packer .tools/ci/test-packer.sh"
echo "$packer_cmd"
eval "$packer_cmd"

echo "Lint bash"
bash_lint_cmd="docker run \
$volume_options --rm --env CI \
koalaman/shellcheck-alpine shellcheck .tools/**/*.sh -x"
echo "$bash_lint_cmd"
eval "$bash_lint_cmd"
