This Terraform projet is made to deploy GitHub self hosted runner VMs on GCP.
The self hosted runner are setup at the GitHub organisation level.

## Usage
You need to pass additional terraform var to target a specific GCP projet and a
specific GitHub organisation. You need locally:
* terraform
* bash or compatible
* ruby and bundle

### Google Cloud Plateform
To address a specific GCP projet:
* Create a GCP project and pass it to the terraform variable `google_project`.
* Setup an [account service key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys), with enough role to manage compute instance (usually `Compute Admin`).
* Create a `json` key for this account.
* Pass this key encoded in `b64` in terraform variable `secrets.google_credentials_json_b64`.

### GitHub
* Create a GitHub app.
* Grant organisation / self-hosted runners / R/W permissions.
* Generate a private key, pass it in `b64` in terraform variable `secrets.github_key_pem_b64`.
* Pass the app installation id in terraform as `github.app_installation_id` and the app id as `github.app_id`.


## Variables
* `runner.count` : the number of runner to setup.
* `runner.type` : the [type](https://cloud.google.com/compute/all-pricing) of compute instance to use.
* `google_project` : the gcp project which host the runners.
* `github.organisation` : the organisation for which the runners are available.
* `github.app_id` : the GitHub app attached to the GitHub organisation to manage the runners.
* `github.app_installation_id` : the installation id of the GitHub app.
* `secrets.google_credentials_json_b64` : the `json` key of the service account which manage compute instances in the gcp projet.
* `secrets.github_key_pem_b64` : the private key of the GitHub app.

Usually, all variables can be set in a `terraform.tfstate`file, except the `secrets`. See the [documentation](https://www.terraform.io/docs/configuration/variables.html) for more info.
