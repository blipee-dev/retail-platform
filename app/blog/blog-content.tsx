'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function BlogContent() {
  const { t: tCommon, ready: readyCommon } = useTranslation('common')
  const { t, ready } = useTranslation('blog')
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready || !readyCommon) {
    return null
  }

  const categories = ['all', 'productUpdates', 'industryInsights', 'caseStudies', 'engineering', 'companyNews']
  const posts = t('posts', { returnObjects: true }) as any[]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
  }

  const getEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      'Product Updates': '🚀',
      'Case Studies': '💡',
      'Engineering': '🔧',
      'Industry Insights': '📈',
      'Company News': '🏢',
      'Actualizaciones de Producto': '🚀',
      'Casos de Estudio': '💡',
      'Ingeniería': '🔧',
      'Perspectivas de la Industria': '📈',
      'Noticias de la Empresa': '🏢',
      'Atualizações de Produto': '🚀',
      'Casos de Estudo': '💡',
      'Engenharia': '🔧',
      'Insights da Indústria': '📈',
      'Notícias da Empresa': '🏢'
    }
    return emojis[category] || '📄'
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

        {/* Categories */}
        <div className="categories">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`category-pill ${activeCategory === category ? 'active' : ''}`}
            >
              {t(`categories.${category}`)}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <div className="featured-post">
          <div className="featured-card">
            <div className="featured-image">📊</div>
            <div className="featured-content">
              <div className="featured-meta">
                <span className="featured-category">{t('featured.category')}</span>
                <span>{t('featured.date')}</span>
                <span>{t('featured.readTime')}</span>
              </div>
              <h2 className="featured-title">{t('featured.title')}</h2>
              <p className="featured-excerpt">{t('featured.excerpt')}</p>
              <a href="#" className="read-more">
                {t('featured.readMore')}
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="blog-grid">
          {posts.map((post, index) => (
            <article key={index} className="blog-card">
              <div className="blog-image">{getEmoji(post.category)}</div>
              <div className="blog-content">
                <div className="blog-meta">
                  <span className="blog-category">{post.category}</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="blog-title">{post.title}</h3>
                <p className="blog-excerpt">{post.excerpt}</p>
                <div className="blog-author">
                  <div className="author-avatar">{getInitials(post.author)}</div>
                  <span>{post.author}, {post.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="newsletter">
          <h2 className="newsletter-title">{t('newsletter.title')}</h2>
          <p className="newsletter-subtitle">{t('newsletter.subtitle')}</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              className="newsletter-input" 
              placeholder={t('newsletter.placeholder')}
            />
            <button type="submit" className="btn btn-primary">{t('newsletter.button')}</button>
          </form>
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
          margin: 0 auto 2rem;
          line-height: 1.6;
        }

        /* Categories */
        .categories {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 4rem;
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        .category-pill {
          padding: 0.5rem 1.5rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 2rem;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          cursor: pointer;
        }

        .category-pill:hover,
        .category-pill.active {
          background: var(--gradient-primary);
          color: var(--white);
          border-color: transparent;
        }

        /* Featured Post */
        .featured-post {
          margin-bottom: 4rem;
          animation: fadeInUp 1s ease 0.4s both;
        }

        .featured-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .featured-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .featured-image {
          width: 100%;
          height: 300px;
          background: var(--gradient-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          color: var(--white);
        }

        .featured-content {
          padding: 2rem;
        }

        .featured-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .featured-category {
          background: rgba(139, 92, 246, 0.2);
          color: var(--purple);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-weight: 500;
        }

        .featured-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          line-height: 1.3;
        }

        .featured-excerpt {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .read-more {
          color: var(--purple);
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .read-more:hover {
          color: var(--blue);
          transform: translateX(5px);
        }

        /* Blog Grid */
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
          animation: fadeInUp 1.2s ease 0.6s both;
        }

        .blog-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .blog-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .blog-image {
          width: 100%;
          height: 200px;
          background: var(--gradient-blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: var(--white);
        }

        .blog-content {
          padding: 1.5rem;
        }

        .blog-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .blog-category {
          background: rgba(14, 165, 233, 0.2);
          color: var(--blue);
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .blog-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .blog-excerpt {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          margin-bottom: 1rem;
          font-size: 0.95rem;
        }

        .blog-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .author-avatar {
          width: 32px;
          height: 32px;
          background: var(--gradient-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--white);
        }

        /* Newsletter */
        .newsletter {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 1rem;
          backdrop-filter: blur(20px);
          animation: fadeInUp 1.4s ease 0.8s both;
        }

        .newsletter-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .newsletter-subtitle {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }

        .newsletter-form {
          display: flex;
          max-width: 400px;
          margin: 0 auto;
          gap: 1rem;
        }

        .newsletter-input {
          flex: 1;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 0.5rem;
          color: var(--white);
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .newsletter-input:focus {
          outline: none;
          border-color: var(--purple);
          background: rgba(255, 255, 255, 0.08);
        }

        .newsletter-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
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

          .categories {
            flex-wrap: wrap;
          }

          .blog-grid {
            grid-template-columns: 1fr;
          }

          .newsletter-form {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  )
}