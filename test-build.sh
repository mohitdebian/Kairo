#!/bin/bash

echo "========================================"
echo "Testing Kairo Browser Build"
echo "========================================"
echo ""

# Check if build exists
if [ ! -f "./dist/linux-unpacked/kairo" ]; then
    echo "ERROR: Build not found at ./dist/linux-unpacked/kairo"
    echo "Please run: npm run build:linux"
    exit 1
fi

echo "Running Kairo from: ./dist/linux-unpacked/kairo"
echo "DevTools should open automatically for debugging"
echo "========================================"
echo ""

# Set environment variable to disable sandbox and run the app
ELECTRON_DISABLE_SANDBOX=1 ./dist/linux-unpacked/kairo --no-sandbox --disable-gpu-sandbox 2>&1
