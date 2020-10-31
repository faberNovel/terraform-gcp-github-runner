provider "google" {
  credentials = base64decode(var.google.credentials_json_b64)
  project     = var.google.project
  region      = var.google.region
  zone        = var.google.zone
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

module "start_and_stop" {
  source                 = "./modules/start-and-stop"
  google                 = var.google
  runner                 = var.runner
  github_api_trigger_url = module.github_api.github_api_trigger_url
  github_org             = var.github.organisation

  depends_on = [google_project_service.gcp_services]
}

module "github_api" {
  source             = "./modules/github-api"
  secret_github_json = module.secrets.secret_github_json
  google             = var.google

  depends_on = [google_project_service.gcp_services]
}

module "secrets" {
  source = "./modules/secrets"
  github = var.github

  depends_on = [google_project_service.gcp_services]
}