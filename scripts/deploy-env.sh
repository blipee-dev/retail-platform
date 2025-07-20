#!/bin/bash

# Deploy to specific environment
# Usage: ./scripts/deploy-env.sh [development|staging|production]

ENV=${1:-staging}
BRANCH=""
ALIAS=""

case $ENV in
  "development")
    BRANCH="develop"
    ALIAS="development"
    echo "🔧 Deploying to Development environment..."
    ;;
  "staging")
    BRANCH="staging"
    ALIAS="staging"
    echo "🧪 Deploying to Staging environment..."
    ;;
  "production")
    BRANCH="main"
    ALIAS=""  # No alias for production
    echo "🚀 Deploying to Production environment..."
    ;;
  *)
    echo "❌ Invalid environment: $ENV"
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "⚠️  Warning: You're on branch '$CURRENT_BRANCH' but deploying from '$BRANCH'"
  read -p "Continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Deploy
if [ "$ENV" == "production" ]; then
  vercel --prod
else
  vercel --env-file=.env.$ENV --alias=$ALIAS
fi

echo "✅ Deployment to $ENV complete!"