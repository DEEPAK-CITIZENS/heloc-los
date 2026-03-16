import { useState } from 'react'
import { runCreditDecision, getCreditDecision } from '../api/helocApi'
import LoadingSpinner from '../components/LoadingSpinner'

const INITIAL_INPUT = {
  applicationId: '',
  firstName: '',
  lastName: '',
  ssn: '',
  annualIncome: '',
  monthlyHousingPayment: '',
  employmentType: 'EMPLOYED',
  propertyType: 'PRIMARY_RESIDENCE',
  estimatedPropertyValue: '',
  currentMortgageBalance: '',
  requestedCreditLine: '',
  drawPeriodYears: 10,
  repaymentPeriodYears: 20,
}

const SSN_PROFILES = [
  { ssn: '555-55-5555', score: 800, label: 'Excellent (800)' },
  { ssn: '444-44-4444', score: 740, label: 'Good (740)' },
  { ssn: '333-33-3333', score: 700, label: 'Fair-Good (700)' },
  { ssn: '222-22-2222', score: 650, label: 'Fair (650)' },
  { ssn: '111-11-1111', score: 620, label: 'Below Avg (620)' },
  { ssn: '000-00-0000', score: 580, label: 'Poor (580)' },
]

function scoreColor(score) {
  if (score >= 740) return 'text-green-600'
  if (score >= 670) return 'text-yellow-600'
  return 'text-red-600'
}

function dtiColor(dti) {
  if (dti < 30) return 'text-green-600'
  if (dti < 43) return 'text-yellow-600'
  return 'text-red-600'
}

function cltvColor(cltv) {
  if (cltv < 80) return 'text-green-600'
  if (cltv < 90) return 'text-yellow-600'
  return 'text-red-600'
}

export default function CreditDecisioningPage() {
  const [input, setInput] = useState(INITIAL_INPUT)
  const [result, setResult] = useState(null)
  const [lookupId, setLookupId] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [lookupError, setLookupError] = useState('')

  const set = (k) => (e) => setInput({ ...input, [k]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const payload = {
        ...input,
        annualIncome: parseFloat(input.annualIncome) || 0,
        monthlyHousingPayment: parseFloat(input.monthlyHousingPayment) || 0,
        estimatedPropertyValue: parseFloat(input.estimatedPropertyValue) || 0,
        currentMortgageBalance: parseFloat(input.currentMortgageBalance) || 0,
        requestedCreditLine: parseFloat(input.requestedCreditLine) || 0,
        drawPeriodYears: parseInt(input.drawPeriodYears),
        repaymentPeriodYears: parseInt(input.repaymentPeriodYears),
      }
      const data = await runCreditDecision(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Credit decision failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLookup(e) {
    e.preventDefault()
    if (!lookupId.trim()) return
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const data = await getCreditDecision(lookupId.trim())
      setLookupResult(data)
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Not found')
    } finally {
      setLookupLoading(false)
    }
  }

  function DecisionCard({ data, title }) {
    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-citizens-navy mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Credit Score</p>
            <p className={`text-2xl font-bold ${scoreColor(data.creditScore)}`}>{data.creditScore ?? '—'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">DTI Ratio</p>
            <p className={`text-2xl font-bold ${dtiColor(data.dti)}`}>{data.dti != null ? `${data.dti}%` : '—'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">CLTV Ratio</p>
            <p className={`text-2xl font-bold ${cltvColor(data.ltv ?? data.cltv)}`}>{data.ltv != null ? `${data.ltv}%` : data.cltv != null ? `${data.cltv}%` : '—'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
            <p className="text-2xl font-bold text-citizens-navy">{data.interestRate != null ? `${data.interestRate}%` : '—'}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            data.decision === 'APPROVED' ? 'bg-green-100 text-green-700' :
            data.decision === 'DENIED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {data.decision || 'PENDING'}
          </span>
          {data.decisionReason && (
            <span className="text-sm text-gray-600">{data.decisionReason}</span>
          )}
        </div>
        {data.decidedAt && (
          <p className="text-xs text-gray-400 mt-2">Decided at: {new Date(data.decidedAt).toLocaleString()}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-citizens-navy">Credit Decisioning Service</h1>
        <p className="text-gray-500 mt-1">Port 9091 · Evaluates credit risk and generates lending decisions for HELOC applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Run Credit Decision */}
        <div className="card p-6">
          <h2 className="section-label">Run Credit Decision</h2>
          <p className="text-sm text-gray-500 mb-4">POST /credit-decision</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Application ID (UUID)" value={input.applicationId} onChange={set('applicationId')} />
              <select className="border rounded px-3 py-2 text-sm" value={input.ssn} onChange={set('ssn')}>
                <option value="">Select SSN Profile...</option>
                {SSN_PROFILES.map(p => (
                  <option key={p.ssn} value={p.ssn}>{p.ssn} — {p.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="First Name" value={input.firstName} onChange={set('firstName')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Last Name" value={input.lastName} onChange={set('lastName')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Annual Income" type="number" value={input.annualIncome} onChange={set('annualIncome')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Monthly Housing Payment" type="number" value={input.monthlyHousingPayment} onChange={set('monthlyHousingPayment')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Estimated Property Value" type="number" value={input.estimatedPropertyValue} onChange={set('estimatedPropertyValue')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Current Mortgage Balance" type="number" value={input.currentMortgageBalance} onChange={set('currentMortgageBalance')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Requested Credit Line" type="number" value={input.requestedCreditLine} onChange={set('requestedCreditLine')} />
              <select className="border rounded px-3 py-2 text-sm" value={input.employmentType} onChange={set('employmentType')}>
                <option value="EMPLOYED">Employed</option>
                <option value="SELF_EMPLOYED">Self-Employed</option>
                <option value="RETIRED">Retired</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Processing…' : 'Run Credit Decision'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {result && <DecisionCard data={result} title="Decision Result" />}
        </div>

        {/* Lookup Credit Decision */}
        <div className="card p-6">
          <h2 className="section-label">Lookup Credit Decision</h2>
          <p className="text-sm text-gray-500 mb-4">GET /credit-decision/{'{applicationId}'}</p>
          <form onSubmit={handleLookup} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <button type="submit" disabled={lookupLoading} className="btn-secondary w-full">
              {lookupLoading ? 'Looking up…' : 'Lookup Decision'}
            </button>
          </form>
          {lookupError && <p className="text-red-600 text-sm mt-3">{lookupError}</p>}
          {lookupResult && <DecisionCard data={lookupResult} title="Stored Decision" />}

          <div className="mt-8 p-4 bg-citizens-green-pale rounded-lg">
            <h3 className="text-sm font-semibold text-citizens-navy mb-2">Test SSN Profiles</h3>
            <div className="space-y-1">
              {SSN_PROFILES.map(p => (
                <div key={p.ssn} className="flex justify-between text-xs">
                  <span className="font-mono">{p.ssn}</span>
                  <span className={scoreColor(p.score)}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
