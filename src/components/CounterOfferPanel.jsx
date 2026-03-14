import { useState, useEffect } from 'react'
import { getCounterOffer, getAdverseActionNoticeUrl } from '../api/helocApi'

function fmt(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function ScenarioCard({ scenario, selected, onSelect }) {
  const active = selected === scenario.id
  return (
    <button
      onClick={() => onSelect(scenario.id)}
      className={`text-left w-full rounded-xl border-2 p-4 transition-all duration-200
        ${active
          ? 'border-citizens-green bg-citizens-green-light shadow-md'
          : 'border-gray-200 bg-white hover:border-citizens-green/40 hover:shadow-sm'
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{scenario.label}</span>
        {active && (
          <span className="bg-citizens-green text-white text-xs font-bold px-2 py-0.5 rounded-full">Selected</span>
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Credit Line</span>
          <span className="font-semibold text-gray-800">{fmt(scenario.creditLine)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Interest Rate</span>
          <span className="font-semibold text-gray-800">{scenario.interestRate != null ? `${Number(scenario.interestRate).toFixed(2)}%` : '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Draw Period</span>
          <span className="font-semibold text-gray-800">{scenario.drawPeriodYears ? `${scenario.drawPeriodYears} years` : '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Monthly Payment</span>
          <span className="font-semibold text-gray-800">{fmt(scenario.monthlyPayment)}</span>
        </div>
      </div>
    </button>
  )
}

export default function CounterOfferPanel({ appId, status }) {
  const [offer, setOffer]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    getCounterOffer(appId)
      .then(data => {
        setOffer(data)
        if (data?.scenarios?.length > 0) setSelected(data.scenarios[0].id)
      })
      .catch(() => setOffer(null))
      .finally(() => setLoading(false))
  }, [appId])

  if (loading) return null
  if (!offer && status === 'DENIED') {
    return (
      <div className="my-4 bg-red-50 border border-red-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">Adverse Action Notice</h3>
        <p className="text-sm text-red-600 mb-3">
          Your HELOC application was declined. You are entitled to a copy of the Adverse Action Notice.
        </p>
        <a
          href={getAdverseActionNoticeUrl(appId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800 underline"
        >
          Download Adverse Action Notice (PDF)
        </a>
      </div>
    )
  }

  if (!offer || !offer.scenarios?.length) return null

  return (
    <div className="my-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Counter-Offer Options</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {offer.primaryDenialType
              ? `Denial reason: ${offer.primaryDenialType.replace(/_/g, ' ')}`
              : 'Alternative HELOC scenarios based on your credit profile'}
          </p>
        </div>
        {status === 'DENIED' && (
          <a
            href={getAdverseActionNoticeUrl(appId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Adverse Action Notice
          </a>
        )}
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {offer.scenarios.map(s => (
          <ScenarioCard key={s.id} scenario={s} selected={selected} onSelect={setSelected} />
        ))}
      </div>
    </div>
  )
}
