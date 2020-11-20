variable "runner" {
  type = object({
    total_count  = number
    idle_count   = number
    type         = string
    taint_labels = bool
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
