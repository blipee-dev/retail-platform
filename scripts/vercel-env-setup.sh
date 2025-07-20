#!/bin/bash

echo "🔐 Setting up Vercel environment variables..."

# Source the .env file
if [ -f .env ]; then
    export $(cat .env | grep BLIPEE_ | xargs)
else
    echo "❌ .env file not found!"
    exit 1
fi

# Add environment variables to Vercel
echo "Adding Supabase URL..."
echo "$BLIPEE_NEXT_PUBLIC_SUPABASE_URL" | vercel env add BLIPEE_NEXT_PUBLIC_SUPABASE_URL production

echo "Adding Supabase Anon Key..."
echo "$BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY" | vercel env add BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo "Adding Supabase Service Role Key..."
echo "$BLIPEE_SUPABASE_SERVICE_ROLE_KEY" | vercel env add BLIPEE_SUPABASE_SERVICE_ROLE_KEY production

echo "Adding JWT Secret..."
echo "$BLIPEE_SUPABASE_JWT_SECRET" | vercel env add BLIPEE_SUPABASE_JWT_SECRET production

echo "Adding Postgres URL..."
echo "$BLIPEE_POSTGRES_URL" | vercel env add BLIPEE_POSTGRES_URL production

echo "✅ Environment variables added to Vercel!"
echo ""
echo "📌 You can verify them at: https://vercel.com/[your-username]/retail-platform/settings/environment-variables"