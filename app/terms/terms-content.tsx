'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function TermsContent() {
  const { t: tCommon, ready: readyCommon } = useTranslation('common')
  const { t, ready } = useTranslation('terms')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready || !readyCommon) {
    return null
  }

  const definitions = t('sections.definitions.items', { returnObjects: true }) as any[]
  const useItems = t('sections.use.items', { returnObjects: true }) as string[]
  const dataItems = t('sections.data.items', { returnObjects: true }) as string[]
  const terminationItems = t('sections.termination.items', { returnObjects: true }) as string[]

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

        {/* Agreement to Terms */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.agreement.title')}</h2>
          <p className="content-text">{t('sections.agreement.text')}</p>
        </div>

        {/* Definitions */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.definitions.title')}</h2>
          <dl className="definition-list">
            {definitions.map((def, index) => (
              <div key={index} className="definition-item">
                <dt className="definition-term">{def.term}</dt>
                <dd className="definition-description">{def.definition}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Acceptable Use */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.use.title')}</h2>
          <p className="content-text">{t('sections.use.description')}</p>
          <ul className="content-list">
            {useItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Account Terms */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.account.title')}</h2>
          
          <h3 className="section-subtitle">{t('sections.account.creation.title')}</h3>
          <p className="content-text">{t('sections.account.creation.text')}</p>

          <h3 className="section-subtitle">{t('sections.account.responsibility.title')}</h3>
          <p className="content-text">{t('sections.account.responsibility.text')}</p>

          <h3 className="section-subtitle">{t('sections.account.requirements.title')}</h3>
          <p className="content-text">{t('sections.account.requirements.text')}</p>
        </div>

        {/* Payment Terms */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.payment.title')}</h2>
          
          <h3 className="section-subtitle">{t('sections.payment.pricing.title')}</h3>
          <p className="content-text">{t('sections.payment.pricing.text')}</p>

          <h3 className="section-subtitle">{t('sections.payment.billing.title')}</h3>
          <p className="content-text">{t('sections.payment.billing.text')}</p>

          <h3 className="section-subtitle">{t('sections.payment.trial.title')}</h3>
          <p className="content-text">{t('sections.payment.trial.text')}</p>
        </div>

        {/* Data Privacy and Security */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.data.title')}</h2>
          <p className="content-text">{t('sections.data.description')}</p>
          <ul className="content-list">
            {dataItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Intellectual Property */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.intellectual.title')}</h2>
          <p className="content-text">{t('sections.intellectual.ownership')}</p>
          <p className="content-text">{t('sections.intellectual.license')}</p>
        </div>

        {/* Termination */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.termination.title')}</h2>
          <p className="content-text">{t('sections.termination.description')}</p>
          <ul className="content-list">
            {terminationItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Disclaimer of Warranties */}
        <div className="content-section disclaimer-section">
          <h2 className="section-title">{t('sections.disclaimer.title')}</h2>
          <p className="content-text disclaimer-text">{t('sections.disclaimer.text')}</p>
        </div>

        {/* Limitation of Liability */}
        <div className="content-section disclaimer-section">
          <h2 className="section-title">{t('sections.limitation.title')}</h2>
          <p className="content-text disclaimer-text">{t('sections.limitation.text')}</p>
        </div>

        {/* General Terms */}
        <div className="content-section">
          <h2 className="section-title">{t('sections.general.title')}</h2>
          
          <h3 className="section-subtitle">{t('sections.general.governing.title')}</h3>
          <p className="content-text">{t('sections.general.governing.text')}</p>

          <h3 className="section-subtitle">{t('sections.general.changes.title')}</h3>
          <p className="content-text">{t('sections.general.changes.text')}</p>

          <h3 className="section-subtitle">{t('sections.general.entire.title')}</h3>
          <p className="content-text">{t('sections.general.entire.text')}</p>
        </div>

        {/* Contact Information */}
        <div className="content-section contact-section">
          <h2 className="section-title">{t('contact.title')}</h2>
          <p className="content-text">{t('contact.description')}</p>
          <p className="content-text">
            Email: <a href={`mailto:${t('contact.email')}`} className="contact-link">{t('contact.email')}</a><br />
            {t('contact.address.company')}<br />
            {t('contact.address.street')}<br />
            {t('contact.address.city')}<br />
            {t('contact.address.country')}
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

      <style jsx>{`
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

        /* Definition List */
        .definition-list {
          margin-bottom: 1rem;
        }

        .definition-item {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 0.5rem;
          border-left: 3px solid var(--purple);
        }

        .definition-term {
          font-weight: 600;
          color: var(--white);
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .definition-description {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        /* Disclaimer Sections */
        .disclaimer-section {
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid rgba(255, 165, 0, 0.2);
        }

        .disclaimer-text {
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 165, 0, 0.1);
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          border-left: 4px solid orange;
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

          .definition-item {
            padding: 0.75rem;
          }

          .disclaimer-text {
            font-size: 0.8rem;
            padding: 0.75rem;
          }
        }
      `}</style>
    </>
  )
}