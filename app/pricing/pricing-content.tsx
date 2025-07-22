'use client'

import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'
import { useEffect, useState } from 'react'

export default function PricingContent() {
  const { t, ready } = useTranslation('pricing')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing fallback content during SSR
  if (!mounted || !ready) {
    return null
  }
  
  return (
    <>
      <style>{`
        :root {
          /* Gradient System */
          --gradient-primary: linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%);
          --gradient-purple: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
          --gradient-blue: linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%);
          --gradient-green: linear-gradient(135deg, #10B981 0%, #0EA5E9 100%);
          --gradient-dark: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          
          /* Colors */
          --purple: #8B5CF6;
          --blue: #0EA5E9;
          --green: #10B981;
          --pink: #EC4899;
          --dark: #0F172A;
          --darker: #020617;
          --light: #F8FAFC;
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
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
        }

        /* Background */
        .bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(at 40% 20%, hsla(280,100%,74%,0.1) 0px, transparent 50%),
                      radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%);
          z-index: 0;
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
          gap: 2.5rem;
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

        /* Main Content */
        .pricing-container {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 8rem 2rem 4rem;
        }

        /* Header */
        .pricing-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .pricing-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pricing-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 0 auto;
        }

        /* Pricing Cards */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .pricing-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .pricing-card.featured {
          border-color: var(--purple);
          transform: scale(1.05);
        }

        .pricing-card.featured::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-primary);
        }

        .pricing-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
        }

        .pricing-card.featured:hover {
          transform: scale(1.05) translateY(-5px);
        }

        .plan-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--gradient-primary);
          color: var(--white);
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 2rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .plan-name {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .plan-description {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        .plan-price {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .plan-price .currency {
          font-size: 1.5rem;
          vertical-align: super;
        }

        .plan-price .period {
          font-size: 1rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.6);
        }

        .plan-subtext {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
          margin-bottom: 2rem;
        }

        .features-list {
          list-style: none;
          margin-bottom: 2rem;
        }

        .feature-item {
          display: flex;
          align-items: start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .feature-icon {
          width: 20px;
          height: 20px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .feature-icon svg {
          width: 12px;
          height: 12px;
        }

        .feature-text {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
        }

        .plan-cta {
          display: block;
          width: 100%;
          padding: 1rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--white);
          font-weight: 600;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          text-decoration: none;
          position: relative;
          z-index: 10;
        }
        
        a.plan-cta {
          color: var(--white) !important;
          text-decoration: none !important;
        }

        .plan-cta:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .pricing-card.featured .plan-cta {
          background: var(--gradient-primary);
          border: none;
        }

        .pricing-card.featured .plan-cta:hover {
          box-shadow: 0 10px 20px -10px rgba(139, 92, 246, 0.5);
        }

        /* Features Comparison */
        .comparison-section {
          margin-top: 6rem;
          text-align: center;
        }

        .comparison-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 3rem;
        }

        .comparison-table {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }

        .comparison-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .comparison-table th,
        .comparison-table td {
          padding: 1.25rem;
          text-align: left;
          border-bottom: 1px solid var(--glass-border);
        }

        .comparison-table th {
          background: rgba(255, 255, 255, 0.03);
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .comparison-table td {
          color: rgba(255, 255, 255, 0.8);
        }

        .comparison-table tr:last-child td {
          border-bottom: none;
        }

        .check-icon {
          color: var(--green);
        }

        /* Footer CTA */
        .cta-section {
          text-align: center;
          margin-top: 6rem;
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

        /* Footer */
        .footer {
          text-align: center;
          padding: 3rem 2rem;
          background: rgba(2, 6, 23, 0.8);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4rem;
        }

        .footer a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer a:hover {
          color: var(--white);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card.featured {
            transform: none;
          }

          .comparison-table {
            overflow-x: auto;
          }

          .comparison-table table {
            min-width: 600px;
          }
        }
      `}</style>

      <div className="bg-gradient"></div>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link href="/" className="logo">blipee OS</Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">{t('common:nav.home')}</Link>
            <Link href="/integrations" className="nav-link">{t('common:nav.integrations')}</Link>
            <Link href="/pricing" className="nav-link">{t('common:nav.pricing')}</Link>
            <Link href="/docs" className="nav-link">{t('common:nav.docs')}</Link>
            <Link href="/auth/signin" className="nav-link">{t('common:nav.signIn')}</Link>
            <Link href="/auth/signup" className="btn btn-primary">{t('common:nav.startFreeTrial')}</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pricing-container">
        {/* Header */}
        <div className="pricing-header">
          <h1 className="pricing-title">
            {t('header.title')}
            <span className="gradient-text"> {t('header.titleHighlight')}</span>
          </h1>
          <p className="pricing-subtitle">
            {t('header.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid">
          {/* Essential Plan */}
          <div className="pricing-card">
            <h3 className="plan-name">{t('plans.essential.name')}</h3>
            <p className="plan-description">{t('plans.essential.description')}</p>
            <div className="plan-price">
              <span className="currency">{t('plans.essential.price').charAt(0)}</span>{t('plans.essential.price').slice(1)}
              <span className="period">{t('plans.essential.period')}</span>
            </div>
            <p className="plan-subtext">{t('plans.essential.subtext')}</p>
            
            <ul className="features-list">
              {(t('plans.essential.features', { returnObjects: true }) as string[]).map((feature, index) => (
                <li key={index} className="feature-item">
                  <div className="feature-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="feature-text">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="plan-cta">{t('plans.essential.cta')}</Link>
          </div>

          {/* Professional Plan */}
          <div className="pricing-card featured">
            <span className="plan-badge">{t('plans.professional.badge')}</span>
            <h3 className="plan-name">{t('plans.professional.name')}</h3>
            <p className="plan-description">{t('plans.professional.description')}</p>
            <div className="plan-price">
              <span className="currency">{t('plans.professional.price').charAt(0)}</span>{t('plans.professional.price').slice(1)}
              <span className="period">{t('plans.professional.period')}</span>
            </div>
            <p className="plan-subtext">{t('plans.professional.subtext')}</p>
            
            <ul className="features-list">
              {(t('plans.professional.features', { returnObjects: true }) as string[]).map((feature, index) => (
                <li key={index} className="feature-item">
                  <div className="feature-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="feature-text">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="plan-cta">{t('plans.professional.cta')}</Link>
          </div>

          {/* Intelligence Plan */}
          <div className="pricing-card">
            <h3 className="plan-name">{t('plans.intelligence.name')}</h3>
            <p className="plan-description">{t('plans.intelligence.description')}</p>
            <div className="plan-price">
              <span className="currency">{t('plans.intelligence.price').charAt(0)}</span>{t('plans.intelligence.price').slice(1)}
              <span className="period">{t('plans.intelligence.period')}</span>
            </div>
            <p className="plan-subtext">{t('plans.intelligence.subtext')}</p>
            
            <ul className="features-list">
              {(t('plans.intelligence.features', { returnObjects: true }) as string[]).map((feature, index) => (
                <li key={index} className="feature-item">
                  <div className="feature-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="feature-text">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/contact?type=sales" className="plan-cta">{t('plans.intelligence.cta')}</Link>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="comparison-section">
          <h2 className="comparison-title">
            {t('comparison.title')} <span className="gradient-text">{t('comparison.titleHighlight')}</span>
          </h2>
          
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th style={{width: '40%'}}>{t('comparison.headers.feature')}</th>
                  <th>{t('comparison.headers.essential')}</th>
                  <th>{t('comparison.headers.professional')}</th>
                  <th>{t('comparison.headers.intelligence')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{t('comparison.sections.coreAnalytics')}</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.peopleCountingCaptureRate')}</td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.realTimeDashboards')}</td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.historicalTrends')}</td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td><strong>{t('comparison.sections.advancedAnalytics')}</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.zoneHeatmaps')}</td>
                  <td>-</td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.dwellTimeAnalysis')}</td>
                  <td>-</td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.customerJourneyMapping')}</td>
                  <td>-</td>
                  <td>-</td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td><strong>{t('comparison.sections.aiPredictions')}</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.trafficPredictions')}</td>
                  <td>-</td>
                  <td>{t('comparison.values.basic')}</td>
                  <td>{t('comparison.values.advancedAi')}</td>
                </tr>
                <tr>
                  <td>{t('comparison.features.anomalyDetection')}</td>
                  <td>-</td>
                  <td>{t('comparison.values.basic')}</td>
                  <td>{t('comparison.values.advancedAi')}</td>
                </tr>
                <tr>
                  <td>{t('comparison.features.customAiModels')}</td>
                  <td>-</td>
                  <td>-</td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td><strong>{t('comparison.sections.integrations')}</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.emailSlackNotifications')}</td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.posIntegration')}</td>
                  <td>-</td>
                  <td>-</td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.crmInventoryIntegration')}</td>
                  <td>-</td>
                  <td>-</td>
                  <td><span className="check-icon">✓</span></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.apiAccess')}</td>
                  <td>-</td>
                  <td>{t('comparison.values.readOnly')}</td>
                  <td>{t('comparison.values.fullAccess')}</td>
                </tr>
                <tr>
                  <td><strong>{t('comparison.sections.support')}</strong></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>{t('comparison.features.supportLevel')}</td>
                  <td>{t('comparison.values.standard')}</td>
                  <td>{t('comparison.values.priority')}</td>
                  <td>{t('comparison.values.dedicatedManager')}</td>
                </tr>
                <tr>
                  <td>{t('comparison.features.onboarding')}</td>
                  <td>{t('comparison.values.selfService')}</td>
                  <td>{t('comparison.values.guidedSetup')}</td>
                  <td>{t('comparison.values.whiteGlove')}</td>
                </tr>
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
      <footer className="footer">
        <p>
          &copy; 2024 blipee OS. {t('common:footer.copyright')} |{' '}
          <Link href="/terms">{t('common:footer.links.terms')}</Link> |{' '}
          <Link href="/privacy">{t('common:footer.links.privacy')}</Link> |{' '}
          {t('common:footer.certifications')}
        </p>
      </footer>
    </>
  )
}