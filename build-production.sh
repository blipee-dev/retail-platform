#!/bin/bash
# Simplified production build script

set -e

echo "🚀 Building for production..."
echo "============================"
echo ""

# Set production environment
export NODE_ENV=production
export NEXT_PUBLIC_ENVIRONMENT=production

# Vercel environment variables
export VERCEL=1
export VERCEL_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Load production env vars if available
if [ -f .env.production ]; then
    echo "📋 Loading production environment variables..."
    set -a
    source .env.production
    set +a
fi

echo "🔧 Environment:"
echo "  NODE_ENV: $NODE_ENV"
echo "  VERCEL: $VERCEL"
echo ""

# Clean build directory
echo "🧹 Cleaning previous build..."
rm -rf .next

# Run the build
echo "🏗️  Building application..."
npm run build

# Show results
echo ""
if [ -d .next ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📊 Build Stats:"
    echo "  Size: $(du -sh .next | cut -f1)"
    echo "  Location: .next/"
else
    echo "❌ Build failed!"
    exit 1
fi