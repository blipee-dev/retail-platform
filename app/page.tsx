export default function HomePage() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retail-platform.vercel.app'
  
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Retail Platform</h1>
      <p>Environment: <strong>{environment}</strong></p>
      <p>URL: <strong>{appUrl}</strong></p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Links</h2>
        <ul>
          <li><a href="/api/health">Health Check API</a></li>
          <li><a href="/docs">Documentation</a></li>
          <li><a href="https://github.com/blipee-dev/retail-platform">GitHub Repository</a></li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <h3>Deployment Info</h3>
        <pre>{JSON.stringify({
          node_env: process.env.NODE_ENV,
          vercel_env: process.env.VERCEL_ENV,
          vercel_url: process.env.VERCEL_URL,
          vercel_git_commit_ref: process.env.VERCEL_GIT_COMMIT_REF,
        }, null, 2)}</pre>
      </div>
    </main>
  )
}