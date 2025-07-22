'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function PrivacyContent() {
  const { t: tCommon, ready: readyCommon } = useTranslation('common')
  const { t, ready } = useTranslation('privacy')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready || !readyCommon) {
    return null
  }

  const providedItems = t('information.provided.items', { returnObjects: true }) as string[]
  const automaticItems = t('information.automatic.items', { returnObjects: true }) as string[]
  const analyticsItems = t('information.analytics.items', { returnObjects: true }) as string[]
  const usageItems = t('usage.items', { returnObjects: true }) as string[]
  const sharingItems = t('sharing.items', { returnObjects: true }) as any[]
  const securityItems = t('security.items', { returnObjects: true }) as string[]
  const gdprItems = t('rights.gdpr.items', { returnObjects: true }) as any[]
  const ccpaItems = t('rights.ccpa.items', { returnObjects: true }) as string[]
  const cookieItems = t('cookies.items', { returnObjects: true }) as string[]
  const internationalItems = t('international.items', { returnObjects: true }) as string[]
  const tableHeaders = t('retention.table.headers', { returnObjects: true }) as string[]
  const tableRows = t('retention.table.rows', { returnObjects: true }) as string[][]

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
      <div className="content-container">
        <h1 className="content-title">{t('header.title')}</h1>
        <p className="content-date">{t('header.effectiveDate')}</p>
        <p className="content-date">{t('header.lastUpdated')}</p>

        {/* Introduction */}
        <div className="content-section">
          <h2 className="section-title">{t('introduction.title')}</h2>
          <p className="content-text">{t('introduction.text')}</p>
          <p className="content-text">{t('introduction.compliance')}</p>
        </div>

        {/* Information We Collect */}
        <div className="content-section">
          <h2 className="section-title">{t('information.title')}</h2>
          
          <h3 className="section-subtitle">{t('information.provided.title')}</h3>
          <ul className="content-list">
            {providedItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="section-subtitle">{t('information.automatic.title')}</h3>
          <ul className="content-list">
            {automaticItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3 className="section-subtitle">{t('information.analytics.title')}</h3>
          <p className="content-text">{t('information.analytics.description')}</p>
          <ul className="content-list">
            {analyticsItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="content-text">
            <strong>{t('information.analytics.important')}</strong>
          </p>
        </div>

        {/* How We Use Your Information */}
        <div className="content-section">
          <h2 className="section-title">{t('usage.title')}</h2>
          <p className="content-text">{t('usage.description')}</p>
          <ul className="content-list">
            {usageItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Information Sharing */}
        <div className="content-section">
          <h2 className="section-title">{t('sharing.title')}</h2>
          <p className="content-text">{t('sharing.description')}</p>
          <ul className="content-list">
            {sharingItems.map((item, index) => (
              <li key={index}>
                <strong>{item.title}</strong> {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Data Security */}
        <div className="content-section">
          <h2 className="section-title">{t('security.title')}</h2>
          <p className="content-text">{t('security.description')}</p>
          <ul className="content-list">
            {securityItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Data Retention */}
        <div className="content-section">
          <h2 className="section-title">{t('retention.title')}</h2>
          <p className="content-text">{t('retention.description')}</p>
          <table className="data-table">
            <thead>
              <tr>
                {tableHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Your Rights */}
        <div className="content-section">
          <h2 className="section-title">{t('rights.title')}</h2>
          <p className="content-text">{t('rights.description')}</p>
          
          <h3 className="section-subtitle">{t('rights.gdpr.title')}</h3>
          <ul className="content-list">
            {gdprItems.map((item, index) => (
              <li key={index}>
                <strong>{item.title}</strong> {item.text}
              </li>
            ))}
          </ul>

          <h3 className="section-subtitle">{t('rights.ccpa.title')}</h3>
          <ul className="content-list">
            {ccpaItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Cookies and Tracking */}
        <div className="content-section">
          <h2 className="section-title">{t('cookies.title')}</h2>
          <p className="content-text">{t('cookies.description')}</p>
          <ul className="content-list">
            {cookieItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <p className="content-text">{t('cookies.control')}</p>
        </div>

        {/* International Data Transfers */}
        <div className="content-section">
          <h2 className="section-title">{t('international.title')}</h2>
          <p className="content-text">{t('international.description')}</p>
          <ul className="content-list">
            {internationalItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Contact Information */}
        <div className="content-section contact-section">
          <h2 className="section-title">{t('contact.title')}</h2>
          <p className="content-text">{t('contact.description')}</p>
          <p className="content-text">
            Email: <a href={`mailto:${t('contact.email')}`} className="contact-link">{t('contact.email')}</a><br />
            Phone: {t('contact.phone')}<br />
            {t('contact.address.company')}<br />
            {t('contact.address.attn')}<br />
            {t('contact.address.street')}<br />
            {t('contact.address.city')}<br />
            {t('contact.address.country')}
          </p>
          <p className="content-text">
            <strong>{t('contact.euRep.title')}</strong><br />
            {t('contact.euRep.company')}<br />
            {t('contact.euRep.street')}<br />
            {t('contact.euRep.city')}<br />
            Email: <a href={`mailto:${t('contact.euRep.email')}`} className="contact-link">{t('contact.euRep.email')}</a>
          </p>
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
          </Link>
        </p>
      </footer>

      <style>{`
        :root {
          /* Gradient System */
          --gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%);
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
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--darker);
          color: var(--white);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
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
          position: sticky;
          top: 0;
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

        /* Content Container */
        .content-container {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 4rem auto;
          padding: 0 2rem;
        }

        .content-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .content-date {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        /* Content Sections */
        .content-section {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--white);
        }

        .section-subtitle {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: var(--white);
        }

        .content-text {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1rem;
          line-height: 1.8;
        }

        .content-list {
          margin-left: 2rem;
          margin-bottom: 1rem;
        }

        .content-list li {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
          line-height: 1.8;
        }

        /* Data Table */
        .data-table {
          width: 100%;
          margin-top: 1rem;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--glass-border);
        }

        .data-table th {
          font-weight: 600;
          color: var(--white);
          background: rgba(255, 255, 255, 0.05);
        }

        .data-table td {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Contact Section */
        .contact-section {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .contact-link {
          color: var(--purple);
          text-decoration: none;
          transition: opacity 0.3s ease;
        }

        .contact-link:hover {
          opacity: 0.8;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .content-title {
            font-size: 2rem;
          }

          .content-container {
            margin: 2rem auto;
          }

          .content-section {
            padding: 1.5rem;
          }

          .section-title {
            font-size: 1.5rem;
          }

          .data-table {
            font-size: 0.875rem;
          }

          .data-table th,
          .data-table td {
            padding: 0.75rem 0.5rem;
          }
        }
      `}</style>
    </>
  )
}