variable "runner" {
  type = object({
    eternal_count = number
    total_count = number
    type = string
  })
}

variable "env" {
  type = string
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
