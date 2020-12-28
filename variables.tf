variable "runner" {
  type = object({
    type         = string
    taint_labels = bool
  })
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
