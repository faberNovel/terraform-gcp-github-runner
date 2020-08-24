provider "google" {
  credentials = base64decode(var.google.credentials_json_b64)
  project     = var.google.project
  region      = "us-central1"
  zone        = "us-central1-c"
}

terraform {
  required_version = "~>0.12.28"
  backend "remote" {}
}

module "runners" {
  source = "./modules/runners"
  runner = {
    total_count = var.runner.total_count
    idle_count  = var.runner.idle_count
    type        = var.runner.type
  }
  env = var.google.env
  github = {
    app_id              = var.github.app_id
    app_installation_id = var.github.app_installation_id
    client_id           = var.github.client_id
    client_secret       = var.github.client_secret
    key_pem_b64         = var.github.key_pem_b64
    organisation        = var.github.organisation
  }
}

module "start_and_stop" {
  source = "./modules/start-and-stop"
  env    = var.google.env
}