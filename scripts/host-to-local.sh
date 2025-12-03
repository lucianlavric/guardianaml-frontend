#!/bin/bash
set -e

KEY_PATH="$HOME/Desktop/GuardianKey.pem"

echo "Setting up tunnel to remote inference stack..."

ssh -N -f \
    -i "$KEY_PATH" \
    -L 8080:localhost:8080 \
    linux1@148.100.85.139

echo "Tunnel established. Inference stack accessible at localhost:8080"