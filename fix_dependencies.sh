#!/bin/bash
echo "Installing dependencies..."
npm install
echo "Dependencies installed. Now building the project..."
npm run build
echo "Build complete. Running the seed script..."
