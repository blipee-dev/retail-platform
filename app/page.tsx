import LandingPageContent from './components/landing-page'

export default function LandingPage() {
  return (
    <>
      {/* Show dark background while component loads to prevent hydration mismatch */}
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <LandingPageContent />
      </div>
    </>
  )
}