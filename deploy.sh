#!/bin/bash

# Install dependencies
npm install

# Build the application
npm run build

# Push database schema
npm run db:push
