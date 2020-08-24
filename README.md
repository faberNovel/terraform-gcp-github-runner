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

## Requirements

| Name | Version |
|------|---------|
| terraform | ~>0.12.28 |

## Providers

No provider.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| github | n/a | <pre>object({<br>    organisation        = string<br>    app_id              = string<br>    app_installation_id = string<br>    client_id           = string<br>    client_secret       = string<br>    key_pem_b64         = string<br>  })</pre> | n/a | yes |
| google | n/a | <pre>object({<br>    project              = string<br>    credentials_json_b64 = string<br>    env                  = string<br>  })</pre> | n/a | yes |
| runner | n/a | <pre>object({<br>    total_count   = number<br>    idle_count = number<br>    type          = string<br>  })</pre> | n/a | yes |

## Outputs

No output.