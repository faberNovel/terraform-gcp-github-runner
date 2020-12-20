variable "runner" {
  type = object({
    total_count  = number
    type         = string
    taint_labels = bool
  })
}

variable "scaling" {
  type = object({
    scale_up_non_busy_runners_target_count = number
    scale_down_non_busy_runners_chunk_size = number
    scale_down_schedule                    = string
  })
}

variable "triggers" {
  type = object({
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
    time_zone            = string
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
