provider "google" {
  credentials = base64decode(var.google.credentials_json_b64)
  project     = var.google.project
  region      = "us-central1"
  zone        = "us-central1-c"
}

terraform {
  backend "remote" {}
}

module "runners" {
  source = "./modules/runners"
  runner = var.runner
  env    = var.google.env
  github = var.github
}

module "start_and_stop" {
  source = "./modules/start-and-stop"
  google = {
    env     = var.google.env
    project = var.google.project
  }
  secret_name_github_json = module.secrets.secret_name_github_json
}

module "secrets" {
  source = "./modules/secrets"
  github = var.github
}