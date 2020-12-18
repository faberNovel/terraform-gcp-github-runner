variable "runner" {
  type = object({
    total_count                      = number
    idle_count                       = number
    scale_up_non_busy_target_count   = number
    scale_down_non_busy_target_count = number
    scale_down_max_count             = number
    type                             = string
    taint_labels                     = bool
  })
}

variable "triggers" {
  type = object({
    time_zone            = string
    scale_down_schedule  = string
    healthcheck_schedule = string
    renew_schedule       = string
  })
}

variable "google" {
  type = object({
    project              = string
    region               = string
    zone                 = string
    credentials_json_b64 = string
    env                  = string
  })
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
}
