'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

// Code examples for the API section
const codeExamples = {
  curl: `curl -X POST https://api.blipee.com/v1/data/sales \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "store_id": "store_123",
    "timestamp": "2024-01-17T10:30:00Z",
    "transaction_id": "txn_456",
    "amount": 129.99,
    "items": [
      {
        "sku": "PROD-001",
        "quantity": 2,
        "price": 64.99
      }
    ],
    "customer_id": "cust_789"
  }'`,
  python: `import requests
import json

api_key = "YOUR_API_KEY"
url = "https://api.blipee.com/v1/data/sales"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "store_id": "store_123",
    "timestamp": "2024-01-17T10:30:00Z",
    "transaction_id": "txn_456",
    "amount": 129.99,
    "items": [
        {
            "sku": "PROD-001",
            "quantity": 2,
            "price": 64.99
        }
    ],
    "customer_id": "cust_789"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,
  nodejs: `const axios = require('axios');

const apiKey = 'YOUR_API_KEY';
const url = 'https://api.blipee.com/v1/data/sales';

const data = {
  store_id: 'store_123',
  timestamp: '2024-01-17T10:30:00Z',
  transaction_id: 'txn_456',
  amount: 129.99,
  items: [
    {
      sku: 'PROD-001',
      quantity: 2,
      price: 64.99
    }
  ],
  customer_id: 'cust_789'
};

axios.post(url, data, {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));`,
  php: `$apiKey = 'YOUR_API_KEY';
$url = 'https://api.blipee.com/v1/data/sales';

$data = [
    'store_id' => 'store_123',
    'timestamp' => '2024-01-17T10:30:00Z',
    'transaction_id' => 'txn_456',
    'amount' => 129.99,
    'items' => [
        [
            'sku' => 'PROD-001',
            'quantity' => 2,
            'price' => 64.99
        ]
    ],
    'customer_id' => 'cust_789'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;`
}

export default function IntegrationsContent() {
  const { t: tCommon, ready: readyCommon } = useTranslation('common')
  const { t, ready } = useTranslation('integrations')
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('nocode')
  const [activeCodeTab, setActiveCodeTab] = useState('curl')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready || !readyCommon) {
    return null
  }

  const integrations = ['square', 'shopify', 'clover', 'csv', 'camera', 'zapier']
  const codeTabs = ['curl', 'python', 'nodejs', 'php']
  const features = t('api.features', { returnObjects: true }) as string[]
  const dataTypes = t('api.dataTypes.table.rows', { returnObjects: true }) as any[]

  const getIntegrationEmoji = (integration: string) => {
    const emojis: { [key: string]: string } = {
      square: '📱',
      shopify: '🛍️',
      clover: '🍀',
      csv: '📊',
      camera: '📹',
      zapier: '⚡'
    }
    return emojis[integration] || '📦'
  }

  return (
    <>
      <div className="bg-container">
        <div className="bg-gradient-mesh"></div>
      </div>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link href="/" className="logo">{tCommon('app.name')}</Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">{tCommon('nav.home')}</Link>
            <Link href="/pricing" className="nav-link">{tCommon('nav.pricing')}</Link>
            <Link href="/docs" className="nav-link">{tCommon('nav.docs')}</Link>
            <Link href="/auth/signin" className="nav-link">{tCommon('nav.signIn')}</Link>
            <Link href="/auth/signup" className="btn btn-primary">{tCommon('nav.startFreeTrial')}</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">{t('header.title')}</h1>
          <p className="page-subtitle">{t('header.subtitle')}</p>
        </div>

        {/* Integration Method Toggle */}
        <div className="method-toggle">
          <div className="toggle-container">
            <button 
              className={`toggle-btn ${activeSection === 'nocode' ? 'active' : ''}`}
              onClick={() => setActiveSection('nocode')}
            >
              {t('toggle.noCode')}
            </button>
            <button 
              className={`toggle-btn ${activeSection === 'api' ? 'active' : ''}`}
              onClick={() => setActiveSection('api')}
            >
              {t('toggle.api')}
            </button>
          </div>
        </div>

        {/* No-Code Section */}
        <div className={`content-section ${activeSection === 'nocode' ? 'active' : ''}`}>
          <div className="integration-grid">
            {integrations.map((integration) => (
              <div key={integration} className="integration-card">
                <div className="integration-logo">{getIntegrationEmoji(integration)}</div>
                <h3 className="integration-title">{t(`integrations.${integration}.title`)}</h3>
                <div className="integration-status">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  {t(`integrations.${integration}.status`)}
                </div>
                <p className="integration-description">{t(`integrations.${integration}.description`)}</p>
                <button className="setup-btn">{t(`integrations.${integration}.button`)}</button>
              </div>
            ))}
          </div>
        </div>

        {/* API Section */}
        <div className={`content-section ${activeSection === 'api' ? 'active' : ''}`}>
          <div className="api-overview">
            <h2 className="api-title">{t('api.title')}</h2>
            <p className="api-description">{t('api.description')}</p>
            
            <div className="api-features">
              {features.map((feature, index) => (
                <div key={index} className="api-feature">
                  <div className="feature-icon">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="white">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Link href="/docs" className="btn btn-primary">{t('api.docsButton')}</Link>
          </div>

          {/* Code Examples */}
          <div className="code-examples">
            <h3 className="example-title">{t('api.examples.title')}</h3>
            
            <div className="code-tabs">
              {codeTabs.map((tab) => (
                <button 
                  key={tab}
                  className={`code-tab ${activeCodeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveCodeTab(tab)}
                >
                  {t(`api.examples.tabs.${tab}`)}
                </button>
              ))}
            </div>

            <div className="code-block">
              <pre>{codeExamples[activeCodeTab as keyof typeof codeExamples]}</pre>
            </div>
          </div>

          {/* Data Format */}
          <div className="data-format">
            <h3 className="format-title">{t('api.dataTypes.title')}</h3>
            <p className="api-description">{t('api.dataTypes.subtitle')}</p>
            
            <table className="format-table">
              <thead>
                <tr>
                  <th>{t('api.dataTypes.table.headers.type')}</th>
                  <th>{t('api.dataTypes.table.headers.endpoint')}</th>
                  <th>{t('api.dataTypes.table.headers.fields')}</th>
                </tr>
              </thead>
              <tbody>
                {dataTypes.map((row, index) => (
                  <tr key={index}>
                    <td>{row.type}</td>
                    <td><code>{row.endpoint}</code></td>
                    <td>{row.fields}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2 className="cta-title">{t('cta.title')}</h2>
          <p className="cta-subtitle">{t('cta.subtitle')}</p>
          <Link href="/auth/signup" className="btn btn-primary">{t('cta.button')}</Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        background: 'rgba(2, 6, 23, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: '4rem'
      }}>
        <p>
          &copy; 2024 {tCommon('app.name')}. {tCommon('footer.copyright')} | 
          <Link href="/terms" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', margin: '0 0.5rem' }}>
            {tCommon('footer.links.terms')}
          </Link> | 
          <Link href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', margin: '0 0.5rem' }}>
            {tCommon('footer.links.privacy')}
          </Link> | 
          {tCommon('footer.certifications')}
        </p>
      </footer>

      <style>{`
        :root {
          /* Gradient System */
          --gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%);
          --gradient-purple: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
          --gradient-blue: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%);
          --gradient-green: linear-gradient(135deg, #10B981 0%, #0EA5E9 100%);
          --gradient-mesh: radial-gradient(at 40% 20%, hsla(280,100%,74%,0.3) 0px, transparent 50%),
                          radial-gradient(at 80% 0%, hsla(189,100%,56%,0.2) 0px, transparent 50%),
                          radial-gradient(at 0% 50%, hsla(355,100%,93%,0.2) 0px, transparent 50%);
          
          /* Colors */
          --purple: #8B5CF6;
          --blue: #0EA5E9;
          --green: #10B981;
          --dark: #0F172A;
          --darker: #020617;
          --white: #FFFFFF;
          
          /* Glassmorphism */
          --glass-bg: rgba(255, 255, 255, 0.05);
          --glass-border: rgba(255, 255, 255, 0.1);
          --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 100px;
        }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--darker);
          color: var(--white);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
        }

        /* Background */
        .bg-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          background: var(--darker);
          overflow: hidden;
        }

        .bg-gradient-mesh {
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background: var(--gradient-mesh);
          opacity: 0.3;
          animation: meshAnimation 30s ease infinite;
        }

        @keyframes meshAnimation {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-20px, -20px) rotate(120deg); }
          66% { transform: translate(20px, -10px) rotate(240deg); }
        }

        /* Navigation */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 1.5rem 2rem;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--glass-border);
        }

        .nav-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.75rem;
          font-weight: 400;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          color: var(--white);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          font-size: 0.95rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: var(--gradient-primary);
          color: var(--white);
          box-shadow: 0 4px 15px 0 rgba(139, 92, 246, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.4);
        }

        /* Main Container */
        .container {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 8rem 2rem 4rem;
        }

        /* Header */
        .page-header {
          text-align: center;
          margin-bottom: 4rem;
          animation: fadeInUp 0.6s ease;
        }

        .page-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Integration Methods Toggle */
        .method-toggle {
          display: flex;
          justify-content: center;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        .toggle-container {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 0.75rem;
          padding: 0.25rem;
          display: flex;
          backdrop-filter: blur(20px);
        }

        .toggle-btn {
          padding: 0.75rem 2rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          cursor: pointer;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
        }

        .toggle-btn.active {
          background: var(--gradient-primary);
          color: var(--white);
        }

        /* Content Sections */
        .content-section {
          display: none;
          animation: fadeInUp 0.6s ease;
        }

        .content-section.active {
          display: block;
        }

        /* No-Code Section */
        .integration-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .integration-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .integration-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--gradient-primary);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }

        .integration-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
        }

        .integration-card:hover::before {
          transform: translateX(0);
        }

        .integration-logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          font-size: 2rem;
        }

        .integration-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .integration-description {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .integration-status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 2rem;
          font-size: 0.875rem;
          color: var(--green);
          margin-bottom: 1rem;
        }

        .setup-btn {
          width: 100%;
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--white);
          font-weight: 600;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .setup-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        /* API Section */
        .api-overview {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2.5rem;
          margin-bottom: 3rem;
          backdrop-filter: blur(20px);
        }

        .api-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .api-description {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .api-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .api-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .feature-icon {
          width: 32px;
          height: 32px;
          background: var(--gradient-primary);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Code Examples */
        .code-examples {
          margin-top: 3rem;
        }

        .example-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .code-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .code-tab {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .code-tab.active {
          background: var(--gradient-primary);
          color: var(--white);
          border-color: transparent;
        }

        .code-block {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid var(--glass-border);
          border-radius: 0.75rem;
          padding: 1.5rem;
          overflow-x: auto;
          margin-bottom: 2rem;
        }

        .code-block pre {
          margin: 0;
          color: #E2E8F0;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          white-space: pre;
        }

        /* Data Format Section */
        .data-format {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          margin-top: 3rem;
          backdrop-filter: blur(20px);
        }

        .format-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .format-table {
          width: 100%;
          margin-top: 1.5rem;
          border-collapse: collapse;
        }

        .format-table th,
        .format-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--glass-border);
        }

        .format-table th {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.03);
        }

        .format-table td {
          color: rgba(255, 255, 255, 0.8);
        }

        .format-table code {
          background: rgba(139, 92, 246, 0.2);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        /* CTA Section */
        .cta-section {
          text-align: center;
          margin-top: 4rem;
          padding: 4rem 2rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          backdrop-filter: blur(20px);
        }

        .cta-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .page-title {
            font-size: 2.5rem;
          }

          .integration-grid {
            grid-template-columns: 1fr;
          }

          .code-block {
            padding: 1rem;
          }

          .format-table {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </>
  )
}