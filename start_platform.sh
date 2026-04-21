#!/bin/bash

echo "🌱 Starting Plant Doctor AI Platform..."
echo "---------------------------------------"

echo "1. Checking backend dependencies..."
cd "backend"
# Use the root virtual environment
source "../.venv/bin/activate"
pip install -r requirements.txt
echo "Starting FastAPI Backend Engine on http://localhost:8000"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
cd ..

echo "---------------------------------------"
echo "2. Starting Next.js Web Application..."
cd "web"
# Ensure we have required latest dependencies
npm install @radix-ui/react-slot framer-motion lucide-react class-variance-authority clsx tailwind-merge
echo "Starting Next.js Dev Server on http://localhost:3000"
npm run dev
