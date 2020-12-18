This Terraform projet is made to deploy GitHub self hosted runner VMs on GCP.
The self hosted runner are setup at the GitHub organisation level.

## Dependencies
* terraform, tfenv
* bash or compatible
* node12

### Google Cloud Plateform
To address a specific GCP projet:
* Create a GCP project and pass it to the terraform variable `google_project`.
* Setup an [account service key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys), with owner role.
* Create a `json` key for this account.
* Pass this key encoded in `b64` in terraform variable `secrets.google_credentials_json_b64`.

### GitHub
* Create a GitHub app.
* Grant organisation / self-hosted runners / R/W permissions.
* Generate a private key, pass it in `b64` in terraform variable `secrets.github_key_pem_b64`.
* Pass the app installation id in terraform as `github.app_installation_id` and the app id as `github.app_id`.

## Architecture
![Architecture](docs/components-scheme.svg)

<!-- BEGINNING OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
## Requirements

| Name | Version |
|------|---------|
| terraform | >= 0.13 |

## Providers

| Name | Version |
|------|---------|
| google | n/a |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| github | n/a | <pre>object({<br>    organisation        = string<br>    app_id              = string<br>    app_installation_id = string<br>    client_id           = string<br>    client_secret       = string<br>    key_pem_b64         = string<br>    webhook_secret      = string<br>  })</pre> | n/a | yes |
| google | n/a | <pre>object({<br>    project              = string<br>    region               = string<br>    zone                 = string<br>    credentials_json_b64 = string<br>    env                  = string<br>  })</pre> | n/a | yes |
| runner | n/a | <pre>object({<br>    total_count                      = number<br>    idle_count                       = number<br>    scale_up_non_busy_target_count   = number<br>    scale_down_non_busy_target_count = number<br>    type                             = string<br>    taint_labels                     = bool<br>  })</pre> | n/a | yes |
| triggers | n/a | <pre>object({<br>    time_zone            = string<br>    scale_down_schedule  = string<br>    healthcheck_schedule = string<br>    renew_schedule       = string<br>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| github\_webhook\_url | n/a |

<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->
