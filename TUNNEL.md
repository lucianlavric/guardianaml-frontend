# SSH Tunneling Guide

## Overview

This project is deployed on an IBM Linux One server. Due to cloud firewall restrictions, external access to the application ports is blocked. We use SSH tunneling to securely access the application from your local machine.

## What is SSH Tunneling?

SSH tunneling (port forwarding) creates a secure connection between your local machine and the remote server, allowing you to access remote services as if they were running locally.

## Tunneled Ports

- **Port 3000** → Frontend (Next.js app served by nginx)
- **Port 8080** → Backend (Guardian FastAPI API)

## Quick Start

### 1. Open the Tunnel

```bash
./scripts/tunnel.sh
```

This script will:
- Connect to the Linux One server via SSH
- Forward ports 3000 and 8080 to your local machine
- Display access URLs

**Keep this terminal window open** while using the application.

### 2. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

The frontend will automatically communicate with the backend at `http://localhost:8080`.

### 3. Close the Tunnel

Press `Ctrl+C` in the terminal running the tunnel script.

## Manual Tunnel Command

If you need to run the tunnel manually:

```bash
ssh -i ~/Desktop/GuardianKey.pem \
    -L 3000:localhost:3000 \
    -L 8080:127.0.0.1:8000 \
    linux1@148.100.85.139
```

## Deploying Updates

Deployment is automated via GitHub Actions. Simply push your changes to the repository:

```bash
git add .
git commit -m "Your commit message"
git push
```

The GitHub Action will automatically:
1. Build the application
2. Deploy files to the Linux One server
3. Reload nginx

Your changes will be live shortly after the action completes!

## Environment Configuration

### Frontend Environment Variables

The frontend is configured to call the backend at:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

This environment variable is set in the code and points to the tunneled backend port.

### Server Configuration

On the Linux One server:

- **Frontend location**: `/home/linux1/Guardian/frontend/`
- **Nginx config**: `/etc/nginx/sites-available/guardianaml`
- **Nginx port**: 3000
- **Backend port**: 8000 (Guardian FastAPI)

## Troubleshooting

### Tunnel Won't Connect

**Error**: `Permission denied (publickey)`

**Solution**: Ensure you have the SSH key at `~/Desktop/GuardianKey.pem`

```bash
ls -l ~/Desktop/GuardianKey.pem
```

### Port Already in Use

**Error**: `bind [127.0.0.1]:3000: Address already in use`

**Solution**: Close any applications using port 3000 or 8080 on your local machine

```bash
# Find what's using the port
lsof -i :3000
lsof -i :8080

# Kill the process if needed
kill -9 <PID>
```

### Black Screen in Browser

**Solution**: Navigate directly to `http://localhost:3000/` (home page now shows the dashboard)

Check browser console for errors (F12 or Cmd+Option+I).

### API Calls Failing

**Symptoms**: Frontend loads but data won't load

**Solutions**:
1. Ensure the tunnel is running for **both** ports (3000 and 8080)
2. Verify the Guardian backend is running on the server:
   ```bash
   ssh -i ~/Desktop/GuardianKey.pem linux1@148.100.85.139
   sudo ss -tulpn | grep :8000
   ```

### Changes Not Showing Up

**Solution**: Clear browser cache or do a hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

## Server-Side Nginx Configuration

Location: `/etc/nginx/sites-available/guardianaml`

```nginx
server {
    listen 3000;
    server_name _;

    root /home/linux1/Guardian/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /_next/ {
        expires 1y;
        add_header Cache-Control "public";
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt { access_log off; log_not_found off; }
}
```

## Architecture Diagram

```
┌─────────────────────┐
│   Your Mac          │
│                     │
│  localhost:3000 ────┼───┐
│  localhost:8080 ────┼─┐ │
└─────────────────────┘ │ │
                        │ │
         SSH Tunnel     │ │
         (Encrypted)    │ │
                        │ │
┌─────────────────────┐ │ │
│  Linux One Server   │ │ │
│  148.100.85.139     │ │ │
│                     │ │ │
│  Port 3000 ─────────┼─┘ │  (nginx → Next.js frontend)
│  Port 8000 ─────────┼───┘  (Guardian FastAPI backend)
└─────────────────────┘
```

## Additional Notes

- The tunnel must remain active while you use the application
- Each developer needs their own tunnel connection
- The SSH key (`GuardianKey.pem`) should be kept secure and not committed to git
- Static export configuration in `next.config.ts` allows the app to be served by nginx without Node.js runtime

## Support

If you encounter issues not covered here, check:

1. SSH connection to the server is working
2. Nginx is running: `sudo systemctl status nginx`
3. Guardian backend is running: `sudo ss -tulpn | grep :8000`
4. Firewall rules on the server: `sudo ufw status`
