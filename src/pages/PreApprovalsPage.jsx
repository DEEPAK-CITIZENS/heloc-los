import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPreApprovalOffers, generatePreApprovalOffers, redeemPreApprovalOffer } from '../api/helocApi'
import LoadingSpinner from '../components/LoadingSpinner'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function OfferCard({ offer, onRedeem, redeeming }) {
  const redeemed = offer.status === 'REDEEMED'
  const expired  = offer.status === 'EXPIRED'

  return (
    <div className={`card p-5 flex flex-col gap-3 transition-shadow hover:shadow-md
      ${redeemed ? 'opacity-60' : ''} ${expired ? 'opacity-40' : ''}`}>
      {/* Property info */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-citizens-green-light flex items-center justify-center text-citizens-green shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{offer.propertyAddress ?? 'Property Address'}</p>
          <p className="text-sm text-gray-500 truncate">
            {[offer.propertyCity, offer.propertyState].filter(Boolean).join(', ')}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full
          ${redeemed ? 'bg-gray-100 text-gray-500' :
            expired ? 'bg-red-100 text-red-600' :
            'bg-citizens-green-light text-citizens-green'}`}>
          {offer.status ?? 'ACTIVE'}
        </span>
      </div>

      {/* Offer details */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Estimated Equity</p>
          <p className="font-semibold text-gray-800">{fmt(offer.estimatedEquity)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Pre-Approved Line</p>
          <p className="font-semibold text-citizens-green">{fmt(offer.preApprovedAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">APR</p>
          <p className="font-semibold text-gray-800">{offer.preApprovedApr != null ? `${Number(offer.preApprovedApr).toFixed(2)}%` : '\u2014'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Offer Code</p>
          <p className="font-semibold text-gray-800 font-mono text-xs">{offer.offerCode ?? '\u2014'}</p>
        </div>
      </div>

      {offer.customerName && (
        <p className="text-xs text-gray-400">Customer: <span className="text-gray-600">{offer.customerName}</span></p>
      )}

      {!redeemed && !expired && (
        <button
          onClick={() => onRedeem(offer)}
          disabled={redeeming}
          className="btn-primary w-full mt-1 disabled:opacity-50"
        >
          {redeeming ? 'Redeeming\u2026' : 'Redeem & Apply'}
        </button>
      )}
      {redeemed && (
        <p className="text-xs text-gray-400 text-center">This offer has been redeemed.</p>
      )}
    </div>
  )
}

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
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      await generatePreApprovalOffers()
      await load()
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to generate.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRedeem(offer) {
    setRedeeming(offer.offerCode)
    try {
      await redeemPreApprovalOffer(offer.offerCode)
      navigate('/apply', {
        state: {
          preApproval: {
            offerCode: offer.offerCode,
            firstName: offer.firstName,
            lastName: offer.lastName,
            preApprovedAmount: offer.preApprovedAmount,
            preApprovedApr: offer.preApprovedApr,
          }
        }
      })
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to redeem.')
      setRedeeming(null)
    }
  }

  if (loading) return <LoadingSpinner message="Loading pre-approval offers\u2026" />

  const active   = offers.filter(o => o.status !== 'REDEEMED' && o.status !== 'EXPIRED')
  const redeemed = offers.filter(o => o.status === 'REDEEMED')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label mb-1">Citizens HELOC</p>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Approval Offers</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerate} disabled={generating} className="btn-primary disabled:opacity-50">
            {generating ? 'Generating\u2026' : 'Generate Offers'}
          </button>
          <button onClick={load} className="btn-secondary px-3">{'\u21bb'}</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

      {offers.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">{'\ud83c\udfe0'}</p>
          <p className="font-medium">No pre-approval offers yet.</p>
          <p className="text-sm mt-1">Click &ldquo;Generate Offers&rdquo; to create sample pre-approval offers.</p>
        </div>
      )}

      {active.length > 0 && (
        <>
          <p className="section-label mb-3">Active Offers ({active.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      {redeemed.length > 0 && (
        <>
          <p className="section-label mb-3">Redeemed ({redeemed.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
