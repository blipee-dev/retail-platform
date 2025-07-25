# Setting Up Jesús and João as Report Recipients

Since the `user_profiles` table requires corresponding entries in `auth.users` (Supabase Authentication), we cannot directly create user profiles via SQL. 

## Current Solution: Email Recipients

The daily reports are already configured to send to:
- pedro@blipee.com (default)
- jmunoz@patrimi.com (Jesús Muñoz Casas) 
- jmelo@patrimi.com (João Célio Melo Pinta Moreira)

These are hardcoded in the `scripts/reports/daily-report-sender.js` file with personalized greetings.

## Options for Database Setup

### Option 1: User Sign-up (Recommended)
1. Have Jesús and João sign up through the application
2. This will create proper auth.users entries
3. Then run the SQL to update their profiles with full names and organization

### Option 2: Update Store Email Lists
Run `update-store-report-emails.sql` to add their emails to all Jack & Jones stores' report_emails field.

### Option 3: Manual Auth User Creation
If you have Supabase admin access:
1. Go to Authentication > Users in Supabase Dashboard
2. Click "Invite User"
3. Enter their emails
4. Once they accept, run the profile update SQL

## Current Implementation
The daily reports already send personalized emails to both recipients with:
- "Buenos días Jesús" for Spanish reports
- "Bom dia João" for Portuguese reports
- Correct first name in the greeting

No database changes are required for the reports to work correctly.