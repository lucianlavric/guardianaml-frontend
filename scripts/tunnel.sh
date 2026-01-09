#!/bin/bash

# SSH tunnel to Linux One server
# Forwards:
#   - Port 3000: Frontend (nginx)
#   - Port 8080: Backend (Guardian API)

echo "🔐 Opening SSH tunnel to Linux One server..."
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:8080"
echo ""
echo "Press Ctrl+C to close the tunnel"
echo ""

ssh -i ~/Desktop/GuardianKey.pem \
    -L 3000:localhost:3000 \
    -L 8080:127.0.0.1:8000 \
    linux1@148.100.85.139
