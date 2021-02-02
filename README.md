# Terraform / Packer project for scalable self hosted GitHub action runners on GCP 🚀
This project leverages [Terraform](https://www.terraform.io/) and [Packer](https://www.packer.io/) to deploy and maintain scalable [self hosted GitHub actions runners](https://docs.github.com/en/free-pro-team@latest/actions/hosting-your-own-runners/about-self-hosted-runners) infrastructure on GCP for a GitHub organization.
* Auto scaling of runners, supporting simple and powerful [scaling policy configuration](#inputs) 🧰
* Fast scaling up thanks to prebuild image via Packer 🚄
* Support Docker out of the box 🏗️
* [Cost efficient](#cost) versus [Linux GitHub Runner](https://docs.github.com/en/free-pro-team@latest/github/setting-up-and-managing-billing-and-payments-on-github/about-billing-for-github-actions#about-billing-for-github-actions) 💰

## Table of contents
- [Terraform / Packer project for scalable self hosted GitHub action runners on GCP 🚀](#terraform--packer-project-for-scalable-self-hosted-github-action-runners-on-gcp-)
  - [Table of contents](#table-of-contents)
  - [Setup](#setup)
    - [1-GitHub Setup](#1-github-setup)
    - [2-Google Cloud Platform Setup](#2-google-cloud-platform-setup)
    - [3-Deploy the infrastructure on GCP using Terraform/Packer](#3-deploy-the-infrastructure-on-gcp-using-terraformpacker)
    - [4-Post deployement steps](#4-post-deployement-steps)
  - [Usage](#usage)
    - [Deploy](#deploy)
      - [Deploy script](#deploy-script)
    - [Destroy](#destroy)
  - [Releases](#releases)
  - [Architecture](#architecture)
    - [Project layout](#project-layout)
    - [How it works](#how-it-works)
    - [Component scheme](#component-scheme)
    - [Components](#components)
      - [Start and Stop](#start-and-stop)
      - [GitHub hook](#github-hook)
      - [GitHub API](#github-api)
      - [Secret Manager](#secret-manager)
      - [GitHub Runners](#github-runners)
      - [Base Runner Image](#base-runner-image)
    - [Scaling](#scaling)
      - [Scale Up](#scale-up)
      - [Scale Down](#scale-down)
      - [Idle Runner](#idle-runner)
    - [Ghost runner](#ghost-runner)
    - [System health](#system-health)
      - [Monitoring](#monitoring)
      - [Health checks](#health-checks)
      - [Runner renewal](#runner-renewal)
  - [Cost](#cost)
  - [Requirement](#requirement)
  - [Glossary](#glossary)
  - [Cron syntax](#cron-syntax)
  - [Requirements](#requirements)
  - [Providers](#providers)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
  - [Contributing](#contributing)
  - [Similar projects](#similar-projects)
  - [License](#license)

## Setup
To setup the infrastucture, here are the manual steps which can not be done through Terraform:
1. Setup a GitHub App which will be installed in the GitHub organization where self hosted runners will be available. [GitHub setup section](#1-github-setup) explains how to setup this GitHub App
2. Setup a GCP project which will host the self hosted runners and scaling logic must be created. [GCP setup section](#2-google-cloud-platform-setup) explains how to setup this GCP project
3. Deploy the infrastructure on GCP using Terraform using Packer and Terraform
4. Update GitHup App Webhook setting with GCP project information computed during GCP deployment

### 1-GitHub Setup
This section explains how to setup the GitHub App in the GitHub organization where we want to use self hosted runners. The GitHub App will allow GCP to communicate with the GitHub organization in order to create / delete runners and scaling up / down when needed. Check for [components scheme](#component-scheme) for more information. To be able to properly setup the GitHup App in the GitHub organization, you need to be an admin of this GitHub organization.
* Create a [GitHub App](https://github.com/settings/apps/new):
  * In `Webhook`, uncheck `Active`, and leave `Webhook URL empty for now`. It will be enable in part 4 of the setup.
  * In `Repository permissions` grant `Read-only` permission to `Checks` and `Metadata` (needed to forward scale up event from GitHub towards GCP)
  * In `Organization permissions`, grant `Read & write` to `Self-hosted runners`
  * Check `Any account` for `Where can this GitHub App be installed?`
* From the GitHub App (`https://github.com/settings/apps/{your-app-name}`):
  * Create and store a `client secret` 
  * Create and store a `private key`
  * Store the `app id` and the `client id`
  * Generate, set and store the `Webhook secret`. It will needed for part 4 of the setup.
  * Install the GitHub App in your GitHub Organization using `https://github.com/settings/apps/{your-app-name}/installations`. You will then land on the installed GitHub App web page (the url should look like `https://github.com/settings/installations/{installation_id}`). Store the `installation_id`.

### 2-Google Cloud Platform Setup
To address a specific GCP projet:
* [Create a GCP project](https://console.cloud.google.com/projectcreate)
* [Create a GCP service account](https://cloud.google.com/docs/authentication/getting-started) for this project with the `owner` role
* Download the json key file associated with the service account. You will set it as terraform `variable google.credentials_json_b64`
* Enable [Compute Engine API](https://console.developers.google.com/apis/api/compute.googleapis.com) on the project
* Enable [Identity and Access Management (IAM) API](https://console.developers.google.com/apis/library/iam.googleapis.com) on the project
* Create an App Engine Application at `https://console.cloud.google.com/appengine/start?project={your-gcp-project}` with the corresponding zone you want to use in your GCP project

### 3-Deploy the infrastructure on GCP using Terraform/Packer
From now you have everything to deploy the infrastructure on GCP using Terraform and Packer.
For Terraform, you can refer to [inputs](#inputs) to set project [input variables](https://www.terraform.io/docs/language/values/variables.html).
For Packer, you can refer to [Packer json config](https://www.packer.io/docs/from-1.5/syntax-json) located at [runner.json](image/runner.json)

Nevertheless, deploying the infrastructure can be a tedious task, as two tools are involved (Terraform and Packer) and they share a lot parameters.
To ease deploying a set a scripts is available in [tools folder](.tools). From here, `deploy.sh` and `destroy.sh` do as they are named, deploying and destroying the whole GCP infrastructure easely. To use these two scripts you need to store your Terraform variables in files with a specific layout. The scripts will load these variables and use them in Terrafrom and Packer. The layout to use is:
* A `google` tfvars file containing GCP related Terraform variables:
```HCL
{
  "google": {
    "region" : "a-gcp-region",
    ...
  },

  "runner": {
    "total_count" : 10,
    ...
  },

  "scaling": {
    "idle_count" : 2,
    ...
  }
}
```
* A `github` tfvars file containing GitHub related Terrafrom variables:
```HCL
{
  "github": {
    "organisation" : "a-github-organization"
    ...
}
```
* A `terraform backend` tfvars file, passed to Terraform via [`-backend-config` option](https://www.terraform.io/docs/cli/commands/init.html#backend-initialization)

From now, you can use [deploy script](#deploy-script).

After deployement, Terraform will print the `github_webhook_url` needed for [part 4 of the setup](#4-post-deployement-steps)

### 4-Post deployement steps
* Enable the GitHub webhook, from the GitHub App (`https://github.com/settings/apps/{your-app}`):
  * In `Webhook`, check `Active`, and set `Webhook URL` to `github_webhook_url` from [part 3 of the setup](#3-Deploy-the-infrastructure-on-GCP-using-Terraform/Packer)
  * Go to `https://github.com/settings/apps/{your-app}/permissions`, in `Subscribe to events`, check `Check run`
* Enable ghost runner (see [architecture](#architecture) for more info about ghost runner):
  * From `https://console.cloud.google.com/cloudscheduler?project={your-gcp-project}`, execute `healthcheck`
  * Wait the ghost runner to appears `offline` in `https://github.com/organizations/{your-org}/settings/actions`

You are all set!

## Usage
Project is made of a Terraform project and a Packer project. Packer is used to deploy the self hosted base GCE image. Terraform is used to deploy the components needed to manage the self hosted runners. After deployement the project behavior can be monitored from [Google Cloud Monitoring](https://console.cloud.google.com/monitoring). Using [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler) you trigger manually [health-checks](#health-checks), [runners renewal](#runner-renewal) and [scale down](#scale-down). Manually deleting a VM will automatically unregister it from GitHub (it wont appear offline from GitHub perspective). 

### Deploy
Packer needs to be deployed before the Terraform project, as the latter uses the image build and deployed by the former.
Packer deployement can be done using:
- [Deploy script](#deploy-script) (**recommanded**)
- [Packer CLI](https://www.packer.io/docs/commands)
- [packer.sh](./image/packer.sh) helper script
```shell
usage: image/packer.sh [--env-file google-env-file.json] [--packer-action build]
```

Terraform deployement can be done using:
- [Deploy script](#deploy-script) (**recommanded**)
- [Terraform CLI](https://www.terraform.io/docs/cli/index.html)

#### Deploy script
[deploy.sh](./.tools/deploy.sh) script is made to ease deployment of the whole system (Packer and Terraform). It ensure Packer image is deployed before triggering Terraform and is able to update Packer image if wanted. 
```shell
usage: .tools/deploy.sh { --google-env-file google-env-file.json --github-env-file github-env-file.json --backend-config-file backend.json } [ --skip-packer-deploy ] [ --skip-terraform-deploy ] [ --auto-approve ]
```

### Destroy
Image generated by Packer has to be destroyed manually directly in the GCP project. It can be done using [gcloud CLI](https://cloud.google.com/sdk/gcloud) or [GCP web interface](https://console.cloud.google.com/compute/images).
Infrastucture deployed by Terraform can be destroyed using:
- [Destroy script](./.tools/destroy.sh) (**recomanded**)
```shell
usage: .tools/destroy.sh { --google-env-file google-env-file.json --github-env-file github-env-file.json --backend-config-file backend.json }
```
- [Terraform CLI](https://www.terraform.io/docs/cli/index.html)

## Releases
[main](https://github.com/faberNovel/terraform-gcp-github-runner/tree/main) branch is considered stable and [releases](https://github.com/faberNovel/terraform-gcp-github-runner/releases) will be made from it.

## Architecture
The project is made of two systems, a GCP project, and a GitHub App, communicating together to manage and scale a GitHub Self Hosted Runner pool (GCP VMs) used by the GitHub organization where the GitHub App is installed. To implement scalability the GitHub App forward [`check_run`](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#check_run) events from the organization repositories to the GCP project, received by the [Github hook](#github-hook) component. This component then filter the events and may choose to forward it to the [start-and-stop](#start-and-stop) component, responsible of managing and scaling the runners (VMs). The [start-and-stop](#start-and-stop) component may then choose to scale up the runners pool, according to its [scaling up policy](#scale-up). At the moment, GitHub API does not produce event to inform the end of GitHub Action run, so to implement the scale down, the [start-and-stop] component is trigger regularly through a cloud scheduler, to check if runners can be scaled down, using its [scale down policy](#scale-down). Communicating from the GCP project to GitHub is made through the proxy [GitHub API](#github-hook) component, allowing multiple components of the GCP project to address the GitHub API. Authentication between GCP and GitHub is made trough secrets stored in the [seccret manager](#secret-manager) component. No sensitive data is leaked trough cloud function environement variable, for instance. Last but not least, the [start-and-stop](#start-and-stop) component has a retry behavior and follow idempotency principle. It is also regularly scheduled to execute [health-checks](#health-checks) on the whole system.

### Project layout
Packer project is located under [./image](./image) folder.
Terraform project is made of a root module located at the root of the project and of child modules located under [modules](./modules) folder. Terraform version is set through [specific version](./.terraform-version).

### How it works
GitHub Action allow the usage of [self hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners). This project deploy a infrastructure in GCP which is able to manage self hosted runners connected to a GitHub organization. This infrastructure is able to [scale](#scaling) the number of runners according to the needs of the organization repositories in term of GitHub Action. This is done by setting a GitHub App at organization level, which is allowed to manage the organization runners and receive various GitHub events from the organizations repositories.

### Component scheme
![Architecture](docs/components-scheme.svg)

### Components
#### Start and Stop
Located under [start-and-stop](./modules/start-and-stop) Terraform child module. It is made of an event based (a Pub/Sub) cloud function, and a cloud scheduler. The function is responsible to apply core operations on runners (compute instances). It handle scaling operation, healthchecks, and runner renewal. It is triggered by external events coming from [github-hook] or the cloud scheduler.

#### GitHub hook
Located under [github-hook](./modules/github-hook) Terraform child module. An HTTP cloud function receiving event from the GitHub App, to detect when a scaling up should be evaluated.

#### GitHub API
Located under [github-api](./modules/github-api) Terraform child module. An HTTP cloud function used as a proxy for GCP components to call the GitHub API. It is used by [start-and-stop](#start-and-stop-system) to monitor runners from a GitHub perspective, and by runners themself to register/unregister themself as self hosted runner to the GitHub organization when starting/stopping.

#### Secret Manager
Located under [secrets](./modules/secrets) Terraform child module. All sensible information used by the different components in the GCP project are stored and retrieved using [Secret Manager](https://cloud.google.com/secret-manager). In particulary sensitive data for authentication with the GitHub API.

#### GitHub Runners
The GitHub Runners are VMs managed by the [start-and-stop component](#start-and-stop). These VM automatically register as Runner to GitHub at start and unregister at stop.

#### Base Runner Image
Located under [image](./image). The base runner image is build and deploy using Packer. The image is made of the software stack needed by the Runner (Docker, StackDriver, GitHub Action Runner). You can customize the base software installed modifying [init.sh](./image/init.sh) script. Thanks to this base image, the amount of time needed between the moment the system trigger a scale up and the moment the resulting GitHub Runner is available on GitHub is reduced (only need to create and start the VM from this base image).

### Scaling
The key feature of this system is its ability to scale up and down according the needs of your GitHub organization in term of GitHub Action.

#### Scale Up
Scale up is trigger by [`check_run`](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#check_run) events, with the `status` `queued`. This event is trigger when a GitHub Action workflow is trigger (a workflow run). When receiving this event, the [start-and-stop component](#start-and-stop) will compare the count of inactive runners with [`scaling.up_rate`](#inputs). If this count is lower than the rate, the component will scale up the number of runners to match the `scaling.up_rate`. At the moment GitHub webhook does not expose the number of runners a workflow run could need. For instance in case of a [matrix](https://docs.github.com/en/actions/learn-github-actions/managing-complex-workflows#using-a-build-matrix), the workflow run could be parallelized between multiple runners. In consequence, depending your usage of GitHub Action, you may want to use a `scaling.up_rate` higher than one.

#### Scale Down
GitHub API does not expose webhook event when a GitHub Action workflow run is ended. To trigger the scaling down of the runners, a cloud scheduler event is used, triggered by the cron [`scaling.down_schedule`](#inputs). When receiving this event, the [start-and-stop component](#start-and-stop) will count the number of inactive runners and will try to scale them down by [`scaling.down_rate`](#inputs). The number of runners scalled down may be lower depending the [idle-runner policy](#idle-runner).
By default scale down is triggered every 10 minutes [`terraform.tfvars.json`](terraform.tfvars.json). You can manually trigger it at `https://console.cloud.google.com/cloudscheduler?project=your-gcp-project`.

#### Idle Runner
Idle runner feature allow to prevent a certain count ([`scaling.idle_count`](#inputs)) of inactive runners to be scaled down during a given period of time defined by the cron([scaling.idle_schedule](#inputs)). The `idle_schedule` follow the [cron syntax](#cron-syntax) and is computed with the timezone provided by [`google.time_zone`](#inputs). 
For instance `* 8-18 * * 1-5` will allow to apply the idle runner policy from 8:00 to 18:59, from Monday to Friday.

### Ghost runner
GitHub Action will fail a workflow if it can not find a suitable runner (a runner matching [`runs-on`](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjob_idruns-on defined by the workflow). A suitable runner always needs to be registred to GitHub, but it does not need to be actually online. This is why the system set up a special runner, a ghost runner which will be registered to GitHub with the labels use by the system, but wont actually exist. With the ghost runner the system is able to scale down to 0 runner.

### System health
The system is made with stability and resilience in mind. [start-and-stop](#start-and-stop-system) respects idempotency principle and is able to retry itself in case of error.

#### Monitoring
[Stack Driver agent](https://cloud.google.com/monitoring/agent) is enable on VMs, allowing to precisly monitor them (ressources usage, logs, errors).

#### Health checks
Health checks are regularly triggered on the system by the cron [`triggers.healthcheck_schedule`](#inputs), allowing it to recover from major error. For instance the healthchecks are able to detect and fix:
* Missing ghost runner
* Offline runner on GitHub, probably runner which encountered a major failure during a workflow.
* Unknown runner on GitHub, probably runner which encountered a major failure during its startup sequence.
By default those checks are triggered once a day [`terraform.tfvars.json`](terraform.tfvars.json). You can manually trigger them at `https://console.cloud.google.com/cloudscheduler?project=your-gcp-project`.

#### Runner renewal
Runner renewal is regularly triggered on the system by the cron [`triggers.renew_schedule`](#inputs)` to ensure runners do not stay alive too much time (the longer a runner stay alive, the higher the chance are it fails).
By default those checks are triggered once a day [`terraform.tfvars.json`](terraform.tfvars.json). You can manually trigger them at `https://console.cloud.google.com/cloudscheduler?project=your-gcp-project`.

## Cost
To be able to compute the cost of the system, all the resources used by the GCP project must be taken in account. In our case we will have:
* [Compute](https://cloud.google.com/compute/vm-instance-pricing) for the VMs
* [Network](https://cloud.google.com/vpc/network-pricing) for the VMs
* [Storage](https://cloud.google.com/compute/disks-image-pricing#disk) for the VMs
* [Cloud function](https://cloud.google.com/functions/pricing) 
* [Secret manager](https://cloud.google.com/secret-manager/pricing) for managing the secrets

Cost can be simplified to compute cost given:
* Network would be essentialy ingress, which is free.
* Storage will only serve for cloud function source code, the base image runner, and the disks used by the runners, which is negligeable vs Compute cost.
* Cloud function needs in term of computation is very low, so we are using minimum resource possible. This is negliseable vs Compute cost.
* Secret manager usage is fairly limited to cloud functions and VMs, which is negligeable vs Compute cost.

The only cost which would not be negligeable vs Compute cost is if your GitHub Aciton workflow would imply a lot of egress traffic, like pushing heavy artifacts outside of GCP.
To represent the moment where this solution is cost efficent vs GitHub Action Hosted Runners, we can use the following inequation:
* `W` the number of minutes of CI by month
* `O` the number of minutes where VMs do nothing by month
* `Cgcp` the cost by minutes of a N1 GCP VM 0.0016$ (the same amount of performance than GitHub Hosted-Runner)
* `Cgithub` the cost by minutes of a GitHub Hosted-Runner (0.008$)\
![Inequation](docs/cost-1.svg)\
Which can be simplified by:\
![Inequation](docs/cost-2.svg)\
The system is performant if the time spent inactive by the runners is less than 4 times the time spent executing workflow.

## Requirement
* Bash (automation)
* Terraform and Packer (deployement of the infrastructure)
* Docker (run the CI locally)
* NodeJs (the cloud function environement)

## Glossary
* `Runner`: Usually a virtual machine used by the GitHub Action API to schedule workflow run, through the [GitHub Action software](https://github.com/actions/runner)
* `GitHub Action Hosted Runner`: The [runners provided by GitHub](`https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners`), free for open source project and [billed](https://docs.github.com/en/github/setting-up-and-managing-billing-and-payments-on-github/about-billing-for-github-actions) for private project.
* `The system`: Represent the solution as a whole proposed by this project (GCP project and GitHub App).
* `Component`: Represent a dedicated entity in GCP responsible of doing one thing. Usually can be mapped to a Terraform child module.
* `Workflow`: [A GitHub Action automated process](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions) to host CI/CD logic.
* `Inactive Runner`: A VM started and not executing any workflow. Also named non busy is some part of the code.
* `Idle Runner`: A Runner which can not be scaled down because of [idle policy](#idle-runner)

## Cron syntax
All cron are evaluated with the timezone [`google.time_zone`](#inputs).
We are using following cron syntax:
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of the month (1 - 31)
│ │ │ ┌───────────── month (1 - 12 or JAN-DEC)
│ │ │ │ ┌───────────── day of the week (0 - 6 or SUN-SAT)
│ │ │ │ │                                   
│ │ │ │ │
│ │ │ │ │
* * * * *
```

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
| scaling | `idle_count`: The number of runners to keep [idle](#idle-runner).<br><br>  `idle_schedule`: A cron describing the [idling period](#idle-runner) of runners. [Syntax](#cron-syntax).<br><br>  `up_rate`: The number of runners to create when [scaling up](#scale-up).<br><br>  `up_max`: The maximum number of runners.<br><br>  `down_rate`: The number of inative runners to delete when [scaling down](#scale-down).<br><br>  `down_schedule`: A cron to trigger regularly [scaling down](#scale-down). [Syntax](#cron-syntax). | <pre>object({<br>    idle_count    = number<br>    idle_schedule = string<br>    up_rate       = number<br>    up_max        = number<br>    down_rate     = number<br>    down_schedule = string<br>  })</pre> | n/a | yes |
| triggers | `healthcheck_schedule`: A cron to trigger [health checks](#health-checks). [Syntax](#cron-syntax).<br><br>  `renew_schedule`: A cron to trigger [runners renewal](#runner-renewal). [Syntax](#cron-syntax).<br> | <pre>object({<br>    healthcheck_schedule = string<br>    renew_schedule       = string<br>  })</pre> | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| github\_webhook\_url | n/a |

<!-- END OF PRE-COMMIT-TERRAFORM DOCS HOOK -->

## Contributing
We love to hear your input whether it's about bug reporting, proposing fix or new features, or general discussion about the system behavior.
To do so we are using Github, so all changes must be done using Pull Request.
To report issues, use GitHub issues. Try to wrote bug reports with detail, background, and if applicable some code. Try to be specific and include steps to reproduce.
The codestyle used by the project is transparent. To be sure you are respecting it, you can execute the CI locally using [`run-all.sh` script](./.tools/ci/run-all.sh).

## Similar projects
- [Terraform AWS GitHub Runner](https://github.com/philips-labs/terraform-aws-github-runner)

## License
The project is liscended under the [GNU General Public License v3.0](./COPYING)
