'use client'

import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'
import { useEffect, useState } from 'react'

export default function AboutContent() {
  const { t, ready } = useTranslation('about')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing nothing during SSR
  if (!mounted || !ready) {
    return null
  }
  
  return (
    <>
      <style jsx global>{`
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

        /* Main Container */
        .about-container {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 6rem 2rem 4rem;
        }

        /* Header */
        .about-header {
          text-align: center;
          margin-bottom: 6rem;
          animation: fadeInUp 0.8s ease both;
        }

        .about-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 800;
          margin-bottom: 1.5rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .about-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 0 auto;
        }

        /* Mission Section */
        .mission {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-bottom: 6rem;
          animation: fadeInUp 1s ease 0.2s both;
        }

        .mission-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
        }

        .mission-content p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
        }

        .mission-visual {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 3rem;
          backdrop-filter: blur(20px);
          text-align: center;
        }

        .mission-icon {
          width: 100px;
          height: 100px;
          background: var(--gradient-primary);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          font-size: 3rem;
        }

        /* Values Section */
        .values {
          margin-bottom: 6rem;
          animation: fadeInUp 1s ease 0.4s both;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 3rem;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .value-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .value-card::before {
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

        .value-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .value-card:hover::before {
          transform: translateX(0);
        }

        .value-icon {
          width: 60px;
          height: 60px;
          background: var(--gradient-primary);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .value-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .value-description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        /* Team Section */
        .team {
          margin-bottom: 6rem;
          animation: fadeInUp 1.2s ease 0.6s both;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .team-member {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          text-align: center;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }

        .team-member:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .team-avatar {
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

        .team-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .team-role {
          color: var(--purple);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .team-bio {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Stats Section */
        .stats {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 4rem 2rem;
          margin-bottom: 6rem;
          backdrop-filter: blur(20px);
          animation: fadeInUp 1.4s ease 0.8s both;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          text-align: center;
        }

        .stat-number {
          font-size: 3rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        }

        /* CTA Section */
        .cta {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          backdrop-filter: blur(20px);
          animation: fadeInUp 1.6s ease 1s both;
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .cta-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.125rem;
          margin-bottom: 2.5rem;
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

          .mission {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .values-grid,
          .team-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="bg-container">
        <div className="bg-gradient-mesh"></div>
      </div>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link href="/" className="logo">blipee OS</Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">{t('common:nav.home')}</Link>
            <Link href="/about" className="nav-link">{t('common:footer.links.aboutUs')}</Link>
            <Link href="/pricing" className="nav-link">{t('common:nav.pricing')}</Link>
            <Link href="/docs" className="nav-link">{t('common:nav.docs')}</Link>
            <Link href="/auth/signin" className="nav-link">{t('common:nav.signIn')}</Link>
            <Link href="/auth/signup" className="btn btn-primary">{t('common:nav.startFreeTrial')}</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="about-container">
        {/* Header */}
        <div className="about-header">
          <h1 className="about-title">{t('header.title')}</h1>
          <p className="about-subtitle">{t('header.subtitle')}</p>
        </div>

        {/* Mission Section */}
        <div className="mission">
          <div className="mission-content">
            <h2>{t('mission.title')}</h2>
            <p>{t('mission.content.p1')}</p>
            <p>{t('mission.content.p2')}</p>
            <p>{t('mission.content.p3')}</p>
          </div>
          <div className="mission-visual">
            <div className="mission-icon">🎯</div>
            <h3>{t('mission.visual.title')}</h3>
            <p>{t('mission.visual.subtitle')}</p>
          </div>
        </div>

        {/* Values Section */}
        <div className="values">
          <h2 className="section-title">{t('values.title')}</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🚀</div>
              <h3 className="value-title">{t('values.innovation.title')}</h3>
              <p className="value-description">{t('values.innovation.description')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3 className="value-title">{t('values.customerSuccess.title')}</h3>
              <p className="value-description">{t('values.customerSuccess.description')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔒</div>
              <h3 className="value-title">{t('values.privacy.title')}</h3>
              <p className="value-description">{t('values.privacy.description')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⚡</div>
              <h3 className="value-title">{t('values.simplicity.title')}</h3>
              <p className="value-description">{t('values.simplicity.description')}</p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="team">
          <h2 className="section-title">{t('team.title')}</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="team-avatar">👨‍💼</div>
              <h3 className="team-name">{t('team.members.ceo.name')}</h3>
              <p className="team-role">{t('team.members.ceo.role')}</p>
              <p className="team-bio">{t('team.members.ceo.bio')}</p>
            </div>
            <div className="team-member">
              <div className="team-avatar">👩‍💻</div>
              <h3 className="team-name">{t('team.members.cto.name')}</h3>
              <p className="team-role">{t('team.members.cto.role')}</p>
              <p className="team-bio">{t('team.members.cto.bio')}</p>
            </div>
            <div className="team-member">
              <div className="team-avatar">👨‍🔬</div>
              <h3 className="team-name">{t('team.members.aiHead.name')}</h3>
              <p className="team-role">{t('team.members.aiHead.role')}</p>
              <p className="team-bio">{t('team.members.aiHead.bio')}</p>
            </div>
            <div className="team-member">
              <div className="team-avatar">👩‍🎨</div>
              <h3 className="team-name">{t('team.members.designHead.name')}</h3>
              <p className="team-role">{t('team.members.designHead.role')}</p>
              <p className="team-bio">{t('team.members.designHead.bio')}</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{t('stats.partners.value')}</div>
              <div className="stat-label">{t('stats.partners.label')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{t('stats.events.value')}</div>
              <div className="stat-label">{t('stats.events.label')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{t('stats.uptime.value')}</div>
              <div className="stat-label">{t('stats.uptime.label')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{t('stats.support.value')}</div>
              <div className="stat-label">{t('stats.support.label')}</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta">
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