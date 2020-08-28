variable "google" {
  type = object({
    project = string
    env     = string
  })
}

variable "secret_name_github_json" {}
