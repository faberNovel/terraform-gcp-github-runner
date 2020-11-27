data "archive_file" "start_and_stop_zip" {
  type        = "zip"
  source_dir  = "${path.module}/function/"
  output_path = "${path.module}/start_and_stop.zip"
  excludes    = ["test"]
}

resource "google_storage_bucket" "start_and_stop_bucket" {
  name = "start_and_stop_bucket_${var.google.env}"
}

resource "google_storage_bucket_object" "start_and_stop_zip" {
  name   = "start_and_stop_${data.archive_file.start_and_stop_zip.output_md5}.zip"
  bucket = google_storage_bucket.start_and_stop_bucket.name
  source = "${path.module}/start_and_stop.zip"
}

resource "google_cloudfunctions_function" "start_and_stop" {
  name                  = "start_and_stop_function"
  description           = "Handling start and stop of non idle runners"
  runtime               = "nodejs12"
  available_memory_mb   = 128
  timeout               = 60 * 5
  source_archive_bucket = google_storage_bucket.start_and_stop_bucket.name
  source_archive_object = google_storage_bucket_object.start_and_stop_zip.name
  entry_point           = "startAndStop"
  service_account_email = google_service_account.start_and_stop.email
  max_instances         = 1

  environment_variables = {
    "GOOGLE_ZONE"            = var.google.zone
    "GOOGLE_ENV"             = var.google.env
    "GOOGLE_PROJECT"         = var.google.project
    "RUNNER_TAINT_LABELS"    = var.runner.taint_labels
    "RUNNER_MACHINE_TYPE"    = var.runner.type
    "RUNNER_IDLE_COUNT"      = var.runner.idle_count
    "RUNNER_TOTAL_COUNT"     = var.runner.total_count
    "RUNNER_SERVICE_ACCOUNT" = google_service_account.runner.email
    "GITHUB_API_TRIGGER_URL" = var.github_api_trigger_url
    "GITHUB_ORG"             = var.github_org
  }

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.start_and_stop.name
    failure_policy {
      retry = true
    }
  }

}

resource "google_pubsub_topic" "start_and_stop" {
  name = "start-and-stop-topic"
}

resource "google_cloud_scheduler_job" "healthcheck" {
  name      = "healthcheck"
  schedule  = "0 1 * * *"
  time_zone = "Europe/Paris"

  pubsub_target {
    topic_name = google_pubsub_topic.start_and_stop.id
    data       = base64encode("{\"action\":\"healthcheck\"}")
  }
}

resource "google_cloud_scheduler_job" "renew_idle_runners" {
  name      = "renew_idle_runners"
  schedule  = "0 2 * * *"
  time_zone = "Europe/Paris"

  pubsub_target {
    topic_name = google_pubsub_topic.start_and_stop.id
    data       = base64encode("{\"action\":\"renew_idle_runners\"}")
  }
}

resource "google_service_account" "start_and_stop" {
  account_id   = "start-and-stop-user"
  display_name = "Start and Stop User"
}

resource "google_project_iam_member" "start_and_stop_compute_admin" {
  role   = "roles/compute.admin"
  member = "serviceAccount:${google_service_account.start_and_stop.email}"
}

resource "google_project_iam_member" "start_and_stop_cloudfunctions_invoker" {
  role   = "roles/cloudfunctions.invoker"
  member = "serviceAccount:${google_service_account.start_and_stop.email}"
}

resource "google_project_iam_member" "start_and_stop_iam_service_account_user" {
  role   = "roles/iam.serviceAccountUser"
  member = "serviceAccount:${google_service_account.start_and_stop.email}"
}

resource "google_service_account" "runner" {
  account_id   = "runner-user"
  display_name = "Runner user"
}

resource "google_project_iam_member" "runner_compute_oslogin" {
  role   = "roles/compute.osLogin"
  member = "serviceAccount:${google_service_account.runner.email}"
}

resource "google_project_iam_member" "runner_cloudfunctions_invoker" {
  role   = "roles/cloudfunctions.invoker"
  member = "serviceAccount:${google_service_account.runner.email}"
}

resource "google_project_iam_member" "runner_logging_logwriter" {
  role   = "roles/logging.logWriter"
  member = "serviceAccount:${google_service_account.runner.email}"
}

resource "google_project_iam_member" "runner_monitoring_metricwriter" {
  role   = "roles/monitoring.metricWriter"
  member = "serviceAccount:${google_service_account.runner.email}"
}

output "start_and_stop_topic_name" {
  value = google_pubsub_topic.start_and_stop.name
}