# 🚀 How to Run Database Migrations

## Option 1: Using Supabase Dashboard (Easiest)

1. **Login to your Supabase project**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run migrations in order**:

   **Step 1: Core Auth Tables**
   - Copy and paste the contents of `/supabase/migrations/combined_migrations.sql`
   - Click "Run" 
   - You should see "Success. No rows returned"

   **Step 2: Sensor Tables**
   - Create a new query
   - Copy and paste the contents of `/supabase/migrations/20240120000007_create_sensor_tables.sql`
   - Click "Run"

4. **Verify installation**
   - Go to "Table Editor" in the sidebar
   - You should see these tables:
     - organizations
     - user_profiles
     - regions
     - stores
     - sensor_metadata
     - people_counting_raw
     - And more...

## Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Check status
supabase db diff
```

## Option 3: Using psql

```bash
# Connect to your database
psql "postgresql://postgres.[your-project-ref]:[your-password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Run migrations
\i /workspaces/retail-platform/supabase/migrations/combined_migrations.sql
\i /workspaces/retail-platform/supabase/migrations/20240120000007_create_sensor_tables.sql
```

## 🧪 Test Your Setup

After running migrations, test with this query:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## 🎯 Expected Results

You should have:
- **15+ tables** created
- **All tables** with RLS enabled
- **5+ helper functions** available

## 🚨 Troubleshooting

### Error: "type user_role_enum already exists"
- The migrations were partially run before
- Drop all tables and start fresh:
```sql
-- BE CAREFUL: This deletes everything!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

### Error: "relation auth.users does not exist"
- Make sure Supabase Auth is enabled in your project
- Go to Authentication → Settings → Enable

### Error: "permission denied"
- Make sure you're using the service role key
- Or connect as the postgres user

## ✅ Next Steps

1. **Create test organization**:
   - Go to your app at `/auth/signup`
   - Create your first organization

2. **Verify multi-tenancy**:
   - Check that RLS policies are working
   - Try accessing data from different users

3. **Add test sensor**:
   - Use the seed data or create manually
   - Test data flow

## 📝 Notes

- Migrations are idempotent (safe to run multiple times)
- Always backup your data before running migrations in production
- The sensor tables are optimized for Milesight cameras but can work with any sensor type