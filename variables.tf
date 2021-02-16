variable "runner" {
  type = object({
    type         = string
    taint_labels = bool
  })
  description = <<EOT
  `type`: The [machine type](https://cloud.google.com/compute/docs/machine-types) of the runners, for instance `n1-standard-2`.<br>
  `taint_labels`: Enable tainting runner labels, useful to not mix debug and prod runner for your organization
  EOT
}

variable "scaling" {
  type = object({
    idle_count    = number
    idle_schedule = string
    up_rate       = number
    up_max        = number
    down_rate     = number
    down_schedule = string
  })
  description = <<EOT
  `idle_count`: The number of runners to keep [idle](#idle-runner).<br>
  `idle_schedule`: A cron describing the [idling period](#idle-runner) of runners. [Syntax](#cron-syntax).<br>
  `up_rate`: The number of runners to create when [scaling up](#scale-up).<br>
  `up_max`: The maximum number of runners.<br>
  `down_rate`: The number of inative runners to delete when [scaling down](#scale-down).<br>
  `down_schedule`: A cron to trigger regularly [scaling down](#scale-down). [Syntax](#cron-syntax).
  EOT
}

variable "triggers" {
  type = object({
    healthcheck_schedule = string
    renew_schedule       = string
  })
  description = <<EOT
  `healthcheck_schedule`: A cron to trigger [health checks](#health-checks). [Syntax](#cron-syntax).<br>
  `renew_schedule`: A cron to trigger [runners renewal](#runner-renewal). [Syntax](#cron-syntax).<br>
  EOT
}

variable "google" {
  type = object({
    project              = string
    region               = string
    zone                 = string
    credentials_json_b64 = string
    env                  = string
    time_zone            = string
  })
  description = <<EOT
  Represents the GCP project hosting the virtual machines acting as GitHub Action self hosted runners. Check [GCP setup](#google-cloud-plateform-setup).<br>
  `project`: The [project ID](https://support.google.com/googleapi/answer/7014113?hl=en) of the GCP project.<br>
  `region`: The [region](https://cloud.google.com/compute/docs/regions-zones) of the GCP project.<br>
  `zone`: The [zone](https://cloud.google.com/compute/docs/regions-zones) of the GCP project.<br>
  `credentials_json_b64`: The content in b64 of the [service account keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) used by Terraform to manipulate the GCP project.<br>
  `env`: A label used to tag GCP ressources. `taint_labels` uses this value to taind runners labels.<br>
  `time_zone`: The time zone to use in the project as described by [TZ database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). `idle_schedule`, `down_schedule`, `healthcheck_schedule`, `renew_schedule` are evaluated in this time zone.
  EOT
}

variable "github" {
  type = object({
    organisation        = string
    app_id              = string
    app_installation_id = string
    client_id           = string
    client_secret       = string
    key_pem_b64         = string
    webhook_secret      = string
  })
  description = <<EOT
  Represents the [GitHub App](https://docs.github.com/en/free-pro-team@latest/developers/apps) installed in the GitHub organization where the runners from GCP will serve as self hosted runners. The GitHub App allows communication between GitHub organization and GCP project. Check [GitHub setup](#github-setup).<br>
  `organisation`: The GitHub organization (the name, for instance `fabernovel` for [FABERNOVEL](https://github.com/faberNovel)) where runners will be available.<br>
  `app_id`: The id of the GitHub App. Available at `https://github.com/organizations/{org}/settings/apps/{app}`.<br>
  `app_installation_id`: The installation id of the GitHub App whitin the organization. Available at `https://github.com/organizations/{org}/settings/installations`, `Configure`, `app_installation_id` is then in the url as `https://github.com/organizations/faberNovel/settings/installations/{app_installation_id}`.<br>
  `client_id`: The client id of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br>
  `client_secret`: The client secret of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br>
  `key_pem_b64`: The private key of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br>
  `webhook_secret`: The webhook of the GitHub App. Managable at `https://github.com/organizations/{org}/settings/apps/{app}`.<br>
  EOT
}
