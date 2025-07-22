'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase'
import { useTranslation } from '@/app/i18n/client'

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('auth')
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!agreeToTerms) {
      setError(t('signup.errors.agreeToTerms'))
      return
    }
    
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            company_name: companyName,
          }
        }
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        // Create organization and user profile
        const { error: orgError } = await supabase.rpc('create_organization_with_admin', {
          org_name: companyName,
          org_slug: companyName.toLowerCase().replace(/\s+/g, '-'),
          admin_user_id: data.user.id,
          admin_email: email,
          admin_name: `${firstName} ${lastName}`
        })

        if (orgError) {
          setError(orgError.message)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError(t('signup.errors.unexpected'))
    } finally {
      setLoading(false)
    }
  }

  const togglePassword = () => {
    setShowPassword(!showPassword)
  }

  // Password strength calculation
  const calculatePasswordStrength = () => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    return strength
  }

  const passwordStrength = calculatePasswordStrength()

  return (
    <>
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

        body {
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--darker);
          color: var(--white);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
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

        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.5;
          animation: float 20s ease-in-out infinite;
        }

        .bg-orb-1 {
          width: 400px;
          height: 400px;
          background: var(--purple);
          top: -200px;
          left: -200px;
          animation-duration: 25s;
        }

        .bg-orb-2 {
          width: 300px;
          height: 300px;
          background: var(--blue);
          bottom: -150px;
          right: -150px;
          animation-duration: 30s;
          animation-delay: -5s;
        }

        .bg-orb-3 {
          width: 350px;
          height: 350px;
          background: var(--pink);
          top: 50%;
          right: 50%;
          transform: translate(50%, -50%);
          animation-duration: 35s;
          animation-delay: -10s;
        }

        @keyframes meshAnimation {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-20px, -20px) rotate(120deg); }
          66% { transform: translate(20px, -10px) rotate(240deg); }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
        }

        /* Main Layout */
        .signup-layout {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        /* Center Container */
        .signup-container {
          width: 100%;
          max-width: 1200px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        /* Left Side - Benefits */
        .signup-left {
          animation: fadeIn 1s ease 0.5s both;
        }

        .benefits-content {
          max-width: 500px;
        }

        .benefits-badge {
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
        }

        .benefits-badge .pulse {
          width: 8px;
          height: 8px;
          background: var(--green);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .benefits-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .benefits-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.25rem;
          margin-bottom: 3rem;
          line-height: 1.6;
        }

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .benefit-item {
          display: flex;
          align-items: start;
          gap: 1rem;
          opacity: 0;
          animation: slideInLeft 0.6s ease forwards;
        }

        .benefit-item:nth-child(1) { animation-delay: 0.8s; }
        .benefit-item:nth-child(2) { animation-delay: 1s; }
        .benefit-item:nth-child(3) { animation-delay: 1.2s; }
        .benefit-item:nth-child(4) { animation-delay: 1.4s; }

        .benefit-icon {
          width: 48px;
          height: 48px;
          background: var(--gradient-primary);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .benefit-text h4 {
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .benefit-text p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        /* Right Side - Form */
        .signup-right {
          animation: fadeInUp 0.8s ease both;
        }

        .signup-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1.5rem;
          padding: 3rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: var(--glass-shadow);
          position: relative;
          overflow: hidden;
        }

        .signup-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-primary);
        }

        /* Form Header */
        .form-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .form-logo {
          font-size: 2rem;
          font-weight: 400;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.95rem;
        }

        /* Progress Steps */
        .progress-steps {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .step.active .step-number {
          background: var(--gradient-primary);
          border: none;
        }

        .step-line {
          width: 40px;
          height: 1px;
          background: var(--glass-border);
          margin: 0 -0.5rem;
        }

        /* Form */
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 0.5rem;
          color: var(--white);
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--purple);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        /* Password Group */
        .password-group {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0.5rem;
          transition: all 0.3s ease;
        }

        .password-toggle:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Password Strength */
        .password-strength {
          display: flex;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }

        .strength-bar {
          flex: 1;
          height: 3px;
          background: var(--glass-border);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .strength-bar.active {
          background: var(--gradient-primary);
        }

        /* Checkbox */
        .checkbox-group {
          display: flex;
          align-items: start;
          gap: 0.75rem;
          margin: 1rem 0;
        }

        .checkbox {
          width: 20px;
          height: 20px;
          appearance: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 0.25rem;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .checkbox:checked {
          background: var(--gradient-primary);
          border-color: transparent;
        }

        .checkbox:checked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 6px;
          border-left: 2px solid white;
          border-bottom: 2px solid white;
          transform: translate(-50%, -60%) rotate(-45deg);
        }

        .checkbox-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .checkbox-label a {
          color: var(--purple);
          text-decoration: none;
        }

        .checkbox-label a:hover {
          color: var(--blue);
        }

        /* Submit Button */
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
          position: relative;
          overflow: hidden;
          margin-top: 1rem;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -15px rgba(139, 92, 246, 0.5);
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .submit-btn:hover::before {
          left: 100%;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Sign In Link */
        .signin-section {
          text-align: center;
          margin-top: 1.5rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .signin-link {
          color: var(--purple);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .signin-link:hover {
          color: var(--blue);
        }

        /* Trust Badges */
        .trust-badges {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--glass-border);
        }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
        }

        .trust-badge svg {
          width: 16px;
          height: 16px;
          color: var(--green);
        }

        /* Back Link */
        .back-link {
          position: absolute;
          top: 2rem;
          left: 2rem;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .back-link:hover {
          color: var(--white);
          transform: translateX(-5px);
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

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .signup-container {
            grid-template-columns: 1fr;
            max-width: 500px;
          }

          .signup-left {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .signup-card {
            padding: 2rem 1.5rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .benefits-title {
            font-size: 2rem;
          }

          .trust-badges {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>

      <div className="bg-container">
        <div className="bg-gradient-mesh"></div>
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      {/* Back Link */}
      <Link href="/" className="back-link">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
        </svg>
        {t('signup.backToHome')}
      </Link>

      <div className="signup-layout">
        <div className="signup-container">
          {/* Left Side - Benefits */}
          <div className="signup-left">
            <div className="benefits-content">
              <div className="benefits-badge">
                <span className="pulse"></span>
                <span>{t('signup.badge')}</span>
              </div>
              
              <h1 className="benefits-title">
                {t('signup.title')}
                <span className="gradient-text"> {t('signup.titleHighlight')}</span>
              </h1>
              
              <p className="benefits-subtitle">
                {t('signup.subtitle')}
              </p>
              
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M13 2L3 14L12 14L11 22L21 10L12 10L13 2Z"/>
                    </svg>
                  </div>
                  <div className="benefit-text">
                    <h4>{t('signup.benefits.instant.title')}</h4>
                    <p>{t('signup.benefits.instant.description')}</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                      <path d="M2 17L12 22L22 17"/>
                      <path d="M2 12L12 17L22 12"/>
                    </svg>
                  </div>
                  <div className="benefit-text">
                    <h4>{t('signup.benefits.fullAccess.title')}</h4>
                    <p>{t('signup.benefits.fullAccess.description')}</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div className="benefit-text">
                    <h4>{t('signup.benefits.training.title')}</h4>
                    <p>{t('signup.benefits.training.description')}</p>
                  </div>
                </div>
                
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <div className="benefit-text">
                    <h4>{t('signup.benefits.security.title')}</h4>
                    <p>{t('signup.benefits.security.description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="signup-right">
            <div className="signup-card">
              {/* Form Header */}
              <div className="form-header">
                <div className="form-logo">blipee OS</div>
                <h2 className="form-title">{t('signup.form.title')}</h2>
                <p className="form-subtitle">{t('signup.form.subtitle')}</p>
              </div>

              {/* Progress Steps */}
              <div className="progress-steps">
                <div className="step active">
                  <span className="step-number">1</span>
                </div>
                <div className="step-line"></div>
                <div className="step">
                  <span className="step-number">2</span>
                </div>
                <div className="step-line"></div>
                <div className="step">
                  <span className="step-number">3</span>
                </div>
              </div>

              {/* Form */}
              <form className="signup-form" onSubmit={handleSignUp}>
                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    color: '#FCA5A5',
                    fontSize: '0.875rem'
                  }}>
                    {error}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="first-name" className="form-label">{t('signup.form.firstName')}</label>
                    <input 
                      type="text" 
                      id="first-name" 
                      className="form-input" 
                      placeholder={t('signup.form.firstNamePlaceholder')}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="last-name" className="form-label">{t('signup.form.lastName')}</label>
                    <input 
                      type="text" 
                      id="last-name" 
                      className="form-input" 
                      placeholder={t('signup.form.lastNamePlaceholder')}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="company" className="form-label">{t('signup.form.company')}</label>
                  <input 
                    type="text" 
                    id="company" 
                    className="form-input" 
                    placeholder={t('signup.form.companyPlaceholder')}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="email" className="form-label">{t('signup.form.email')}</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="form-input" 
                    placeholder={t('signup.form.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="password" className="form-label">{t('signup.form.password')}</label>
                  <div className="password-group">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      id="password" 
                      className="form-input" 
                      placeholder={t('signup.form.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="password-toggle" onClick={togglePassword}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                  <div className="password-strength">
                    {[...Array(4)].map((_, i) => (
                      <span key={i} className={`strength-bar ${i < passwordStrength ? 'active' : ''}`}></span>
                    ))}
                  </div>
                </div>

                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    className="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="terms" className="checkbox-label">
                    {t('signup.form.termsPrefix')} <Link href="/terms">{t('signup.form.termsLink')}</Link> {t('signup.form.termsMiddle')} <Link href="/privacy">{t('signup.form.privacyLink')}</Link>{t('signup.form.termsSuffix')}
                  </label>
                </div>

                <button type="submit" className="submit-btn" disabled={loading || !agreeToTerms}>
                  {loading ? t('signup.form.submittingButton') : t('signup.form.submitButton')}
                </button>
              </form>

              {/* Sign In Link */}
              <div className="signin-section">
                {t('signup.form.haveAccount')} <Link href="/auth/signin" className="signin-link">{t('signup.form.signInLink')}</Link>
              </div>

              {/* Trust Badges */}
              <div className="trust-badges">
                <div className="trust-badge">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>{t('signup.trustBadges.soc2')}</span>
                </div>
                <div className="trust-badge">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>{t('signup.trustBadges.gdpr')}</span>
                </div>
                <div className="trust-badge">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>{t('signup.trustBadges.ssl')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}