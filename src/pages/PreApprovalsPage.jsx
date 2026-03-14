import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPreApprovalOffers, generatePreApprovalOffers } from '../api/helocApi'
import LoadingSpinner from '../components/LoadingSpinner'

const fmtUSD = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

export default function PreApprovalsPage() {
  const navigate = useNavigate()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  function loadOffers() {
    setLoading(true)
    getPreApprovalOffers()
      .then(data => setOffers(Array.isArray(data) ? data : []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOffers() }, [])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generatePreApprovalOffers()
      loadOffers()
    } catch { /* ignore */ }
    setGenerating(false)
  }

  function handleRedeem(offer) {
    navigate('/apply', {
      state: {
        preApproval: {
          offerCode: offer.offerCode,
          preApprovedAmount: offer.preApprovedAmount,
          preApprovedApr: offer.preApprovedApr,
          applicant: offer.applicant,
          property: offer.property,
        }
      }
    })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-citizens-navy">Pre-Approval Offers</h1>
          <p className="text-sm text-gray-500">Property-based pre-approval offers for qualified homeowners.</p>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-primary disabled:opacity-50">
          {generating ? 'Generating\u2026' : 'Generate New Offers'}
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No pre-approval offers available.</p>
          <button onClick={handleGenerate} className="btn-primary">Generate Offers</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <div key={offer.offerCode} className="card p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-800">{offer.applicant?.firstName} {offer.applicant?.lastName}</p>
                  <p className="text-xs text-gray-500">{offer.offerCode}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  offer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  offer.status === 'REDEEMED' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {offer.status || 'ACTIVE'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pre-Approved Amount</span>
                  <span className="font-bold text-citizens-green">{fmtUSD(offer.preApprovedAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">APR</span>
                  <span className="font-bold">{offer.preApprovedApr || '\u2014'}%</span>
                </div>
                {offer.property?.propertyAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Property</span>
                    <span className="text-gray-700 text-right max-w-[60%] truncate">{offer.property.propertyAddress}</span>
                  </div>
                )}
                {offer.property?.estimatedPropertyValue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Home Value</span>
                    <span className="font-medium">{fmtUSD(offer.property.estimatedPropertyValue)}</span>
                  </div>
                )}
                {offer.expiresAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expires</span>
                    <span className="text-gray-700">{new Date(offer.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {offer.status !== 'REDEEMED' && (
                <button onClick={() => handleRedeem(offer)} className="btn-primary w-full text-sm">
                  Start Application &rarr;
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
