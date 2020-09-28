variable "google" {}

variable "runner" {}

variable "secret_github_json" {
  type = object({
    id            = string
    resource_name = string
  })
}
