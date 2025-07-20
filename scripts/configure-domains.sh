#!/bin/bash

echo "🌍 Configuring Vercel Domains"
echo "============================"
echo ""

# Check if logged in
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Please login to Vercel first: vercel login"
    exit 1
fi

# Get project name
PROJECT_NAME=$(cat .vercel/project.json 2>/dev/null | grep '"name"' | cut -d'"' -f4)
if [ -z "$PROJECT_NAME" ]; then
    echo "❌ No Vercel project linked. Run: vercel link"
    exit 1
fi

echo "📦 Project: $PROJECT_NAME"
echo ""

# Function to add domain alias
add_domain_alias() {
    local branch=$1
    local custom_domain=$2
    local deployment_pattern=$3
    
    echo "🔗 Configuring $custom_domain for $branch branch..."
    
    # First, let's find the latest deployment for this branch
    echo "Finding latest deployment for $branch branch..."
    
    # Get the deployment URL for the branch
    latest_deployment=$(vercel ls --json 2>/dev/null | grep -o "https://[^\"]*-git-${branch}-[^\"]*\.vercel\.app" | head -1)
    
    if [ -n "$latest_deployment" ]; then
        echo "Found deployment: $latest_deployment"
        echo "Creating alias: $custom_domain → $latest_deployment"
        vercel alias set "$latest_deployment" "$custom_domain"
    else
        echo "⚠️  No deployment found for $branch branch"
        echo "Deploy to $branch first, then run this script again"
    fi
    
    echo ""
}

# Production domain is automatic, just show info
echo "✅ Production Domain"
echo "   Branch: main"
echo "   Domain: ${PROJECT_NAME}.vercel.app"
echo "   Status: Automatically configured"
echo ""

# Configure staging
echo "🔧 Staging Domain"
add_domain_alias "staging" "${PROJECT_NAME}-staging.vercel.app" "${PROJECT_NAME}-git-staging-*"

# Configure development
echo "🔧 Development Domain"
add_domain_alias "develop" "${PROJECT_NAME}-development.vercel.app" "${PROJECT_NAME}-git-develop-*"

echo "📋 Summary"
echo "=========="
echo "Production:  https://${PROJECT_NAME}.vercel.app"
echo "Staging:     https://${PROJECT_NAME}-staging.vercel.app"
echo "Development: https://${PROJECT_NAME}-development.vercel.app"
echo ""
echo "💡 Tips:"
echo "- Domains update automatically on new deployments"
echo "- You can manage domains at: https://vercel.com/${PROJECT_NAME}/settings/domains"
echo "- For custom domains (like myapp.com), add them in the Vercel dashboard"