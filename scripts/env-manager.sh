#!/bin/bash

# Environment Variable Manager for Vercel
# Usage: ./scripts/env-manager.sh [command] [environment]

COMMAND=$1
ENV=$2

show_help() {
    echo "Environment Variable Manager"
    echo ""
    echo "Usage: $0 [command] [environment]"
    echo ""
    echo "Commands:"
    echo "  push    - Push local env vars to Vercel"
    echo "  pull    - Pull env vars from Vercel"
    echo "  list    - List all env vars"
    echo "  sync    - Sync env vars across environments"
    echo ""
    echo "Environments: development, staging, production"
}

push_env() {
    local env_file=".env.$ENV"
    local vercel_env=""
    
    if [ ! -f "$env_file" ]; then
        echo "❌ Environment file $env_file not found!"
        exit 1
    fi
    
    # Map our environment names to Vercel's environment names
    case $ENV in
        "production")
            vercel_env="production"
            ;;
        "staging"|"development")
            vercel_env="preview"
            ;;
        *)
            echo "❌ Invalid environment: $ENV"
            exit 1
            ;;
    esac
    
    echo "📤 Pushing variables from $env_file to Vercel ($ENV → $vercel_env)..."
    
    # Read each line from env file
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ $line =~ ^#.*$ ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # Extract key and value
        if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            value="${BASH_REMATCH[2]}"
            
            # Remove quotes if present
            value="${value%\"}"
            value="${value#\"}"
            
            echo "Setting $key..."
            echo "$value" | vercel env add "$key" "$vercel_env" --force
        fi
    done < "$env_file"
    
    echo "✅ Environment variables pushed!"
}

pull_env() {
    local env_file=".env.$ENV.pulled"
    local vercel_env=""
    
    # Map our environment names to Vercel's environment names
    case $ENV in
        "production")
            vercel_env="production"
            ;;
        "staging"|"development")
            vercel_env="preview"
            ;;
        *)
            echo "❌ Invalid environment: $ENV"
            exit 1
            ;;
    esac
    
    echo "📥 Pulling variables from Vercel ($ENV → $vercel_env) to $env_file..."
    vercel env pull "$env_file" --environment="$vercel_env"
    echo "✅ Environment variables saved to $env_file"
}

list_env() {
    local vercel_env=""
    
    # Map our environment names to Vercel's environment names
    case $ENV in
        "production")
            vercel_env="production"
            ;;
        "staging"|"development")
            vercel_env="preview"
            ;;
        *)
            vercel_env="production"  # Default to production for listing
            ;;
    esac
    
    echo "📋 Listing environment variables for $ENV (Vercel: $vercel_env)..."
    vercel env ls --environment="$vercel_env"
}

sync_env() {
    echo "🔄 Syncing environment variables..."
    
    # Define which variables to sync
    SYNC_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "MILESIGHT_API_URL"
    )
    
    for var in "${SYNC_VARS[@]}"; do
        echo "Syncing $var across environments..."
        
        # Get value from production
        value=$(vercel env pull .env.temp --environment=production 2>/dev/null && grep "^$var=" .env.temp | cut -d'=' -f2-)
        
        if [ ! -z "$value" ]; then
            echo "$value" | vercel env add "$var" development --force
            echo "$value" | vercel env add "$var" staging --force
            echo "✅ $var synced"
        fi
    done
    
    rm -f .env.temp
    echo "✅ Sync complete!"
}

# Main logic
case $COMMAND in
    "push")
        if [ -z "$ENV" ]; then
            echo "❌ Please specify environment: development, staging, or production"
            exit 1
        fi
        push_env
        ;;
    "pull")
        if [ -z "$ENV" ]; then
            echo "❌ Please specify environment: development, staging, or production"
            exit 1
        fi
        pull_env
        ;;
    "list")
        ENV=${ENV:-production}
        list_env
        ;;
    "sync")
        sync_env
        ;;
    *)
        show_help
        ;;
esac