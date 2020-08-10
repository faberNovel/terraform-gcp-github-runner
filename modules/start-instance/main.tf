data "archive_file" "start_instance_zip" {
    type        = "zip"
    source_dir  = "${path.module}/src/"
    output_path = "${path.module}/start_instance.zip"
}

resource "google_storage_bucket" "start_instance_bucket" {
    name   = "start_instance_bucket"
}

resource "google_storage_bucket_object" "start_instance_zip" {
    name   = "start_instance.zip"
    bucket = google_storage_bucket.start_instance_bucket.name
    source = "${path.module}/start_instance.zip"
}

resource "google_cloudfunctions_function" "start_instance" {
    name                  = "start_instance_function"
    description           = "Scheduled instances start"
    runtime               = "nodejs10"
    available_memory_mb   = 128
    timeout               = 60
    source_archive_bucket = google_storage_bucket.start_instance_bucket.name
    source_archive_object = google_storage_bucket_object.start_instance_zip.name
    entry_point           = "startInstance"
    trigger_http          = true
}
