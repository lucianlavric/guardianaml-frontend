# Guardian Frontend - Nginx Hosting Setup

## Overview

The Guardian frontend is a Next.js static export served by nginx on the LinuxONE server.

## Server Details

- **Server:** LinuxONE IBM
- **Port:** 3000
- **Frontend Path:** `/home/linux1/Guardian/frontend`
- **Static Export:** `/home/linux1/Guardian/frontend/out`

## Nginx Configuration

The site config is located at `/etc/nginx/sites-available/guardianaml` and symlinked to `/etc/nginx/sites-enabled/`.

### Config Structure

```nginx
server {
    listen 3000;
    server_name _;

    root /home/linux1/Guardian/frontend/out;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }

    location /_next/static/ {
        alias /home/linux1/Guardian/frontend/out/_next/static/;
        expires 1y;
        access_log off;
    }
}
```

## How It Works

1. **GitHub Actions** builds the Next.js app and deploys the static export to the server
2. **nginx** serves the `/out` directory on port 3000
3. The `try_files` directive handles client-side routing for Next.js

## Common Commands

```bash
# Check nginx status
sudo systemctl status nginx

# Test config syntax
sudo nginx -t

# Reload after config changes
sudo systemctl reload nginx

# View current config
cat /etc/nginx/sites-available/guardianaml

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Deployment Flow

```
GitHub Push → Actions Build → Deploy to /home/linux1/Guardian/frontend/out → nginx serves on :3000
```
