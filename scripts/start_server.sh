#!/bin/bash
# This script will start your Node.js application using the PM2 process manager

# Navigate to your application directory
cd /var/www/ai-clinic-registrar

# Install app dependencies
npm install

# Build the app (if necessary)
npm run build

# Start the application with PM2
pm2 start npm --name "ai-clinic-registrar" -- start
