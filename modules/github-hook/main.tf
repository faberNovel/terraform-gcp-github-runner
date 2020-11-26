data "archive_file" "github_hook_zip" {
  type        = "zip"
  source_dir  = "${path.module}/function/"
  output_path = "${path.module}/github_hook.zip"
  excludes    = ["tests"]
}

resource "google_storage_bucket" "github_hook_bucket" {
  name = "github_hook_bucket_${var.google.env}"
}

resource "google_storage_bucket_object" "github_hook_zip" {
  name   = "github_hook_${data.archive_file.github_hook_zip.output_md5}.zip"
  bucket = google_storage_bucket.github_hook_bucket.name
  source = "${path.module}/github_hook.zip"
}

resource "google_cloudfunctions_function" "github_hook" {
  name                  = "github_hook_function"
  description           = "Receive GitHub hooks"
  runtime               = "nodejs12"
  available_memory_mb   = 128
  timeout               = 60
  source_archive_bucket = google_storage_bucket.github_hook_bucket.name
  source_archive_object = google_storage_bucket_object.github_hook_zip.name
  service_account_email = google_service_account.github_hook.email
  trigger_http          = true
  entry_point           = "githubHook"
  ingress_settings      = "ALLOW_ALL"

  environment_variables = {
    "SECRET_GITHUB_JSON_RESOURCE_NAME" = var.secret_github_json.resource_name
  }
}

resource "google_cloudfunctions_function_iam_member" "github_hook_invoker" {
  project        = google_cloudfunctions_function.github_hook.project
  region         = google_cloudfunctions_function.github_hook.region
  cloud_function = google_cloudfunctions_function.github_hook.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}

resource "google_service_account" "github_hook" {
  account_id   = "github-hook-user"
  display_name = "GitHub hook User"
}

resource "google_project_iam_member" "github_hook_secretmanager_secretaccessor" {
  role   = "roles/secretmanager.secretAccessor"
  member = "serviceAccount:${google_service_account.github_hook.email}"
}

output "github_hook_trigger_url" {
  value = google_cloudfunctions_function.github_hook.https_trigger_url
}
