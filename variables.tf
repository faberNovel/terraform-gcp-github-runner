variable "runner" {
  type = object({
    count = number
    type = string
  })
}

variable "google" {
  type = object({
    project = string
    credentials_json_b64 = string
    env = string
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
  })
}
