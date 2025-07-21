import IntegrationsContent from './integrations-content'

export default function IntegrationsPage() {
  return (
    <>
      {/* Show dark background while component loads to prevent hydration mismatch */}
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <IntegrationsContent />
      </div>
    </>
  )
}