import { useState } from 'react'
import { initiateLienRecording, getLienRecording } from '../api/helocApi'

const STEPS = [
  { key: 'PENDING',             label: 'Lien Request Submitted',   icon: '\u{1F4CB}' },
  { key: 'TITLE_SEARCH',       label: 'Title Search Complete',     icon: '\u{1F50D}' },
  { key: 'LIEN_FILED',         label: 'Lien Filed with County',    icon: '\u{1F4C4}' },
  { key: 'CLOSING_DISCLOSURE', label: 'Closing Disclosure Sent',   icon: '\u{1F4DD}' },
  { key: 'COMPLETED',          label: 'HELOC Active',              icon: '\u{2705}' },
]

const INITIAL_INPUT = {
  applicationId: '',
  helocAccountNumber: '',
  propertyAddress: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
  borrowerName: '',
  borrowerAddress: '',
  creditLineAmount: '',
}

export default function LienRecordingServicePage() {
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
        creditLineAmount: parseFloat(input.creditLineAmount) || 0,
      }
      const data = await initiateLienRecording(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lien recording failed')
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
      const data = await getLienRecording(lookupId.trim())
      setLookupResult(data)
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Not found')
    } finally {
      setLookupLoading(false)
    }
  }

  function getStepIndex(status) {
    const idx = STEPS.findIndex(s => s.key === status)
    return idx >= 0 ? idx : 0
  }

  function RecordingCard({ data, title }) {
    const currentStep = getStepIndex(data.status)
    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-citizens-navy mb-4">{title}</h3>

        {/* Step tracker */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, i) => {
            const done = i <= currentStep
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  done ? 'bg-citizens-green text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <p className={`text-xs mt-1 text-center ${done ? 'text-citizens-green font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-full mt-1 ${i < currentStep ? 'bg-citizens-green' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Recording Number</p>
            <p className="font-mono font-medium">{data.recordingNumber || data.countyRecordingNumber || '—'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Status</p>
            <p className="font-medium">{data.status || 'PENDING'}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Property</p>
            <p className="text-sm">{data.propertyAddress || '—'}, {data.propertyCity || ''} {data.propertyState || ''}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Credit Line</p>
            <p className="font-medium">${(data.creditLineAmount || 0).toLocaleString()}</p>
          </div>
        </div>
        {data.initiatedAt && (
          <p className="text-xs text-gray-400 mt-3">Initiated: {new Date(data.initiatedAt).toLocaleString()}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-citizens-navy">Lien Recording Service</h1>
        <p className="text-gray-500 mt-1">Port 9095 · Manages property lien recording with county recorder offices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Initiate Lien Recording */}
        <div className="card p-6">
          <h2 className="section-label">Initiate Lien Recording</h2>
          <p className="text-sm text-gray-500 mb-4">POST /lien-recording</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Application ID" value={input.applicationId} onChange={set('applicationId')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="HELOC Account #" value={input.helocAccountNumber} onChange={set('helocAccountNumber')} />
            </div>
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Property Address" value={input.propertyAddress} onChange={set('propertyAddress')} />
            <div className="grid grid-cols-3 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="City" value={input.propertyCity} onChange={set('propertyCity')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="State" value={input.propertyState} onChange={set('propertyState')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="ZIP" value={input.propertyZip} onChange={set('propertyZip')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Borrower Name" value={input.borrowerName} onChange={set('borrowerName')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Credit Line Amount" type="number" value={input.creditLineAmount} onChange={set('creditLineAmount')} />
            </div>
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Borrower Address" value={input.borrowerAddress} onChange={set('borrowerAddress')} />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Recording…' : 'Initiate Lien Recording'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {result && <RecordingCard data={result} title="Lien Recording Initiated" />}
        </div>

        {/* Lookup Lien Recording */}
        <div className="card p-6">
          <h2 className="section-label">Lookup Lien Recording</h2>
          <p className="text-sm text-gray-500 mb-4">GET /lien-recording/application/{'{applicationId}'}</p>
          <form onSubmit={handleLookup} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <button type="submit" disabled={lookupLoading} className="btn-secondary w-full">
              {lookupLoading ? 'Looking up…' : 'Lookup Recording'}
            </button>
          </form>
          {lookupError && <p className="text-red-600 text-sm mt-3">{lookupError}</p>}
          {lookupResult && <RecordingCard data={lookupResult} title="Stored Recording" />}

          <div className="mt-8 p-4 bg-citizens-green-pale rounded-lg">
            <h3 className="text-sm font-semibold text-citizens-navy mb-2">Lien Recording Process</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Lien recording secures Citizens' interest in the property</li>
              <li>• Title search verifies no competing liens or encumbrances</li>
              <li>• Lien is filed with the county recorder's office</li>
              <li>• Closing disclosure is sent per TRID requirements</li>
              <li>• HELOC becomes active after successful recording</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
