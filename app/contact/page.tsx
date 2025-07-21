import ContactContent from './contact-content'

export default function ContactPage() {
  return (
    <>
      {/* Show dark background while component loads to prevent hydration mismatch */}
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <ContactContent />
      </div>
    </>
  )
}