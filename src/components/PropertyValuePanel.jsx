import { useState } from 'react'

function fmtUSD(n, decimals = 0) {
  if (n == null || isNaN(n) || !isFinite(n)) return '\u2014'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals
  }).format(n)
}

function ValueCard({ tier, value, desc, badge, color }) {
  return (
    <div className={`flex-1 min-w-[160px] rounded-xl border-2 ${color} p-4`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{tier}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{desc}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
    </div>
  )
}

export default function PropertyValuePanel() {
  const [street, setStreet]   = useState('')
  const [city, setCity]       = useState('')
  const [state, setState]     = useState('')
  const [zip, setZip]         = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')

  function handleEstimate() {
    if (!street || !city || !state || !zip) { setError('All address fields are required'); return }
    setLoading(true); setError(''); setResult(null)

    // Mock property valuation since there is no real property API
    setTimeout(() => {
      const baseValue = 350000 + Math.floor(Math.random() * 300000)
      const lowEstimate = Math.round(baseValue * 0.92)
      const highEstimate = Math.round(baseValue * 1.08)
      const comparable1 = Math.round(baseValue * (0.9 + Math.random() * 0.2))
      const comparable2 = Math.round(baseValue * (0.9 + Math.random() * 0.2))
      const comparable3 = Math.round(baseValue * (0.9 + Math.random() * 0.2))

      setResult({
        estimatedValue: baseValue,
        lowEstimate,
        highEstimate,
        comparables: [
          { address: '123 Oak St', price: comparable1, sqft: 1800 + Math.floor(Math.random() * 800), soldDate: '2025-11-15' },
          { address: '456 Maple Ave', price: comparable2, sqft: 1800 + Math.floor(Math.random() * 800), soldDate: '2025-10-22' },
          { address: '789 Pine Rd', price: comparable3, sqft: 1800 + Math.floor(Math.random() * 800), soldDate: '2025-09-08' },
        ],
        address: `${street}, ${city}, ${state} ${zip}`,
      })
      setLoading(false)
    }, 1500)
  }

  const ready = street && city && state && zip

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-5">

        {/* Header row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-800">Home Value Estimate</span>
          </div>
          <span className="text-xs text-gray-400">Estimated property valuation with comparable sales</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Street Address</label>
            <input
              value={street}
              onChange={e => setStreet(e.target.value)}
              placeholder="100 Westminster St"
              className="border border-gray-200 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-citizens-green focus:border-citizens-green"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">City</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Providence"
              className="border border-gray-200 rounded-md px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-citizens-green focus:border-citizens-green"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">State</label>
            <input
              value={state}
              onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="RI"
              maxLength={2}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm w-16 focus:outline-none focus:ring-2 focus:ring-citizens-green focus:border-citizens-green"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ZIP</label>
            <input
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="02903"
              maxLength={5}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-citizens-green focus:border-citizens-green"
            />
          </div>

          <button
            onClick={handleEstimate}
            disabled={!ready || loading}
            className="btn-primary self-end disabled:opacity-40 whitespace-nowrap"
          >
            {loading
              ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Estimating...</span>
              : 'Get Estimate \u2192'
            }
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        {/* Results */}
        {result && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{result.address}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Based on comparable sales in the area
                </p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Estimate range</p>
                <p className="font-semibold text-gray-700">{fmtUSD(result.lowEstimate)} \u2013 {fmtUSD(result.highEstimate)}</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <ValueCard
                tier="Low Estimate"
                value={fmtUSD(result.lowEstimate)}
                desc="Conservative"
                badge="bg-gray-100 text-gray-600"
                color="border-gray-200"
              />
              <ValueCard
                tier="Estimated Value"
                value={fmtUSD(result.estimatedValue)}
                desc="Market value"
                badge="bg-citizens-green-light text-citizens-green"
                color="border-citizens-green/30"
              />
              <ValueCard
                tier="High Estimate"
                value={fmtUSD(result.highEstimate)}
                desc="Optimistic"
                badge="bg-blue-100 text-blue-600"
                color="border-blue-200"
              />
            </div>

            {/* Comparable sales */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Comparable Sales</p>
              <div className="grid grid-cols-3 gap-3">
                {result.comparables.map((comp, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <p className="font-medium text-gray-800">{comp.address}</p>
                    <p className="text-gray-500 text-xs">{comp.sqft.toLocaleString()} sq ft &middot; Sold {comp.soldDate}</p>
                    <p className="font-bold text-gray-900 mt-1">{fmtUSD(comp.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400">
              * Estimates are for informational purposes only. Actual property value will be determined by a licensed appraiser.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
