#!/bin/bash

# SSH tunnel to Linux One server - Frontend only
# Forwards:
#   - Port 3000: Frontend (nginx)

echo "🔐 Opening SSH tunnel to Linux One server..."
echo "📱 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to close the tunnel"
echo ""

ssh -i ~/Desktop/GuardianKey.pem \
    -L 3000:localhost:3000 \
    linux1@148.100.85.139
