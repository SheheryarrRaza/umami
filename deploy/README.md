# Deployment

In production, TLS termination, request rate limits and CORS are enforced at the nginx proxy (`nginx/umami.conf`) and the AWS WAF (`aws/waf-rules.json`).
Application secrets (`APP_SECRET`, `DATABASE_URL`) are injected from HashiCorp Vault (`k8s/deployment.yaml`) and are never stored in the image or in this repository.
