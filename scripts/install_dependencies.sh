#!/bin/bash
# This script will install the necessary dependencies for your Node.js application

# Update package lists
sudo yum update -y

# Install Node.js and npm
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install pm2 process manager to keep your app running in the background
sudo npm install pm2 -g
