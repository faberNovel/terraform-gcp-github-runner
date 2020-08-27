variable "google" {
  type = object({
    project = string
    env     = string
  })
}