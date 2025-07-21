export const dynamic = 'force-dynamic'

import AboutContent from './about-content'

export default function AboutPage() {
  return (
    <>
      {/* Show dark background while component loads to prevent hydration mismatch */}
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <AboutContent />
      </div>
    </>
  )
}