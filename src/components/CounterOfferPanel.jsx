import { useState, useEffect } from 'react'
import { getCounterOffer, getAdverseActionNoticeUrl } from '../api/helocApi'

const fmtUSD = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

function ScenarioCard({ scenario, idx }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Option {idx + 1}</p>
      <div className="space-y-1 text-sm">
        {scenario.creditLine && (
          <div className="flex justify-between">
            <span className="text-gray-500">Credit Line</span>
            <span className="font-bold text-citizens-green">{fmtUSD(scenario.creditLine)}</span>
          </div>
        )}
        {scenario.apr && (
          <div className="flex justify-between">
            <span className="text-gray-500">APR</span>
            <span className="font-bold">{scenario.apr}%</span>
          </div>
        )}
        {scenario.drawPeriodYears && (
          <div className="flex justify-between">
            <span className="text-gray-500">Draw Period</span>
            <span>{scenario.drawPeriodYears} years</span>
          </div>
        )}
        {scenario.monthlyPayment && (
          <div className="flex justify-between">
            <span className="text-gray-500">Monthly (IO)</span>
            <span className="font-bold">{fmtUSD(scenario.monthlyPayment)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CounterOfferPanel({ applicationId }) {
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!applicationId) return
    getCounterOffer(applicationId)
      .then(data => setOffer(data))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false))
  }, [applicationId])

  if (loading) return <div className="card p-5 text-sm text-gray-400">Loading counter-offer...</div>

  return (
    <div className="card p-5">
      <p className="section-label mb-3">Counter-Offer &amp; Alternatives</p>

      {offer?.primaryDenialType && (
        <div className="bg-red-50 rounded-lg px-4 py-2 mb-4">
          <p className="text-sm text-red-700">
            <strong>Primary Reason:</strong> {offer.primaryDenialType.replace(/_/g, ' ')}
          </p>
          {offer.denialMessage && <p className="text-xs text-red-500 mt-1">{offer.denialMessage}</p>}
        </div>
      )}

      {offer?.scenarios && offer.scenarios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {offer.scenarios.map((s, i) => <ScenarioCard key={i} scenario={s} idx={i} />)}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">No counter-offer scenarios available for this application.</p>
      )}

      <a href={getAdverseActionNoticeUrl(applicationId)} target="_blank" rel="noopener noreferrer"
        className="text-sm text-citizens-green hover:text-citizens-green-dark font-medium">
        Download Adverse Action Notice &rarr;
      </a>
    </div>
  )
}
