data "archive_file" "start_and_stop_zip" {
    type        = "zip"
    source_dir  = "${path.module}/src/"
    output_path = "${path.module}/start_and_stop.zip"
}

resource "google_storage_bucket" "start_and_stop_bucket" {
    name   = "start_and_stop_bucket_${var.env}"
}

resource "google_storage_bucket_object" "start_and_stop_zip" {
    name   = "start_and_stop_${data.archive_file.start_and_stop_zip.output_md5}.zip"
    bucket = google_storage_bucket.start_and_stop_bucket.name
    source = "${path.module}/start_and_stop.zip"
}

resource "google_cloudfunctions_function" "start_and_stop" {
    name                  = "start_and_stop_function"
    description           = "Handling start and stop of non eternal runners"
    runtime               = "nodejs10"
    available_memory_mb   = 128
    timeout               = 60
    source_archive_bucket = google_storage_bucket.start_and_stop_bucket.name
    source_archive_object = google_storage_bucket_object.start_and_stop_zip.name
    entry_point           = "startAndStop"

    event_trigger {
        event_type = "google.pubsub.topic.publish"
        resource = google_pubsub_topic.start_and_stop.name
    }
    
}

resource "google_pubsub_topic" "start_and_stop" {
  name = "start-and-stop-topic"
}