data "archive_file" "start_instance_zip" {
    type        = "zip"
    source_dir  = "${path.module}/src/"
    output_path = "${path.module}/start_instance.zip"
}

resource "google_storage_bucket" "start_instance_bucket" {
    name   = "start_instance_bucket_${var.env}"
}

resource "google_storage_bucket_object" "start_instance_zip" {
    name   = "start_instance_${data.archive_file.start_instance_zip.output_md5}.zip"
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

    event_trigger {
        event_type = "google.pubsub.topic.publish"
        resource = google_pubsub_topic.start_instance.name
    }
    
}

resource "google_pubsub_topic" "start_instance" {
  name = "start-instance-topic"
}