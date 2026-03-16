import { useState, useEffect, useRef } from 'react'
import { sendForSigning, getEsignStatus } from '../api/helocApi'

export default function ESignServicePage() {
  const [applicationId, setApplicationId] = useState('')
  const [result, setResult] = useState(null)
  const [lookupId, setLookupId] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [polling, setPolling] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    if (!applicationId.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await sendForSigning(applicationId.trim())
      setResult(data)
      startPolling(applicationId.trim())
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send for signing')
    } finally {
      setLoading(false)
    }
  }

  function startPolling(appId) {
    setPolling(true)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const data = await getEsignStatus(appId)
        setResult(data)
        if (data.status === 'COMPLETED' || data.status === 'EXPIRED' || data.status === 'DECLINED') {
          clearInterval(pollRef.current)
          setPolling(false)
        }
      } catch {
        clearInterval(pollRef.current)
        setPolling(false)
      }
    }, 3000)
  }

  async function handleLookup(e) {
    e.preventDefault()
    if (!lookupId.trim()) return
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const data = await getEsignStatus(lookupId.trim())
      setLookupResult(data)
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Not found')
    } finally {
      setLookupLoading(false)
    }
  }

  function StatusCard({ data, title }) {
    const statusConfig = {
      PENDING:   { color: 'bg-yellow-100 text-yellow-700', icon: '\u{1F4E8}', label: 'Pending Signature' },
      SENT:      { color: 'bg-blue-100 text-blue-700',     icon: '\u{1F4E9}', label: 'Sent to Borrower' },
      VIEWED:    { color: 'bg-purple-100 text-purple-700', icon: '\u{1F440}', label: 'Viewed by Borrower' },
      COMPLETED: { color: 'bg-green-100 text-green-700',   icon: '\u{270D}\u{FE0F}',  label: 'Signed' },
      EXPIRED:   { color: 'bg-gray-100 text-gray-700',     icon: '\u{23F0}', label: 'Expired' },
      DECLINED:  { color: 'bg-red-100 text-red-700',       icon: '\u{274C}', label: 'Declined' },
    }
    const cfg = statusConfig[data.status] || statusConfig.PENDING

    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-citizens-navy mb-4">{title}</h3>
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-2">{cfg.icon}</div>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.signingToken && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Signing Token</p>
              <p className="font-mono text-sm truncate">{data.signingToken}</p>
            </div>
          )}
          {data.signingUrl && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Signing URL</p>
              <a href={data.signingUrl} target="_blank" rel="noopener noreferrer" className="text-citizens-green text-sm hover:underline truncate block">
                Open Signing Portal
              </a>
            </div>
          )}
          {data.documentCount != null && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Documents</p>
              <p className="font-medium">{data.documentCount} document(s)</p>
            </div>
          )}
          {data.signedAt && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Signed At</p>
              <p className="text-sm">{new Date(data.signedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        {data.documents && data.documents.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Documents</h4>
            <div className="space-y-2">
              {data.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span>{doc.name || doc.type}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    doc.signed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {doc.signed ? 'Signed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-citizens-navy">eSign Service</h1>
        <p className="text-gray-500 mt-1">Port 9098 · Manages electronic signature workflows for HELOC closing documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send for Signing */}
        <div className="card p-6">
          <h2 className="section-label">Send for Signing</h2>
          <p className="text-sm text-gray-500 mb-4">POST /esign/send</p>
          <form onSubmit={handleSend} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send for eSignature'}
            </button>
          </form>
          {polling && (
            <div className="mt-3 flex items-center gap-2 text-sm text-citizens-green">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Polling for signature status...
            </div>
          )}
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {result && <StatusCard data={result} title="eSign Status" />}
        </div>

        {/* Lookup eSign Status */}
        <div className="card p-6">
          <h2 className="section-label">Lookup eSign Status</h2>
          <p className="text-sm text-gray-500 mb-4">GET /esign/status/{'{applicationId}'}</p>
          <form onSubmit={handleLookup} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <button type="submit" disabled={lookupLoading} className="btn-secondary w-full">
              {lookupLoading ? 'Looking up…' : 'Lookup Status'}
            </button>
          </form>
          {lookupError && <p className="text-red-600 text-sm mt-3">{lookupError}</p>}
          {lookupResult && <StatusCard data={lookupResult} title="Stored eSign Status" />}

          <div className="mt-8 p-4 bg-citizens-green-pale rounded-lg">
            <h3 className="text-sm font-semibold text-citizens-navy mb-2">eSign Workflow</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Closing documents are generated and sent to the borrower</li>
              <li>• Borrower receives an email with a secure signing link</li>
              <li>• Documents include: HELOC Agreement, Truth in Lending, Right to Cancel</li>
              <li>• Signature status is polled automatically every 3 seconds</li>
              <li>• Signed documents are stored and accessible via the application detail</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
