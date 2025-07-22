'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/app/i18n/client'

export default function LandingPageContent() {
  const { t, ready } = useTranslation('landing')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Smooth scrolling with offset for fixed nav
    const handleSmoothScroll = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement
      const href = target.getAttribute('href')
      if (href?.startsWith('#') && href !== '#') {
        e.preventDefault()
        const element = document.querySelector(href)
        if (element) {
          const navHeight = document.querySelector('.nav')?.clientHeight || 0
          const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - navHeight - 20
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          })
        }
      }
    }

    // Parallax effect on scroll
    const handleParallax = () => {
      const scrolled = window.pageYOffset
      const parallax = document.querySelector('.bg-gradient-mesh') as HTMLElement
      if (parallax) {
        parallax.style.transform = `translate(-50%, -50%) translateY(${scrolled * 0.5}px)`
      }
    }

    // Add event listeners
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll as any)
    })
    window.addEventListener('scroll', handleParallax)

    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ;(entry.target as HTMLElement).style.animationPlayState = 'running'
        }
      })
    })

    document.querySelectorAll('.ai-card').forEach(card => {
      ;(card as HTMLElement).style.animationPlayState = 'paused'
      observer.observe(card)
    })

    // Cleanup
    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleSmoothScroll as any)
      })
      window.removeEventListener('scroll', handleParallax)
      observer.disconnect()
    }
  }, [])

  // Prevent hydration mismatch by showing nothing during SSR
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
          --gradient-dark: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          --gradient-mesh: radial-gradient(at 40% 20%, hsla(280,100%,74%,0.3) 0px, transparent 50%),
                          radial-gradient(at 80% 0%, hsla(189,100%,56%,0.2) 0px, transparent 50%),
                          radial-gradient(at 0% 50%, hsla(355,100%,93%,0.2) 0px, transparent 50%);
          
          /* Colors */
          --purple: #8B5CF6;
          --blue: #0EA5E9;
          --pink: #EC4899;
          --dark: #0F172A;
          --darker: #020617;
          --light: #F8FAFC;
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
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Animated Background */
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
          animation: meshAnimation 20s ease infinite;
        }

        @keyframes meshAnimation {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-20px, -20px) rotate(120deg); }
          66% { transform: translate(20px, -10px) rotate(240deg); }
        }

        .content-wrapper {
          position: relative;
          z-index: 1;
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
          transition: all 0.3s ease;
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
          position: relative;
        }

        .nav-link:hover {
          color: var(--white);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--gradient-primary);
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
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

        .btn-ghost {
          background: transparent;
          color: var(--white);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
        }

        .btn-ghost:hover {
          background: var(--glass-bg);
          border-color: rgba(255, 255, 255, 0.2);
        }

        /* Hero Section */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8rem 2rem 4rem;
          position: relative;
        }

        .hero-content {
          max-width: 1200px;
          text-align: center;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 2rem;
          font-size: 0.875rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
          animation: fadeInUp 0.6s ease;
        }

        .hero-badge .pulse {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .hero-title {
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 2rem;
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 700px;
          margin: 0 auto 3rem;
          line-height: 1.8;
          animation: fadeInUp 1s ease 0.4s both;
        }

        .hero-actions {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeInUp 1.2s ease 0.6s both;
        }

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

        /* AI Features Grid */
        .ai-features {
          position: relative;
          padding-top: 2rem;
          padding-bottom: 6rem;
        }

        .ai-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          padding: 0 2rem;
        }

        .ai-card {
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

        .ai-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-primary);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }

        .ai-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 40px -15px rgba(139, 92, 246, 0.3);
        }

        .ai-card:hover::before {
          transform: translateX(0);
        }

        .ai-icon {
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

        .ai-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .ai-card p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        /* Intelligence Showcase */
        .intelligence {
          padding: 6rem 2rem;
          background: rgba(139, 92, 246, 0.05);
          position: relative;
        }

        .intelligence-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .intelligence-content h2 {
          font-size: 3rem;
          margin-bottom: 2rem;
          font-weight: 800;
        }

        .intelligence-features {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .intelligence-item {
          display: flex;
          align-items: start;
          gap: 1rem;
        }

        .check-icon {
          width: 24px;
          height: 24px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }

        .intelligence-visual {
          position: relative;
          height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .neural-network {
          width: 400px;
          height: 400px;
          position: relative;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .neural-node {
          position: absolute;
          width: 20px;
          height: 20px;
          background: var(--gradient-primary);
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
        }

        .neural-connection {
          position: absolute;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent);
          transform-origin: left center;
          animation: pulse-line 3s ease-in-out infinite;
        }

        @keyframes pulse-line {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* Stats Section */
        .stats {
          padding: 6rem 2rem;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border-top: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
        }

        .stats-grid {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          text-align: center;
        }

        .stat-item h3 {
          font-size: 3rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .stat-item p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        }

        /* CTA Section */
        .cta {
          padding: 8rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          animation: pulse-bg 4s ease-in-out infinite;
        }

        @keyframes pulse-bg {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        .cta-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
        }

        .cta h2 {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          font-weight: 800;
        }

        .cta p {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 3rem;
        }

        /* Footer */
        .footer {
          padding: 3rem 2rem;
          background: rgba(2, 6, 23, 0.8);
          border-top: 1px solid var(--glass-border);
          color: rgba(255, 255, 255, 0.6);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto 2rem;
          text-align: left;
        }

        .footer-section h4 {
          color: var(--white);
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .footer-link:hover {
          color: var(--white);
        }

        .footer-bottom {
          border-top: 1px solid var(--glass-border);
          padding-top: 2rem;
          text-align: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .hero-title {
            font-size: 3rem;
          }

          .intelligence-container {
            grid-template-columns: 1fr;
          }

          .intelligence-visual {
            height: 300px;
          }

          .neural-network {
            width: 250px;
            height: 250px;
          }
        }
      `}</style>

      <div className="bg-container">
        <div className="bg-gradient-mesh"></div>
      </div>

      <div className="content-wrapper">
        {/* Navigation */}
        <nav className="nav">
          <div className="nav-container">
            <Link href="/" className="logo">blipee OS</Link>
            <div className="nav-links">
              <a href="#features" className="nav-link">{t('common:nav.features')}</a>
              <a href="#intelligence" className="nav-link">{t('intelligence.title')}</a>
              <Link href="/integrations" className="nav-link">{t('common:nav.integrations')}</Link>
              <Link href="/pricing" className="nav-link">{t('common:nav.pricing')}</Link>
              <Link href="/docs" className="nav-link">{t('common:nav.docs')}</Link>
              <Link href="/auth/signin" className="btn btn-ghost">{t('common:nav.signIn')}</Link>
              <Link href="/auth/signup" className="btn btn-primary">{t('common:nav.signUp')}</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="pulse"></span>
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className="hero-title">
              {t('hero.title')}
              <span className="gradient-text"> {t('hero.titleHighlight')}</span>
            </h1>
            <p className="hero-subtitle">
              {t('hero.subtitle')} <strong>{t('hero.subtitleBold')}</strong>
            </p>
            <div className="hero-actions">
              <Link href="/auth/signup" className="btn btn-primary">
                <span>{t('hero.ctaPrimary')}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                </svg>
              </Link>
              <a href="#" className="btn btn-ghost">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
                <span>{t('hero.ctaSecondary')}</span>
              </a>
            </div>
          </div>
        </section>

        {/* AI Features Grid */}
        <section className="ai-features" id="features">
          <div className="ai-grid">
            <div className="ai-card">
              <div className="ai-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 9.5 22a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 2.46-2.1 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5Z"/>
                  <path d="m15.7 10.4-.9.4a2 2 0 0 0-1.1 1.7v1.3a2 2 0 0 0 1.1 1.8l.9.4c.2.1.4 0 .4-.2v-5.2c0-.2-.2-.3-.4-.2Z"/>
                  <path d="m8.3 10.4.9.4a2 2 0 0 1 1.1 1.7v1.3a2 2 0 0 1-1.1 1.8l-.9.4c-.2.1-.4 0-.4-.2v-5.2c0-.2.2-.3.4-.2Z"/>
                </svg>
              </div>
              <h3>{t('features.ai.title')}</h3>
              <p>{t('features.ai.description')}</p>
            </div>
            <div className="ai-card">
              <div className="ai-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="m8 2 1.5 1.5M16 2l-1.5 1.5M3.5 8l1.5 1.5M20.5 8l-1.5 1.5M3.5 16l1.5-1.5M20.5 16l-1.5-1.5M8 22l1.5-1.5M16 22l-1.5-1.5"/>
                </svg>
              </div>
              <h3>{t('features.vision.title')}</h3>
              <p>{t('features.vision.description')}</p>
            </div>
            <div className="ai-card">
              <div className="ai-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  <circle cx="12" cy="12" r="1" fill="currentColor"/>
                </svg>
              </div>
              <h3>{t('features.realtime.title')}</h3>
              <p>{t('features.realtime.description')}</p>
            </div>
          </div>
        </section>

        {/* Intelligence Showcase */}
        <section className="intelligence" id="intelligence">
          <div className="intelligence-container">
            <div className="intelligence-content">
              <h2>{t('intelligence.title')} <span className="gradient-text">{t('intelligence.titleHighlight')}</span></h2>
              <p style={{fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2rem'}}>
                {t('intelligence.subtitle')}
              </p>
              <div className="intelligence-features">
                <div className="intelligence-item">
                  <div className="check-icon">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4>{t('intelligence.features.anomaly.title')}</h4>
                    <p style={{color: 'rgba(255,255,255,0.7)'}}>{t('intelligence.features.anomaly.description')}</p>
                  </div>
                </div>
                <div className="intelligence-item">
                  <div className="check-icon">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4>{t('intelligence.features.sentiment.title')}</h4>
                    <p style={{color: 'rgba(255,255,255,0.7)'}}>{t('intelligence.features.sentiment.description')}</p>
                  </div>
                </div>
                <div className="intelligence-item">
                  <div className="check-icon">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4>{t('intelligence.features.optimization.title')}</h4>
                    <p style={{color: 'rgba(255,255,255,0.7)'}}>{t('intelligence.features.optimization.description')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="intelligence-visual">
              <div className="neural-network">
                {/* Neural network visualization */}
                <div className="neural-node" style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}></div>
                <div className="neural-node" style={{top: '20%', left: '30%'}}></div>
                <div className="neural-node" style={{top: '20%', left: '70%'}}></div>
                <div className="neural-node" style={{top: '80%', left: '30%'}}></div>
                <div className="neural-node" style={{top: '80%', left: '70%'}}></div>
                <div className="neural-node" style={{top: '50%', left: '10%'}}></div>
                <div className="neural-node" style={{top: '50%', left: '90%'}}></div>
                
                <div className="neural-connection" style={{width: '100px', top: '50%', left: '50%', transform: 'rotate(45deg)'}}></div>
                <div className="neural-connection" style={{width: '100px', top: '50%', left: '50%', transform: 'rotate(-45deg)'}}></div>
                <div className="neural-connection" style={{width: '100px', top: '50%', left: '50%', transform: 'rotate(135deg)'}}></div>
                <div className="neural-connection" style={{width: '100px', top: '50%', left: '50%', transform: 'rotate(-135deg)'}}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>{t('stats.accuracy.value')}</h3>
              <p>{t('stats.accuracy.label')}</p>
            </div>
            <div className="stat-item">
              <h3>{t('stats.response.value')}</h3>
              <p>{t('stats.response.label')}</p>
            </div>
            <div className="stat-item">
              <h3>{t('stats.predictions.value')}</h3>
              <p>{t('stats.predictions.label')}</p>
            </div>
            <div className="stat-item">
              <h3>{t('stats.roi.value')}</h3>
              <p>{t('stats.roi.label')}</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta">
          <div className="cta-content">
            <h2>{t('cta.title')} <span className="gradient-text">{t('cta.titleHighlight')}</span></h2>
            <p>{t('cta.subtitle')}</p>
            <div className="hero-actions">
              <Link href="/auth/signup" className="btn btn-primary" style={{fontSize: '1.1rem', padding: '1rem 2rem'}}>
                {t('cta.button')}
              </Link>
              <a href="#features" className="btn btn-ghost">
                {t('cta.secondary')}
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>{t('footer.sections.product')}</h4>
              <div className="footer-links">
                <Link href="/" className="footer-link">{t('common:nav.features')}</Link>
                <Link href="/integrations" className="footer-link">{t('common:nav.integrations')}</Link>
                <Link href="/pricing" className="footer-link">{t('common:nav.pricing')}</Link>
                <Link href="/docs" className="footer-link">{t('common:nav.docs')}</Link>
              </div>
            </div>
            <div className="footer-section">
              <h4>{t('footer.sections.company')}</h4>
              <div className="footer-links">
                <Link href="/about" className="footer-link">{t('footer.links.aboutUs')}</Link>
                <Link href="/contact" className="footer-link">{t('footer.links.contact')}</Link>
                <Link href="/careers" className="footer-link">{t('footer.links.careers')}</Link>
                <Link href="/blog" className="footer-link">{t('footer.links.blog')}</Link>
              </div>
            </div>
            <div className="footer-section">
              <h4>{t('footer.sections.support')}</h4>
              <div className="footer-links">
                <Link href="/help" className="footer-link">{t('footer.links.helpCenter')}</Link>
                <Link href="/contact" className="footer-link">{t('footer.links.contactSupport')}</Link>
                <Link href="/status" className="footer-link">{t('footer.links.statusPage')}</Link>
                <Link href="/api-status" className="footer-link">{t('footer.links.apiStatus')}</Link>
              </div>
            </div>
            <div className="footer-section">
              <h4>{t('footer.sections.legal')}</h4>
              <div className="footer-links">
                <Link href="/terms" className="footer-link">{t('footer.links.terms')}</Link>
                <Link href="/privacy" className="footer-link">{t('footer.links.privacy')}</Link>
                <Link href="/security" className="footer-link">{t('footer.links.security')}</Link>
                <Link href="/compliance" className="footer-link">{t('footer.links.compliance')}</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 blipee OS. {t('footer.copyright')} | {t('footer.certifications')}</p>
          </div>
        </footer>
      </div>
    </>
  )
}