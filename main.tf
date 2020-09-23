provider "google" {
  credentials = base64decode(var.google.credentials_json_b64)
  project     = var.google.project
  region      = "us-central1"
  zone        = "us-central1-c"
}

resource "google_project_service" "gcp_services" {
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "compute.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
  ])

  service = each.key

  disable_on_destroy = false
}

terraform {
  backend "remote" {}
}

module "runners" {
  source = "./modules/runners"
  runner = var.runner
  env    = var.google.env
  github = var.github

  depends_on = [google_project_service.gcp_services]
}

module "start_and_stop" {
  source = "./modules/start-and-stop"
  google = {
    env     = var.google.env
    project = var.google.project
  }
  secret_name_github_json = module.secrets.secret_name_github_json

  depends_on = [google_project_service.gcp_services]
}

module "secrets" {
  source = "./modules/secrets"
  github = var.github

  depends_on = [google_project_service.gcp_services]
}