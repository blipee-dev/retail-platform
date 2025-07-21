export const dynamic = 'force-dynamic'

import DocsContent from './docs-content'

export default function DocsPage() {
  return (
    <>
      {/* Show dark background while component loads to prevent hydration mismatch */}
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <DocsContent />
      </div>
    </>
  )
}