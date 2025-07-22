#!/bin/bash
# Build with Vercel-like configuration

set -e

echo "🚀 Building with Vercel-like configuration..."
echo "==========================================="
echo ""

# Export production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_ENVIRONMENT=production

# Load production environment variables
if [ -f .env.production ]; then
    echo "📋 Loading .env.production..."
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Set Vercel-specific environment variables
export VERCEL=1
export VERCEL_ENV=production
export VERCEL_URL=https://retail-platform.vercel.app
export VERCEL_REGION=iad1

# Next.js specific optimizations that Vercel uses
export NEXT_TELEMETRY_DISABLED=1

echo ""
echo "🔧 Environment Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  NEXT_PUBLIC_ENVIRONMENT: $NEXT_PUBLIC_ENVIRONMENT"
echo "  VERCEL: $VERCEL"
echo "  VERCEL_ENV: $VERCEL_ENV"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies (Vercel always does a fresh install)
echo ""
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund

# Run type checking (Vercel runs this)
echo ""
echo "🔍 Type checking..."
npm run type-check || true

# Run linting (optional, but good practice)
echo ""
echo "🔍 Linting..."
npm run lint || true

# Build the application
echo ""
echo "🏗️  Building application..."
npm run build

# Show build output stats
echo ""
echo "📊 Build Statistics:"
echo "==================="
if [ -d .next ]; then
    echo "Build directory size: $(du -sh .next | cut -f1)"
    echo "Static pages: $(find .next/static -name "*.html" 2>/dev/null | wc -l)"
    echo "Server chunks: $(find .next/server -name "*.js" 2>/dev/null | wc -l)"
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "To test the production build locally:"
echo "  npm run start"
echo ""
echo "Build output is in: .next/"