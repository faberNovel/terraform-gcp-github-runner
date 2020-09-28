data "archive_file" "github_api_zip" {
  type        = "zip"
  source_dir  = "${path.module}/src/"
  output_path = "${path.module}/github_api.zip"
}

resource "google_storage_bucket" "github_api_bucket" {
  name = "github_api_bucket_${var.google.env}"
}

resource "google_storage_bucket_object" "github_api_zip" {
  name   = "github_api_${data.archive_file.github_api_zip.output_md5}.zip"
  bucket = google_storage_bucket.github_api_bucket.name
  source = "${path.module}/github_api.zip"
}

resource "google_cloudfunctions_function" "github_api" {
  name                  = "github_api_function"
  description           = "Interface GitHub API"
  runtime               = "nodejs12"
  available_memory_mb   = 128
  timeout               = 60
  source_archive_bucket = google_storage_bucket.github_api_bucket.name
  source_archive_object = google_storage_bucket_object.github_api_zip.name
  entry_point           = "githubApi"
  service_account_email = google_service_account.github_api.email

  environment_variables = {
    "SECRET_GITHUB_JSON_RESOURCE_NAME" = var.secret_github_json.resource_name
  }
}

resource "google_service_account" "github_api" {
  account_id   = "github-api-user-user"
  display_name = "GitHub API User"
}

resource "google_project_iam_member" "github_api_secretmanager_secretaccessor" {
  role   = "roles/secretmanager.secretAccessor"
  member = "serviceAccount:${google_service_account.github_api.email}"
}
