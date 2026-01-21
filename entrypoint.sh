#!/bin/sh
set -e

# Run migrations
echo "Deploying database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting Next.js..."
node server.js
