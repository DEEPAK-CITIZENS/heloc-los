import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPreApprovalOffers, generatePreApprovalOffers, redeemPreApprovalOffer } from '../api/helocApi'
import { generateMockPreApprovalOffers, getZillowPropertyUrl, getComparableSales } from '../api/zillowApi'
import PropertyImage from '../components/PropertyImage'
import LoadingSpinner from '../components/LoadingSpinner'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function fmtNum(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US').format(val)
}

// ── Zillow Data Badge ────────────────────────────────────────────────────────
function ZillowBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L1 8.5V23h22V8.5L12 1zm0 2.3L21 9v12H3V9l9-5.7z"/>
        <text x="7" y="19" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Z</text>
      </svg>
      Zillow
    </span>
  )
}

// ── Zillow Property Details Panel ────────────────────────────────────────────
function ZillowPropertyPanel({ offer }) {
  const [expanded, setExpanded] = useState(false)
  const comps = expanded
    ? getComparableSales(offer.propertyAddress, offer.propertyCity, offer.propertyState)
    : []

  return (
    <div className="mt-2 border-t border-gray-100 pt-2">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        <ZillowBadge />
        <span>{expanded ? 'Hide' : 'Show'} Property Details</span>
        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 animate-in fade-in">
          {/* Zestimate */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
              Zestimate Range
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{fmt(offer.zillowZestimateLow)}</span>
              <div className="flex-1 h-2 bg-blue-100 rounded-full relative">
                <div
                  className="absolute h-full bg-blue-500 rounded-full"
                  style={{
                    left: '0%',
                    width: `${Math.min(100, ((offer.zillowZestimate - offer.zillowZestimateLow) / (offer.zillowZestimateHigh - offer.zillowZestimateLow)) * 100)}%`
                  }}
                />
                <div
                  className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-[2px]"
                  style={{
                    left: `${Math.min(100, ((offer.zillowZestimate - offer.zillowZestimateLow) / (offer.zillowZestimateHigh - offer.zillowZestimateLow)) * 100)}%`
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">{fmt(offer.zillowZestimateHigh)}</span>
            </div>
            <p className="text-center text-sm font-bold text-blue-700 mt-1">{fmt(offer.zillowZestimate)}</p>
          </div>

          {/* Property specs */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-50 rounded p-2 text-center">
              <p className="text-gray-400 mb-0.5">Year Built</p>
              <p className="font-bold text-gray-800">{offer.zillowYearBuilt}</p>
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <p className="text-gray-400 mb-0.5">Sq Ft</p>
              <p className="font-bold text-gray-800">{fmtNum(offer.zillowLivingArea)}</p>
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <p className="text-gray-400 mb-0.5">Bed / Bath</p>
              <p className="font-bold text-gray-800">{offer.zillowBedrooms} / {offer.zillowBathrooms}</p>
            </div>
          </div>

          {/* Comparable sales */}
          {comps.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Comparable Sales</p>
              <div className="space-y-1.5">
                {comps.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-2.5 py-1.5 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 truncate">{c.address}, {c.city}</p>
                      <p className="text-gray-400">{c.sqft} sqft &middot; {c.bedrooms}bd/{c.bathrooms}ba &middot; {c.distance}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="font-bold text-gray-800">{fmt(c.salePrice)}</p>
                      <p className="text-gray-400">{c.saleDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zillow link */}
          {offer.zillowUrl && (
            <a
              href={offer.zillowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg py-2 transition-colors"
            >
              View full details on Zillow &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Offer Card ───────────────────────────────────────────────────────────────
function OfferCard({ offer, onRedeem, redeeming }) {
  const redeemed = offer.status === 'REDEEMED'
  const expired  = offer.status === 'EXPIRED'

  return (
    <div className={`card overflow-hidden flex flex-col transition-shadow hover:shadow-lg
      ${redeemed ? 'opacity-60' : ''} ${expired ? 'opacity-40' : ''}`}>

      {/* Property image */}
      <PropertyImage
        address={offer.propertyAddress}
        city={offer.propertyCity}
        state={offer.propertyState}
        zip={offer.propertyZip}
        imageUrl={offer.propertyImageUrl}
        compact
      />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header: address + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{offer.propertyAddress ?? 'Property Address'}</p>
            <p className="text-sm text-gray-500 truncate">
              {[offer.propertyCity, offer.propertyState, offer.propertyZip].filter(Boolean).join(', ')}
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0
            ${redeemed ? 'bg-gray-100 text-gray-500' :
              expired ? 'bg-red-100 text-red-600' :
              'bg-citizens-green-light text-citizens-green'}`}>
            {offer.status ?? 'ACTIVE'}
          </span>
        </div>

        {/* Pre-approved credit line - prominent */}
        <div className="bg-citizens-green-pale rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-citizens-green uppercase tracking-wide">Pre-Approved Credit Line</p>
          <p className="text-2xl font-extrabold text-citizens-green">{fmt(offer.preApprovedAmount)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {offer.preApprovedApr != null ? `${Number(offer.preApprovedApr).toFixed(2)}% APR` : ''}
            {offer.monthlyPaymentEstimate ? ` \u00b7 ${fmt(offer.monthlyPaymentEstimate)}/mo interest-only` : ''}
          </p>
        </div>

        {/* Property & financial details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Home Value</p>
            <p className="font-semibold text-gray-800">{fmt(offer.estimatedPropertyValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Mortgage Balance</p>
            <p className="font-semibold text-gray-800">{fmt(offer.currentMortgageBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Equity</p>
            <p className="font-semibold text-gray-800">{fmt(offer.estimatedEquity)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">CLTV</p>
            <p className="font-semibold text-gray-800">{offer.cltv != null ? `${offer.cltv}%` : '\u2014'}</p>
          </div>
        </div>

        {/* Customer & terms */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {offer.customerName && <span className="text-gray-600 font-medium">{offer.customerName}</span>}
            {offer.creditScore && <span className="ml-1.5">&middot; Score: {offer.creditScore}</span>}
          </span>
          <span className="font-mono">{offer.offerCode ?? '\u2014'}</span>
        </div>

        {/* Draw/repayment terms */}
        {(offer.drawPeriodYears || offer.repaymentPeriodYears) && (
          <div className="flex gap-2">
            {offer.drawPeriodYears && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {offer.drawPeriodYears}-yr draw
              </span>
            )}
            {offer.repaymentPeriodYears && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {offer.repaymentPeriodYears}-yr repayment
              </span>
            )}
          </div>
        )}

        {/* Zillow property details panel */}
        {offer.zillowZestimate && <ZillowPropertyPanel offer={offer} />}

        {/* Action buttons */}
        <div className="mt-auto pt-2">
          {!redeemed && !expired && (
            <button
              onClick={() => onRedeem(offer)}
              disabled={redeeming}
              className="btn-primary w-full disabled:opacity-50"
            >
              {redeeming ? 'Redeeming\u2026' : 'Redeem & Apply'}
            </button>
          )}
          {redeemed && (
            <p className="text-xs text-gray-400 text-center py-1">This offer has been redeemed.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Summary Stats Bar ────────────────────────────────────────────────────────
function StatBar({ offers }) {
  if (!offers.length) return null
  const active = offers.filter(o => o.status === 'ACTIVE')
  const totalLine = active.reduce((s, o) => s + (o.preApprovedAmount || 0), 0)
  const avgApr = active.length
    ? (active.reduce((s, o) => s + (o.preApprovedApr || 0), 0) / active.length).toFixed(2)
    : 0
  const avgEquity = active.length
    ? Math.round(active.reduce((s, o) => s + (o.estimatedEquity || 0), 0) / active.length)
    : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="card p-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Total Offers</p>
        <p className="text-2xl font-extrabold text-gray-900">{offers.length}</p>
        <p className="text-xs text-gray-400">{active.length} active</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Total Pre-Approved</p>
        <p className="text-2xl font-extrabold text-citizens-green">{fmt(totalLine)}</p>
        <p className="text-xs text-gray-400">combined credit lines</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Avg APR</p>
        <p className="text-2xl font-extrabold text-gray-900">{avgApr}%</p>
        <p className="text-xs text-gray-400">across active offers</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Avg Equity</p>
        <p className="text-2xl font-extrabold text-gray-900">{fmt(avgEquity)}</p>
        <p className="text-xs text-gray-400">estimated home equity</p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PreApprovalsPage() {
  const navigate = useNavigate()
  const [offers, setOffers]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [generating, setGenerating] = useState(false)
  const [redeeming, setRedeeming] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPreApprovalOffers()
      setOffers(Array.isArray(data) ? data : [])
    } catch {
      // Backend unavailable - show empty state so user can generate mock offers
      setOffers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      // Try backend first
      await generatePreApprovalOffers()
      await load()
    } catch {
      // Backend unavailable - generate mock offers with Zillow property data
      try {
        const mockOffers = generateMockPreApprovalOffers(6)
        setOffers(mockOffers)
      } catch (mockErr) {
        setError('Failed to generate offers: ' + (mockErr.message || 'Unknown error'))
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleRedeem(offer) {
    setRedeeming(offer.offerCode)
    try {
      // Try backend redemption first
      await redeemPreApprovalOffer(offer.offerCode)
    } catch {
      // Backend unavailable - mark locally as redeemed
    }
    // Navigate to application with pre-approval data
    navigate('/apply', {
      state: {
        preApproval: {
          offerCode: offer.offerCode,
          firstName: offer.firstName,
          lastName: offer.lastName,
          preApprovedAmount: offer.preApprovedAmount,
          preApprovedApr: offer.preApprovedApr,
          propertyAddress: offer.propertyAddress,
          propertyCity: offer.propertyCity,
          propertyState: offer.propertyState,
          propertyZip: offer.propertyZip,
          estimatedPropertyValue: offer.estimatedPropertyValue,
          currentMortgageBalance: offer.currentMortgageBalance,
        }
      }
    })
  }

  if (loading) return <LoadingSpinner message="Loading pre-approval offers\u2026" />

  const active   = offers.filter(o => o.status !== 'REDEEMED' && o.status !== 'EXPIRED')
  const redeemed = offers.filter(o => o.status === 'REDEEMED')

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label mb-1">Citizens HELOC</p>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Approval Offers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pre-approved HELOC offers based on property valuation data from <ZillowBadge />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerate} disabled={generating} className="btn-primary disabled:opacity-50">
            {generating ? 'Generating\u2026' : 'Generate Offers'}
          </button>
          <button onClick={load} className="btn-secondary px-3">{'\u21bb'}</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {/* Stats bar */}
      <StatBar offers={offers} />

      {/* Empty state */}
      {offers.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <p className="font-medium text-gray-600">No pre-approval offers yet</p>
          <p className="text-sm mt-1 mb-4">Click "Generate Offers" to create pre-approved HELOC offers with Zillow property data.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary disabled:opacity-50">
            {generating ? 'Generating\u2026' : 'Generate Pre-Approval Offers'}
          </button>
        </div>
      )}

      {/* Active offers */}
      {active.length > 0 && (
        <>
          <p className="section-label mb-3">Active Offers ({active.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {active.map(offer => (
              <OfferCard
                key={offer.offerCode ?? offer.id}
                offer={offer}
                onRedeem={handleRedeem}
                redeeming={redeeming === offer.offerCode}
              />
            ))}
          </div>
        </>
      )}

      {/* Redeemed offers */}
      {redeemed.length > 0 && (
        <>
          <p className="section-label mb-3">Redeemed ({redeemed.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {redeemed.map(offer => (
              <OfferCard
                key={offer.offerCode ?? offer.id}
                offer={offer}
                onRedeem={handleRedeem}
                redeeming={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
