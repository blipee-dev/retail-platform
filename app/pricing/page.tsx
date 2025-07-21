import PricingContent from './pricing-content'

export default function PricingPage() {
  return (
    <>
      {/* Show skeleton while component loads to prevent hydration mismatch */}
      <div className="pricing-skeleton" style={{ minHeight: '100vh', background: '#020617' }}>
        <PricingContent />
      </div>
    </>
  )
}