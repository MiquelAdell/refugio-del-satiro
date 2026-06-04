#!/usr/bin/env bash
set -o errexit

# Install Python dependencies
pip install .

# Build frontend
cd frontend
npm ci
npm run build
