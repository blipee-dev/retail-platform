#!/bin/bash

echo "🚀 Deploying to Vercel..."

# Check if logged in to Vercel
if ! vercel whoami > /dev/null 2>&1; then
    echo "📝 Please login to Vercel first"
    vercel login
fi

# Deploy to Vercel
echo "🔨 Building and deploying..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📌 Next steps:"
echo "1. Check your deployment at https://vercel.com/dashboard"
echo "2. Set environment variables if not already done"
echo "3. Test your live application"