'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function SecurityContent() {
  const { t: tCommon, ready: readyCommon } = useTranslation('common')
  const { t, ready } = useTranslation('security')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready || !readyCommon) {
    return null
  }

  const certifications = t('certifications.items', { returnObjects: true }) as any[]
  const measures = t('measures.items', { returnObjects: true }) as any[]
  const contactMethods = t('contact.methods', { returnObjects: true }) as any[]

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
            <Link href="/integrations" className="nav-link">{tCommon('nav.integrations')}</Link>
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

        {/* Security Overview */}
        <div className="security-overview">
          <div className="overview-content">
            <h2>{t('overview.title')}</h2>
            <p>{t('overview.paragraph1')}</p>
            <p>{t('overview.paragraph2')}</p>
          </div>
          <div className="overview-stats">
            <div className="security-badge">🛡️</div>
            <div className="badge-text">{t('overview.badge.title')}</div>
            <div className="badge-description">{t('overview.badge.description')}</div>
          </div>
        </div>

        {/* Certifications */}
        <div className="certifications">
          <h2 className="section-title">{t('certifications.title')}</h2>
          <div className="certifications-grid">
            {certifications.map((cert, index) => (
              <div key={index} className="certification-card">
                <div className="certification-icon">{cert.icon}</div>
                <h3 className="certification-title">{cert.title}</h3>
                <p className="certification-description">{cert.description}</p>
                <div className="certification-status">
                  <div className="status-dot"></div>
                  {cert.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Measures */}
        <div className="security-measures">
          <h2 className="section-title">{t('measures.title')}</h2>
          <div className="measures-grid">
            {measures.map((measure, index) => (
              <div key={index} className="measure-card">
                <div className="measure-header">
                  <div className="measure-icon">{measure.icon}</div>
                  <h3 className="measure-title">{measure.title}</h3>
                </div>
                <p className="measure-description">{measure.description}</p>
                <ul className="measure-features">
                  {measure.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex}>
                      <div className="feature-check">✓</div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Security Reporting */}
        <div className="reporting">
          <div className="reporting-content">
            <h2 className="reporting-title">{t('reporting.title')}</h2>
            <p className="reporting-description">{t('reporting.description')}</p>
            <div className="reporting-actions">
              <a href="#" className="btn btn-primary">{t('reporting.buttons.documentation')}</a>
              <a href="#" className="btn btn-secondary">{t('reporting.buttons.reports')}</a>
              <a href="#" className="btn btn-secondary">{t('reporting.buttons.status')}</a>
            </div>
          </div>
        </div>

        {/* Contact Security Team */}
        <div className="contact-security">
          <h2 className="contact-title">{t('contact.title')}</h2>
          <p className="contact-subtitle">{t('contact.subtitle')}</p>
          <div className="contact-methods">
            {contactMethods.map((method, index) => (
              <div key={index} className="contact-method">
                <div className="contact-method-icon">{method.icon}</div>
                <h3 className="contact-method-title">{method.title}</h3>
                <p className="contact-method-text">{method.text}</p>
              </div>
            ))}
          </div>
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
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
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

        /* Main Container */
        .container {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 4rem 2rem;
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
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Security Overview */
        .security-overview {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-bottom: 6rem;
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        .overview-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
        }

        .overview-content p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        .overview-stats {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 3rem;
          backdrop-filter: blur(20px);
          text-align: center;
        }

        .security-badge {
          width: 120px;
          height: 120px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          font-size: 3rem;
        }

        .badge-text {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .badge-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        /* Certifications */
        .certifications {
          margin-bottom: 6rem;
          animation: fadeInUp 1s ease 0.4s both;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 3rem;
        }

        .certifications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .certification-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(20px);
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .certification-card::before {
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

        .certification-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .certification-card:hover::before {
          transform: translateX(0);
        }

        .certification-icon {
          width: 80px;
          height: 80px;
          background: var(--gradient-primary);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 2rem;
        }

        .certification-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .certification-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .certification-status {
          color: var(--green);
          font-weight: 500;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: var(--green);
          border-radius: 50%;
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
        }

        /* Security Measures */
        .security-measures {
          margin-bottom: 6rem;
          animation: fadeInUp 1.2s ease 0.6s both;
        }

        .measures-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .measure-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }

        .measure-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .measure-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .measure-icon {
          width: 50px;
          height: 50px;
          background: var(--gradient-primary);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .measure-title {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .measure-description {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .measure-features {
          list-style: none;
        }

        .measure-features li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        .feature-check {
          width: 16px;
          height: 16px;
          background: var(--green);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Reporting */
        .reporting {
          margin-bottom: 6rem;
          animation: fadeInUp 1.4s ease 0.8s both;
        }

        .reporting-content {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 3rem;
          backdrop-filter: blur(20px);
          text-align: center;
        }

        .reporting-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .reporting-description {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .reporting-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: var(--white);
          border: 1px solid var(--glass-border);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        /* Contact Security */
        .contact-security {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 3rem;
          backdrop-filter: blur(20px);
          text-align: center;
          animation: fadeInUp 1.6s ease 1s both;
        }

        .contact-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .contact-subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .contact-methods {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .contact-method {
          text-align: center;
        }

        .contact-method-icon {
          width: 60px;
          height: 60px;
          background: var(--gradient-primary);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          font-size: 1.5rem;
        }

        .contact-method-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .contact-method-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
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

          .security-overview {
            grid-template-columns: 1fr;
          }

          .certifications-grid,
          .measures-grid {
            grid-template-columns: 1fr;
          }

          .reporting-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </>
  )
}