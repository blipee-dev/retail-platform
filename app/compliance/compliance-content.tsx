'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function ComplianceContent() {
  const { t: tCommon, ready: readyCommon } = useTranslation('common')
  const { t, ready } = useTranslation('compliance')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready || !readyCommon) {
    return null
  }

  const overviewCards = t('overview.cards', { returnObjects: true }) as any[]
  const frameworks = t('frameworks.items', { returnObjects: true }) as any[]
  const reports = t('reports.items', { returnObjects: true }) as any[]
  const dataHandlingPrinciples = t('dataHandling.principles', { returnObjects: true }) as any[]

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

        {/* Compliance Overview */}
        <div className="compliance-overview">
          {overviewCards.map((card, index) => (
            <div key={index} className="overview-card">
              <div className="overview-icon">{card.icon}</div>
              <h3 className="overview-title">{card.title}</h3>
              <p className="overview-description">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Compliance Frameworks */}
        <div className="frameworks">
          <h2 className="section-title">{t('frameworks.title')}</h2>
          <div className="frameworks-grid">
            {frameworks.map((framework, index) => (
              <div key={index} className="framework-card">
                <div className="framework-header">
                  <div className="framework-info">
                    <h3>{framework.name}</h3>
                    <p className="framework-description">{framework.description}</p>
                  </div>
                  <div className={`framework-status ${framework.status.toLowerCase().replace(' ', '-')}`}>
                    <div className={`status-dot ${framework.status.toLowerCase().replace(' ', '-')}`}></div>
                    {framework.status}
                  </div>
                </div>
                <div className="framework-details">
                  {framework.details.map((detail: any, detailIndex: number) => (
                    <div key={detailIndex} className="detail-section">
                      <h4>{detail.title}</h4>
                      <ul className="detail-list">
                        {detail.items.map((item: string, itemIndex: number) => (
                          <li key={itemIndex}>
                            <span className="check-icon">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Reports */}
        <div className="reports">
          <h2 className="section-title">{t('reports.title')}</h2>
          <div className="reports-grid">
            {reports.map((report, index) => (
              <div key={index} className="report-card">
                <div className="report-header">
                  <div className="report-icon">{report.icon}</div>
                  <div>
                    <h3 className="report-title">{report.title}</h3>
                    <p className="report-date">{report.date}</p>
                  </div>
                </div>
                <p className="report-description">{report.description}</p>
                <div className="report-action">
                  {report.action}
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Handling Principles */}
        <div className="data-handling">
          <h2 className="data-title">{t('dataHandling.title')}</h2>
          <div className="data-grid">
            {dataHandlingPrinciples.map((principle, index) => (
              <div key={index} className="data-principle">
                <div className="principle-icon">{principle.icon}</div>
                <h3 className="principle-title">{principle.title}</h3>
                <p className="principle-description">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Compliance Team */}
        <div className="contact-compliance">
          <h2 className="contact-title">{t('contact.title')}</h2>
          <p className="contact-subtitle">{t('contact.subtitle')}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn btn-primary">{t('contact.primaryButton')}</Link>
            <a href="#" className="btn btn-secondary">{t('contact.secondaryButton')}</a>
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

      <style jsx>{`
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

        /* Compliance Overview */
        .compliance-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        .overview-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(20px);
          text-align: center;
          transition: all 0.3s ease;
        }

        .overview-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .overview-icon {
          width: 80px;
          height: 80px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 2rem;
        }

        .overview-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .overview-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        /* Frameworks */
        .frameworks {
          margin-bottom: 4rem;
          animation: fadeInUp 1s ease 0.4s both;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 3rem;
        }

        .frameworks-grid {
          display: grid;
          gap: 2rem;
        }

        .framework-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }

        .framework-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .framework-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .framework-info h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .framework-description {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        .framework-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .framework-status.certified,
        .framework-status.compliant {
          background: rgba(16, 185, 129, 0.2);
          color: var(--green);
        }

        .framework-status.in-progress {
          background: rgba(245, 158, 11, 0.2);
          color: #F59E0B;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.certified,
        .status-dot.compliant {
          background: var(--green);
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
        }

        .status-dot.in-progress {
          background: #F59E0B;
          box-shadow: 0 0 5px rgba(245, 158, 11, 0.5);
        }

        .framework-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
        }

        .detail-section h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--purple);
        }

        .detail-list {
          list-style: none;
        }

        .detail-list li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
        }

        .check-icon {
          width: 16px;
          height: 16px;
          background: var(--green);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 10px;
        }

        /* Reports */
        .reports {
          margin-bottom: 4rem;
          animation: fadeInUp 1.2s ease 0.6s both;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .report-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .report-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .report-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .report-icon {
          width: 50px;
          height: 50px;
          background: var(--gradient-primary);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .report-title {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .report-date {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
        }

        .report-description {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .report-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--purple);
          font-weight: 500;
          font-size: 0.95rem;
        }

        /* Data Handling */
        .data-handling {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 3rem;
          backdrop-filter: blur(20px);
          margin-bottom: 4rem;
          animation: fadeInUp 1.4s ease 0.8s both;
        }

        .data-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-align: center;
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .data-principle {
          text-align: center;
        }

        .principle-icon {
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

        .principle-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .principle-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        /* Contact */
        .contact-compliance {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 3rem;
          backdrop-filter: blur(20px);
          text-align: center;
          animation: fadeInUp 1.6s ease 1s both;
        }

        .contact-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .contact-subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
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

          .compliance-overview {
            grid-template-columns: 1fr;
          }

          .framework-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .framework-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}