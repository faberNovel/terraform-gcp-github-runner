resource "google_secret_manager_secret" "secret-github-json" {
  secret_id = "github-json"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "secret-version-github-json" {
  secret = google_secret_manager_secret.secret-github-json.id

  secret_data = jsonencode(var.github)
}
