resource "random_id" "instance_id" {
  count       = var.runner.total_count
  byte_length = 8
}

resource "tls_private_key" "ssh-key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

locals {
  ssh_pub_key_without_new_line = replace(tls_private_key.ssh-key.public_key_openssh, "\n", "")
  base_runner_name             = "vm-gcp-github-action-runner-${var.env}"
}

resource "google_compute_firewall" "externalssh" {
  name    = "firewall-externalssh"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["externalssh"]
}

data "external" "registration_token" {
  program = [
    "node",
    "${path.module}/scripts/get-runner-registration-token.js",
    "--org=${var.github.organisation}",
    "--private-key-pem=${base64decode(var.github.key_pem_b64)}",
    "--app-id=${var.github.app_id}",
    "--app-installation-id=${var.github.app_installation_id}",
    "--client-id=${var.github.client_id}",
    "--client-secret=${var.github.client_secret}"
  ]
}

resource "google_compute_instance_template" "runner" {
  name         = "runner-template"
  machine_type = var.runner.type

  metadata = {
    ssh-keys = "ubuntu:${local.ssh_pub_key_without_new_line} ubuntu"
  }

  disk {
    source_image = "ubuntu-os-cloud/ubuntu-2004-lts"
    disk_size_gb = 40
    boot         = true
    auto_delete  = true
  }

  depends_on = [google_compute_firewall.externalssh]

  network_interface {
    network = "default"
  }
}

resource "google_compute_instance_from_template" "runner" {
  source_instance_template = google_compute_instance_template.runner.id
  name                     = "${local.base_runner_name}-${random_id.instance_id[count.index].hex}"
  count                    = var.runner.total_count

  labels = {
    "env"     = var.env
    "eternal" = "${var.runner.eternal_count > count.index ? "true" : "false"}"
  }

  network_interface {
    network = "default"

    # Associated our public IP address to this instance
    access_config {
      nat_ip = google_compute_address.static[count.index].address
    }
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = tls_private_key.ssh-key.private_key_pem
    host        = self.network_interface.0.access_config.0.nat_ip
  }

  provisioner "file" {
    source      = "${path.module}/scripts/setup-ubuntu.sh"
    destination = "~/setup-ubuntu.sh"
  }

  provisioner "file" {
    source      = "${path.module}/scripts/cleaner.sh"
    destination = "~/cleaner.sh"
  }

  provisioner "file" {
    source      = "${path.module}/scripts/cron-cleaner"
    destination = "~/cron-cleaner"
  }

  provisioner "remote-exec" {
    inline = [
      "cd",
      "chmod +x ./setup-ubuntu.sh",
      "./setup-ubuntu.sh --token ${data.external.registration_token.result.token} --name ${self.name} --org ${var.github.organisation}"
    ]
  }
}

resource "google_compute_address" "static" {
  count = var.runner.total_count
  name  = "vm-public-address-${random_id.instance_id[count.index].hex}"
}

resource "null_resource" "unregister-runners" {

  triggers = {
    org                 = var.github.organisation
    key_64              = var.github.key_pem_b64
    app_id              = var.github.app_id
    app_installation_id = var.github.app_installation_id
    client_id           = var.github.client_id
    client_secret       = var.github.client_secret
    base_runner_name    = local.base_runner_name
  }

  provisioner "local-exec" {
    # Needed to populate triggers, because destroy provisioner is not enough.
    # Check https://github.com/hashicorp/terraform/issues/23994
    command = "echo provisioning unregister runner provisioner"
  }

  provisioner "local-exec" {
    when    = destroy
    command = "node ${path.module}/scripts/unregister-all-runners.js --org=$ORG \"--private-key-pem=$KEY\" --app-id=$APP_ID --app-installation-id=$APP_INSTALLATION_ID --client-id=$CLIENT_ID --client-secret=$CLIENT_SECRET --base-runner-name=$BASE_RUNNER_NAME"
    environment = {
      ORG                 = self.triggers.org
      KEY                 = "${base64decode(self.triggers.key_64)}"
      APP_ID              = self.triggers.app_id
      APP_INSTALLATION_ID = self.triggers.app_installation_id
      CLIENT_ID           = self.triggers.client_id
      CLIENT_SECRET       = self.triggers.client_secret
      BASE_RUNNER_NAME    = self.triggers.base_runner_name
    }
  }
}
