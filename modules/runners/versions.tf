terraform {
  required_providers {
    external = {
      source = "hashicorp/external"
    }
    google = {
      source = "hashicorp/google"
    }
    null = {
      source = "hashicorp/null"
    }
    random = {
      source = "hashicorp/random"
    }
    tls = {
      source = "hashicorp/tls"
    }
  }
  required_version = ">= 0.13"
}
