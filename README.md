This Terraform projet is made to deploy GitHub self hosted runner VMs on GCP.
The self hosted runner are setup at the GitHub organisation level.

## Usage
You need to pass additional terraform var to target a specific GCP projet and a
specific GitHub organisation. You need locally:
* terraform
* bash or compatible
* node12 and yarn

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
