// Preview of how the updated daily-report-sender.js will work

/* 
CURRENT APPROACH (Hardcoded):
- Hardcoded ADDITIONAL_RECIPIENTS array
- Hardcoded EMAIL_TO_NAME mapping
- Same recipients for all stores

NEW APPROACH (Dynamic from database):
1. Platform admins (role = 'platform_admin') get ALL reports
2. Organization admins (role = 'tenant_admin') get reports for their org's stores
3. Store managers get reports for their assigned stores
4. Recipients pulled from user_profiles table
5. Names come from full_name field in database
*/

// The new getReportRecipients function would look like this:
async function getReportRecipients(store) {
  // Get all platform admins (they get every report)
  const { data: platformAdmins } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('role', 'platform_admin')
    .eq('is_active', true);

  // Get organization admins for this store's organization
  const { data: orgAdmins } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .eq('role', 'tenant_admin')
    .eq('organization_id', store.organization_id)
    .eq('is_active', true);

  // Get store-specific recipients if configured
  const storeRecipients = store.report_emails ? 
    store.report_emails.split(',').map(email => ({
      email: email.trim(),
      full_name: email.split('@')[0] // Fallback name
    })) : [];

  // Combine all recipients and remove duplicates
  const allRecipients = [
    ...(platformAdmins || []),
    ...(orgAdmins || []),
    ...storeRecipients
  ];

  // Remove duplicates by email
  const uniqueRecipients = allRecipients.reduce((acc, recipient) => {
    if (!acc.find(r => r.email === recipient.email)) {
      acc.push(recipient);
    }
    return acc;
  }, []);

  return uniqueRecipients;
}

// The sendReport function would be updated to:
async function sendReport(store, data, reportDate) {
  const recipients = await getReportRecipients(store);
  const language = getLanguageForStore(store);
  
  let successCount = 0;
  let failureCount = 0;
  
  // Send personalized email to each recipient
  for (const recipient of recipients) {
    try {
      // Extract first name from full_name
      const firstName = recipient.full_name ? 
        recipient.full_name.split(' ')[0] : 
        recipient.email.split('@')[0];
      
      // Generate personalized HTML
      const html = generateReport(store, data, reportDate, language, firstName);
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'analytics@blipee.com',
        to: recipient.email,
        subject: `Daily Traffic Report - ${store.name} - ${format(reportDate, 'MMM d, yyyy')}`,
        html: html
      });
      
      console.log(`✅ Report sent to ${recipient.email} (${recipient.full_name}) for ${store.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send email to ${recipient.email}:`, error);
      failureCount++;
    }
  }
  
  return successCount > 0;
}

/* 
BENEFITS:
1. No more hardcoded emails
2. Automatically includes new platform/org admins
3. Respects user permissions and roles
4. Uses real names from database
5. Only sends to active users
6. Pedro gets ALL reports (platform_admin)
7. Jesús & João only get Jack & Jones reports (tenant_admin)

RECIPIENT LOGIC:
- Platform Admin (Pedro): Gets reports for ALL stores
- Tenant Admin (Jesús, João): Gets reports for Jack & Jones stores only
- Store Manager: Would get reports for assigned stores only
- Viewer/Staff: No reports (unless added to store.report_emails)
*/