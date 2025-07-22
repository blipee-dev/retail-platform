# Update Supabase Credentials

## Current Issue
The .env file is pointing to project `amqxsmdcvhyaudzbmhaf` but you need to use `supabase-sky-park`.

## Steps to Update

1. **Get your Supabase credentials**:
   - Go to https://app.supabase.com
   - Select your `supabase-sky-park` project
   - Go to Settings → API

2. **Update .env file with these values**:

```bash
# Replace the existing BLIPEE_* variables with your sky-park project values:

# From Settings → API
BLIPEE_NEXT_PUBLIC_SUPABASE_URL=https://[your-sky-park-ref].supabase.co
BLIPEE_SUPABASE_URL=https://[your-sky-park-ref].supabase.co
BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
BLIPEE_SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
BLIPEE_SUPABASE_JWT_SECRET=[your-jwt-secret]

# From Settings → Database
BLIPEE_POSTGRES_HOST=db.[your-sky-park-ref].supabase.co
BLIPEE_POSTGRES_USER=postgres
BLIPEE_POSTGRES_PASSWORD=[your-database-password]
BLIPEE_POSTGRES_DATABASE=postgres

# Connection strings (from Settings → Database → Connection string)
BLIPEE_POSTGRES_URL=[your-pooler-connection-string]
BLIPEE_POSTGRES_PRISMA_URL=[your-pooler-connection-string-with-pgbouncer]
BLIPEE_POSTGRES_URL_NON_POOLING=[your-direct-connection-string]
```

3. **After updating**, we'll need to:
   - Run migrations on the sky-park database
   - Test the connection

## Example (DO NOT USE - Get your own values):
```bash
# This is what it should look like (with fake values)
BLIPEE_NEXT_PUBLIC_SUPABASE_URL=https://skypark123abc.supabase.co
BLIPEE_SUPABASE_URL=https://skypark123abc.supabase.co
BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
BLIPEE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-key...
```

## Quick Test After Update

Once you update the .env file, we can test the connection:

```bash
# Test connection
psql "$BLIPEE_POSTGRES_URL" -c "SELECT current_database();"
```

Please update your .env file with the correct sky-park credentials and let me know when you're ready to proceed!