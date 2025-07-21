'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function ContactContent() {
  const { t: tCommon, ready: readyCommon } = useTranslation('common')
  const { t, ready } = useTranslation('contact')
  const [mounted, setMounted] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [formSubmitted, setFormSubmitted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready || !readyCommon) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => setFormSubmitted(false), 3000)
  }

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
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
            <Link href="/about" className="nav-link">{tCommon('nav.about')}</Link>
            <Link href="/integrations" className="nav-link">{tCommon('nav.integrations')}</Link>
            <Link href="/pricing" className="nav-link">{tCommon('nav.pricing')}</Link>
            <Link href="/contact" className="nav-link active">{tCommon('nav.contact')}</Link>
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

        {/* Contact Methods */}
        <div className="contact-methods">
          <div className="contact-card">
            <div className="contact-icon">💬</div>
            <h3 className="contact-title">{t('methods.chat.title')}</h3>
            <p className="contact-description">{t('methods.chat.description')}</p>
            <a href="#" className="contact-action">{t('methods.chat.action')}</a>
          </div>
          <div className="contact-card">
            <div className="contact-icon">📧</div>
            <h3 className="contact-title">{t('methods.email.title')}</h3>
            <p className="contact-description">{t('methods.email.description')}</p>
            <a href={`mailto:${t('methods.email.action')}`} className="contact-action">{t('methods.email.action')}</a>
          </div>
          <div className="contact-card">
            <div className="contact-icon">📞</div>
            <h3 className="contact-title">{t('methods.phone.title')}</h3>
            <p className="contact-description">{t('methods.phone.description')}</p>
            <a href={`tel:${t('methods.phone.action').replace(/[^0-9+]/g, '')}`} className="contact-action">{t('methods.phone.action')}</a>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="contact-form-section">
          <div className="form-info">
            <h2>{t('form.title')}</h2>
            <p>{t('form.subtitle')}</p>
            <ul className="info-list">
              <li className="info-item">
                <div className="info-icon">✓</div>
                <span>{t('form.benefits.response')}</span>
              </li>
              <li className="info-item">
                <div className="info-icon">✓</div>
                <span>{t('form.benefits.manager')}</span>
              </li>
              <li className="info-item">
                <div className="info-icon">✓</div>
                <span>{t('form.benefits.onboarding')}</span>
              </li>
              <li className="info-item">
                <div className="info-icon">✓</div>
                <span>{t('form.benefits.support')}</span>
              </li>
            </ul>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">{t('form.fields.name.label')}</label>
              <input type="text" id="name" className="form-input" placeholder={t('form.fields.name.placeholder')} required />
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">{t('form.fields.email.label')}</label>
              <input type="email" id="email" className="form-input" placeholder={t('form.fields.email.placeholder')} required />
            </div>
            <div className="form-group">
              <label htmlFor="company" className="form-label">{t('form.fields.company.label')}</label>
              <input type="text" id="company" className="form-input" placeholder={t('form.fields.company.placeholder')} />
            </div>
            <div className="form-group">
              <label htmlFor="subject" className="form-label">{t('form.fields.subject.label')}</label>
              <select id="subject" className="form-select" required>
                <option value="">{t('form.fields.subject.placeholder')}</option>
                <option value="sales">{t('form.fields.subject.options.sales')}</option>
                <option value="support">{t('form.fields.subject.options.support')}</option>
                <option value="billing">{t('form.fields.subject.options.billing')}</option>
                <option value="integration">{t('form.fields.subject.options.integration')}</option>
                <option value="demo">{t('form.fields.subject.options.demo')}</option>
                <option value="other">{t('form.fields.subject.options.other')}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message" className="form-label">{t('form.fields.message.label')}</label>
              <textarea id="message" className="form-textarea" placeholder={t('form.fields.message.placeholder')} required></textarea>
            </div>
            <button type="submit" className="submit-btn">
              {formSubmitted ? t('form.success') : t('form.submit')}
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="faq">
          <h2 className="section-title">{t('faq.title')}</h2>
          <div className="faq-grid">
            {t('faq.items', { returnObjects: true }).map((item: any, index: number) => (
              <div key={index} className="faq-item">
                <button className="faq-question" onClick={() => toggleFAQ(index)}>
                  {item.question}
                  <svg className={`faq-icon ${openFAQ === index ? 'rotate' : ''}`} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
                <div className={`faq-answer ${openFAQ === index ? 'show' : ''}`}>
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <div className="support-hours">
          <h2 className="hours-title">{t('hours.title')}</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>
            {t('hours.subtitle')}
          </p>
          <div className="hours-grid">
            <div className="hours-item">
              <div className="hours-label">{t('hours.chat.label')}</div>
              <div className="hours-time">{t('hours.chat.time')}</div>
            </div>
            <div className="hours-item">
              <div className="hours-label">{t('hours.phone.label')}</div>
              <div className="hours-time">{t('hours.phone.time')}</div>
            </div>
            <div className="hours-item">
              <div className="hours-label">{t('hours.emergency.label')}</div>
              <div className="hours-time">{t('hours.emergency.time')}</div>
            </div>
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

        .nav-link.active {
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

        /* Contact Methods */
        .contact-methods {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        .contact-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2rem;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .contact-card::before {
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

        .contact-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .contact-card:hover::before {
          transform: translateX(0);
        }

        .contact-icon {
          width: 60px;
          height: 60px;
          background: var(--gradient-primary);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 1.5rem;
        }

        .contact-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .contact-description {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .contact-action {
          color: var(--purple);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .contact-action:hover {
          color: var(--blue);
        }

        /* Contact Form */
        .contact-form-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          margin-bottom: 4rem;
          animation: fadeInUp 1s ease 0.4s both;
        }

        .form-info h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .form-info p {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .info-list {
          list-style: none;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .info-icon {
          width: 24px;
          height: 24px;
          background: var(--gradient-primary);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-form {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2.5rem;
          backdrop-filter: blur(20px);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 0.5rem;
          color: var(--white);
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--purple);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .form-select {
          cursor: pointer;
        }

        .form-select option {
          background: var(--dark);
          color: var(--white);
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: var(--gradient-primary);
          color: var(--white);
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -10px rgba(139, 92, 246, 0.5);
        }

        /* FAQ Section */
        .faq {
          margin-bottom: 4rem;
          animation: fadeInUp 1.2s ease 0.6s both;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 3rem;
        }

        .faq-grid {
          display: grid;
          gap: 1rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-item {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 0.75rem;
          backdrop-filter: blur(20px);
          overflow: hidden;
        }

        .faq-question {
          width: 100%;
          padding: 1.5rem;
          background: transparent;
          border: none;
          color: var(--white);
          font-size: 1.1rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .faq-question:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .faq-answer {
          display: none;
          padding: 0 1.5rem 1.5rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .faq-answer.show {
          display: block;
          animation: fadeIn 0.3s ease;
        }

        .faq-icon {
          transition: transform 0.3s ease;
        }

        .faq-icon.rotate {
          transform: rotate(180deg);
        }

        /* Support Hours */
        .support-hours {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          padding: 2.5rem;
          text-align: center;
          backdrop-filter: blur(20px);
          animation: fadeInUp 1.4s ease 0.8s both;
        }

        .hours-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .hours-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .hours-item {
          text-align: center;
        }

        .hours-label {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .hours-time {
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }

          .page-title {
            font-size: 2.5rem;
          }

          .contact-form-section {
            grid-template-columns: 1fr;
          }

          .contact-methods {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}