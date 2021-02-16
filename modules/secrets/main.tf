locals {
  secret_github_json_id = "github-json"
}

resource "google_secret_manager_secret" "secret_github_json" {
  secret_id = local.secret_github_json_id

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "secret_version_github_json" {
  secret = google_secret_manager_secret.secret_github_json.id

  secret_data = jsonencode(var.github)
}

output "secret_github_json" {
  value = {
    id            = local.secret_github_json_id
    resource_name = google_secret_manager_secret_version.secret_version_github_json.name
  }
}
