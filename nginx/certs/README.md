# TLS Certificates

This directory is intentionally left without actual certificate material. The nginx image generates a self-signed development certificate during build time. For production, mount your own `server.crt` and `server.key` files into `/etc/nginx/certs/` inside the container.
