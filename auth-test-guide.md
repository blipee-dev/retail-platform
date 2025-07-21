# Auth System Testing Guide

## 🗄️ Database Setup (You're doing this now)

1. Go to: https://amqxsmdcvhyaudzbmhaf.supabase.co/project/default/sql
2. Copy the entire contents of `supabase/migrations/combined_migrations.sql`
3. Paste and run in the SQL editor

## 🧪 After Database Setup - Run These Tests:

### Step 1: Verify Database
```bash
node test-auth.js
```
Should show: ✅ Database connection successful!

### Step 2: Test Sign Up Flow
1. Visit: http://localhost:3001/auth/signup
2. Create a test account:
   - Email: test@retailplatform.com
   - Password: TestPass123!
   - Organization: "Test Retail Corp"

### Step 3: Test Sign In Flow
1. Visit: http://localhost:3001/auth/signin
2. Sign in with the account you just created
3. Should redirect to dashboard

### Step 4: Test Role-Based Access
The system will automatically assign you as 'tenant_admin' and redirect to:
- http://localhost:3001/dashboard/admin

### Step 5: Test Language Switching
1. Test auth pages in all 3 languages:
   - English: http://localhost:3001/auth/signin
   - Portuguese: http://localhost:3001/pt/auth/signin
   - Spanish: http://localhost:3001/es/auth/signin

### Step 6: Test Auth Protection
1. Try accessing dashboard without auth: http://localhost:3001/dashboard
2. Should redirect to sign in page

## 🐛 Common Issues to Watch For:

1. **Migration Errors**: If you see schema errors, let me know which SQL statement failed
2. **Redirect Issues**: Auth should redirect to dashboard after successful login
3. **i18n Hydration**: Watch console for hydration mismatches
4. **Role Assignment**: New users should get 'tenant_admin' role automatically

## 🔧 Quick Fixes Ready:

- If auth redirects fail → I'll fix the dashboard routing
- If signup doesn't work → I'll check the user profile creation
- If roles aren't assigned → I'll fix the trigger functions
- If i18n breaks → I'll update the auth translations

Let me know what happens after you run the migrations!