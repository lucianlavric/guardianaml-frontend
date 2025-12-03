#!/bin/bash
echo "Killing SSH tunnel..."
pkill -f "ssh -N -f.*8080:localhost:80"
echo "Tunnel killed."