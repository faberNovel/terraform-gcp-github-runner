resource "google_secret_manager_secret" "secret_github_json" {
  secret_id = "github-json"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "secret_version_github_json" {
  secret = google_secret_manager_secret.secret_github_json.id

  secret_data = jsonencode(var.github)
}

output "secret_name_github_json" {
  value = google_secret_manager_secret_version.secret_version_github_json.name
}
