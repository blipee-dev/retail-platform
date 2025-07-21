export const dynamic = 'force-dynamic'

import BlogContent from './blog-content'

export default function BlogPage() {
  return (
    <>
      {/* Show dark background while component loads to prevent hydration mismatch */}
      <div style={{ minHeight: '100vh', background: '#020617' }}>
        <BlogContent />
      </div>
    </>
  )
}