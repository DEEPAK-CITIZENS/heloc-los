import { useState } from 'react'
import { runUnderwriting, getUnderwritingResult } from '../api/helocApi'

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
  creditScore: '',
  dti: '',
  cltv: '',
}

function cashflowColor(score) {
  if (score >= 750) return 'text-green-600'
  if (score >= 650) return 'text-yellow-600'
  return 'text-red-600'
}

function cashflowLabel(score) {
  if (score >= 750) return 'Strong'
  if (score >= 650) return 'Adequate'
  return 'Weak'
}

export default function UnderwritingPage() {
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
        creditScore: parseInt(input.creditScore) || 0,
        dti: parseFloat(input.dti) || 0,
        cltv: parseFloat(input.cltv) || 0,
      }
      const data = await runUnderwriting(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Underwriting failed')
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
      const data = await getUnderwritingResult(lookupId.trim())
      setLookupResult(data)
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Not found')
    } finally {
      setLookupLoading(false)
    }
  }

  function ResultCard({ data, title }) {
    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-citizens-navy mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Cashflow Score</p>
            <p className={`text-2xl font-bold ${cashflowColor(data.cashflowScore || 0)}`}>{data.cashflowScore ?? '—'}</p>
            <p className={`text-xs ${cashflowColor(data.cashflowScore || 0)}`}>{data.cashflowScore ? cashflowLabel(data.cashflowScore) : ''}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Monthly Income</p>
            <p className="text-2xl font-bold text-citizens-navy">${(data.monthlyIncome || 0).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Income Verified</p>
            <p className={`text-2xl font-bold ${data.incomeVerified ? 'text-green-600' : 'text-red-600'}`}>
              {data.incomeVerified ? 'Yes' : 'No'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Stability Score</p>
            <p className="text-2xl font-bold text-citizens-navy">{data.stabilityScore ?? '—'}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            data.recommendation === 'APPROVE' ? 'bg-green-100 text-green-700' :
            data.recommendation === 'DECLINE' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {data.recommendation || 'PENDING'}
          </span>
        </div>
        {data.underwroteAt && (
          <p className="text-xs text-gray-400 mt-2">Underwrote at: {new Date(data.underwroteAt).toLocaleString()}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-citizens-navy">Underwriting Service</h1>
        <p className="text-gray-500 mt-1">Port 9093 · Performs cashflow analysis and risk assessment for HELOC applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Run Underwriting */}
        <div className="card p-6">
          <h2 className="section-label">Run Underwriting</h2>
          <p className="text-sm text-gray-500 mb-4">POST /underwriting</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={input.applicationId} onChange={set('applicationId')} />
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="First Name" value={input.firstName} onChange={set('firstName')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Last Name" value={input.lastName} onChange={set('lastName')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="SSN" value={input.ssn} onChange={set('ssn')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Annual Income" type="number" value={input.annualIncome} onChange={set('annualIncome')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Credit Score" type="number" value={input.creditScore} onChange={set('creditScore')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="DTI %" type="number" step="0.1" value={input.dti} onChange={set('dti')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="CLTV %" type="number" step="0.1" value={input.cltv} onChange={set('cltv')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Property Value" type="number" value={input.estimatedPropertyValue} onChange={set('estimatedPropertyValue')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Requested Credit Line" type="number" value={input.requestedCreditLine} onChange={set('requestedCreditLine')} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Underwriting…' : 'Run Underwriting'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {result && <ResultCard data={result} title="Underwriting Result" />}
        </div>

        {/* Lookup Result */}
        <div className="card p-6">
          <h2 className="section-label">Lookup Underwriting Result</h2>
          <p className="text-sm text-gray-500 mb-4">GET /underwriting/{'{applicationId}'}</p>
          <form onSubmit={handleLookup} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <button type="submit" disabled={lookupLoading} className="btn-secondary w-full">
              {lookupLoading ? 'Looking up…' : 'Lookup Result'}
            </button>
          </form>
          {lookupError && <p className="text-red-600 text-sm mt-3">{lookupError}</p>}
          {lookupResult && <ResultCard data={lookupResult} title="Stored Result" />}

          <div className="mt-8 p-4 bg-citizens-green-pale rounded-lg">
            <h3 className="text-sm font-semibold text-citizens-navy mb-2">Underwriting Criteria</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Cashflow Score ≥ 750:</strong> Strong — auto-approve likely</li>
              <li>• <strong>Cashflow Score 650–749:</strong> Adequate — may need review</li>
              <li>• <strong>Cashflow Score &lt; 650:</strong> Weak — likely decline or manual review</li>
              <li>• Income verification compares stated vs. bank-verified income</li>
              <li>• Stability score considers employment tenure and payment history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
