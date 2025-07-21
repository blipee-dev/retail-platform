export const dynamic = 'force-dynamic'

import ComplianceContent from './compliance-content'

export default function CompliancePage() {
  return (
    <>
      {/* Show dark background while component loads to prevent hydration mismatch */}
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <ComplianceContent />
      </div>
    </>
  )
}