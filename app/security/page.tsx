export const dynamic = 'force-dynamic'

import SecurityContent from './security-content'

export default function SecurityPage() {
  return (
    <>
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <SecurityContent />
      </div>
    </>
  )
}