# Terraform / Packer project for scalable self hosted GitHub action runners on GCP 🚀
This project leverages [Terraform](https://www.terraform.io/) and [Packer](https://www.packer.io/) to deploy and maintain scalable [self hosted GitHub actions runners](https://docs.github.com/en/free-pro-team@latest/actions/hosting-your-own-runners/about-self-hosted-runners) infrastructure on GCP for a GitHub organization.
* Auto scaling of runners, supporting simple and powerful [scaling policy configuration](#inputs) 🧰
* Fast scaling up thanks to prebuild image via Packer 🚄
* Support Docker out of the box 🏗️
* [Cost efficient](#cost) versus [Linux GitHub Runner](https://docs.github.com/en/free-pro-team@latest/github/setting-up-and-managing-billing-and-payments-on-github/about-billing-for-github-actions#about-billing-for-github-actions) 💰

## Setup
To setup the infrastucture, manual steps which can not be done through Terraform must be done:
1. A GitHub App with proper setup needs to be created and installed in the GitHub organization where self hosted runners will be available. [GitHub setup section](#github-setup) explains how to setup this GitHub App.
2. An empty GCP project which will host the self hosted runners and scaling logic must be created. [GCP setup section](#google-cloud-plateform-setup) explains how to setup this GCP project.
3. Update GitHup App with GCP project information computed during GCP deployement. 

### GitHub Setup
This section explains how to setup the GitHub App in the GitHub organization where we want to use self hosted runners. The GitHub App will allow GCP to communicate with the GitHub organization in order to create / delete runners and scaling up / down when needed. Check for [components scheme](#component-scheme) for more information. To be able to properly setup the GitHup App in the GitHub organization, you need to be an admin of this GitHub organization.
* Create a [GitHub App](https://github.com/settings/apps/new):
  * In `Webhook`, uncheck `Active` for now.
  * In `Repository permissions` grant `Read-only` permission to `Checks` and `Metadata` (needed to forward scale up event from GitHub towards GCP)
  * In `Organization permissions`, grant `Read & write` to `Self-hosted runners`
  * In `Subscribe to events`, check `Check run`
  * Check `Any account` for `Where can this GitHub App be installed?`
* From the GitHub App (`https://github.com/settings/apps/{your-app-name}`):
  * Create and store a `client secret` 
  * Create and store a `private key`
  * Store the `app id` and the `client id`
  * Install the GitHub App in your GitHub Organization using `https://github.com/settings/apps/{your-app-name}/installations`. You will then land on the installed GitHub App web page (the url should look like `https://github.com/settings/installations/{installation_id}`). Store the `installation_id`.

### Google Cloud Plateform Setup
TODO : refactor and add screens
To address a specific GCP projet:
* Create a GCP project and pass it to the terraform variable `google_project`.
* Setup an [account service key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys), with owner role.
* Create a `json` key for this account.
* Pass this key encoded in `b64` in terraform variable `secrets.google_credentials_json_b64`.

## Usage
TODO

## Releases
TODO

## Architecture
TODO
### How it works
TODO
### Component scheme
![Architecture](docs/components-scheme.svg)

### Scaling
TODO
#### Scale Up
TODO
#### Scale Down
TODO
#### Idle Runner
TODO

### System health
TODO
#### Monitoring
TODO
#### Health checks
TODO
#### Runner renewal
TODO

## Cost
TODO

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
| github | Represents the [GitHub App](https://docs.github.com/en/free-pro-team@latest/developers/apps) installed in the GitHub organization where the runners from GCP will serve as self hosted runners. The GitHub App allows communication between GitHub organization and GCP project. Check [GitHub setup](#github-setup).<br><br>  `organisation`: The GitHub organization (the name, for instance `fabernovel` for [FABERNOVEL](https://github.com/faberNovel)) where runners will be available.<br><br>  `app_id`: The id of the GitHub App. Available at `https://github.com/organizations/{org}/settings/apps/{app}`.<br><br>  `app_installation_id`: The installation id of the GitHub App whitin the organization. Available at `https://github.com/organizations/{org}/settings/installations`, `Configure`, `app_installation_id` is then in the url as `https://github.com/organizations/faberNovel/settings/installations/{app_installation_id}`.<br><br>  `client_id`: The client id of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br><br>  `client_secret`: The client secret of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br><br>  `key_pem_b64`: The private key of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br><br>  `webhook_secret`: The webhook of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br> | <pre>object({<br>    organisation        = string<br>    app_id              = string<br>    app_installation_id = string<br>    client_id           = string<br>    client_secret       = string<br>    key_pem_b64         = string<br>    webhook_secret      = string<br>  })</pre> | n/a | yes |
| google | Represents the GCP project hosting the virtual machines acting as GitHub Action self hosted runners. Check [GCP setup](#google-cloud-plateform-setup).<br><br>  `project`: The [project ID](https://support.google.com/googleapi/answer/7014113?hl=en) of the GCP project.<br><br>  `region`: The [region](https://cloud.google.com/compute/docs/regions-zones) of the GCP project.<br><br>  `zone`: The [zone](https://cloud.google.com/compute/docs/regions-zones) of the GCP project.<br><br>  `credentials_json_b64`: The content in b64 of the [service account keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) used by Terraform to manipulate the GCP project.<br><br>  `env`: A label used to tag GCP ressources. `taint_labels` uses this value to taind runners labels.<br><br>  `time_zone`: The time zone to use in the project as described by [TZ database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). `idle_schedule`, `down_schedule`, `healthcheck_schedule`, `renew_schedule` are evaluated in this time zone. | <pre>object({<br>    project              = string<br>    region               = string<br>    zone                 = string<br>    credentials_json_b64 = string<br>    env                  = string<br>    time_zone            = string<br>  })</pre> | n/a | yes |
| runner | `type`: The [machine type](https://cloud.google.com/compute/docs/machine-types) of the runners, for instance `n1-standard-2`.<br><br>  `taint_labels`: Enable tainting runner labels, useful to not mix debug and prod runner for your organization | <pre>object({<br>    type         = string<br>    taint_labels = bool<br>  })</pre> | n/a | yes |
| scaling | `idle_count`: The number of runners to keep [idle](#idle-runner).<br><br>  `idle_schedule`: A cron describing the [idling period](#idle-runner) of runners.<br><br>  `up_rate`: The number of runners to create when [scaling up](#scale-up).<br><br>  `up_max`: The maximum number of runners.<br><br>  `down_rate`: The number of inative runners to delete when [scaling down](#scale-down).<br><br>  `down_schedule`: A cron to trigger regularly [scaling down](#scale-down). | <pre>object({<br>    idle_count    = number<br>    idle_schedule = string<br>    up_rate       = number<br>    up_max        = number<br>    down_rate     = number<br>    down_schedule = string<br>  })</pre> | n/a | yes |
| triggers | `healthcheck_schedule`: A cron to trigger [health checks](#health-checks).<br><br>  `renew_schedule`: A cron to trigger [runners renewal](#runner-renewal).<br> | <pre>object({<br>    healthcheck_schedule = string<br>    renew_schedule       = string<br>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| github\_webhook\_url | n/a |

<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->

## Contributing
TODO

## Similar projets
TODO

## License
TODO
