import { useState } from 'react'
import { runOfacScreening, getOfacScreening } from '../api/helocApi'

const INITIAL_INPUT = {
  applicationId: '',
  firstName: '',
  lastName: '',
  dob: '',
  address: '',
  city: '',
  state: '',
  country: 'US',
}

export default function OfacScreeningPage() {
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
      const data = await runOfacScreening(input)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Screening failed')
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
      const data = await getOfacScreening(lookupId.trim())
      setLookupResult(data)
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Not found')
    } finally {
      setLookupLoading(false)
    }
  }

  function ScreeningCard({ data, title }) {
    const isFlagged = data.ofacStatus === 'FLAGGED_SDN' || data.status === 'FLAGGED_SDN'
    const isCleared = data.ofacStatus === 'CLEARED' || data.status === 'CLEARED'
    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-citizens-navy mb-4">{title}</h3>
        <div className={`p-6 rounded-lg text-center ${
          isFlagged ? 'bg-red-50 border-2 border-red-200' :
          isCleared ? 'bg-green-50 border-2 border-green-200' :
          'bg-gray-50 border-2 border-gray-200'
        }`}>
          <div className="text-4xl mb-2">
            {isFlagged ? '\u{1F6A8}' : isCleared ? '\u{2705}' : '\u{23F3}'}
          </div>
          <p className={`text-xl font-bold ${
            isFlagged ? 'text-red-700' : isCleared ? 'text-green-700' : 'text-gray-600'
          }`}>
            {isFlagged ? 'SDN MATCH FOUND' : isCleared ? 'CLEARED' : data.ofacStatus || data.status || 'PENDING'}
          </p>
          {isFlagged && (
            <p className="text-sm text-red-600 mt-2">
              Applicant name matched against OFAC Specially Designated Nationals list.
              Application must be escalated for compliance review.
            </p>
          )}
          {isCleared && (
            <p className="text-sm text-green-600 mt-2">
              No matches found on OFAC SDN list. Applicant is cleared to proceed.
            </p>
          )}
        </div>
        {data.matchScore != null && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Match Score</p>
            <p className="font-medium">{data.matchScore}%</p>
          </div>
        )}
        {data.screenedAt && (
          <p className="text-xs text-gray-400 mt-3">Screened: {new Date(data.screenedAt).toLocaleString()}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-citizens-navy">OFAC Screening Service</h1>
        <p className="text-gray-500 mt-1">Port 9096 · Screens applicants against the OFAC Specially Designated Nationals (SDN) list</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Run Screening */}
        <div className="card p-6">
          <h2 className="section-label">Run OFAC Screening</h2>
          <p className="text-sm text-gray-500 mb-4">POST /ofac-screening</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={input.applicationId} onChange={set('applicationId')} />
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="First Name" value={input.firstName} onChange={set('firstName')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Last Name" value={input.lastName} onChange={set('lastName')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Date of Birth" type="date" value={input.dob} onChange={set('dob')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Country" value={input.country} onChange={set('country')} />
            </div>
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Address" value={input.address} onChange={set('address')} />
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="City" value={input.city} onChange={set('city')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="State" value={input.state} onChange={set('state')} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Screening…' : 'Run OFAC Screening'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {result && <ScreeningCard data={result} title="Screening Result" />}
        </div>

        {/* Lookup Screening */}
        <div className="card p-6">
          <h2 className="section-label">Lookup Screening Result</h2>
          <p className="text-sm text-gray-500 mb-4">GET /ofac-screening/{'{applicationId}'}</p>
          <form onSubmit={handleLookup} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <button type="submit" disabled={lookupLoading} className="btn-secondary w-full">
              {lookupLoading ? 'Looking up…' : 'Lookup Screening'}
            </button>
          </form>
          {lookupError && <p className="text-red-600 text-sm mt-3">{lookupError}</p>}
          {lookupResult && <ScreeningCard data={lookupResult} title="Stored Screening" />}

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">OFAC Compliance</h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• OFAC screening is required by federal law for all financial transactions</li>
              <li>• SDN list contains individuals/entities with US economic sanctions</li>
              <li>• A match does NOT automatically deny the application</li>
              <li>• Flagged applications require manual compliance review</li>
              <li>• False positives are common and resolved through enhanced due diligence</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
