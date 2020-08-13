resource "random_id" "instance_id" {
  count = var.runner.count
  byte_length = 8
}

resource "tls_private_key" "ssh-key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

locals {
  ssh_pub_key_without_new_line = replace(tls_private_key.ssh-key.public_key_openssh, "\n", "")
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

data "external" "remove_token" {
  program = [
    "node",
    "${path.module}/scripts/get-runner-remove-token.js",
    "--org=${var.github.organisation}",
    "--private-key-pem=${base64decode(var.github.key_pem_b64)}",
    "--app-id=${var.github.app_id}",
    "--app-installation-id=${var.github.app_installation_id}",
    "--client-id=${var.github.client_id}",
    "--client-secret=${var.github.client_secret}"
  ]
}

resource "google_compute_instance" "runner" {
  count        = var.runner.count
  name         = "vm-gcp-github-action-runner-${random_id.instance_id[count.index].hex}"
  machine_type = var.runner.type

  metadata = {
    ssh-keys = "ubuntu:${local.ssh_pub_key_without_new_line} ubuntu"
  }

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
      size = 40
    }
  }

  depends_on = [google_compute_firewall.externalssh]

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

  provisioner "file" {
    when        = destroy
    source      = "${path.module}/scripts/destroy-ubuntu.sh"
    destination = "~/destroy-ubuntu.sh"
  }

  provisioner "remote-exec" {
    when   = destroy
    inline = [
      "cd",
      "chmod +x ./destroy-ubuntu.sh",
      "./destroy-ubuntu.sh --token ${data.external.remove_token.result.token}"
    ]
  }
}

resource "google_compute_address" "static" {
  count = var.runner.count
  name  = "vm-public-address-${random_id.instance_id[count.index].hex}"
}
