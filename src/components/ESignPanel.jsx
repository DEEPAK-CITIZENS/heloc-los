import { useState, useEffect } from 'react'
import axios from 'axios'

const esignApi = axios.create({ baseURL: '/esign-api', headers: { 'Content-Type': 'application/json' } })

export default function ESignPanel({ applicationId }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!applicationId) return
    esignApi.get(`/esign/application/${applicationId}`)
      .then(r => setStatus(r.data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [applicationId])

  async function handleSend() {
    setSending(true)
    try {
      const { data } = await esignApi.post('/esign/send', { applicationId })
      setStatus(data)
    } catch { /* ignore */ }
    setSending(false)
  }

  useEffect(() => {
    if (!status || status.signingStatus === 'COMPLETED') return
    const interval = setInterval(() => {
      esignApi.get(`/esign/application/${applicationId}`)
        .then(r => {
          setStatus(r.data)
          if (r.data.signingStatus === 'COMPLETED') clearInterval(interval)
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [status?.signingStatus, applicationId])

  if (loading) return <div className="card p-5 text-sm text-gray-400">Loading e-sign status...</div>

  return (
    <div className="card p-5">
      <p className="section-label mb-3">E-Signature</p>

      {!status ? (
        <div>
          <p className="text-sm text-gray-500 mb-3">Send the HELOC agreement for electronic signature.</p>
          <button onClick={handleSend} disabled={sending} className="btn-primary text-sm disabled:opacity-50">
            {sending ? 'Sending\u2026' : 'Send for Signing'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status.signingStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              status.signingStatus === 'SENT' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {status.signingStatus || 'PENDING'}
            </span>
          </div>

          {status.signingToken && (
            <p className="text-xs text-gray-400">Token: {status.signingToken}</p>
          )}

          {status.signingStatus === 'COMPLETED' && status.signedDocumentUrl && (
            <a href={status.signedDocumentUrl} target="_blank" rel="noopener noreferrer"
              className="inline-block text-sm text-citizens-green hover:text-citizens-green-dark font-medium">
              View Signed Document &rarr;
            </a>
          )}

          {status.signingStatus === 'SENT' && (
            <p className="text-xs text-gray-400 animate-pulse">Waiting for borrower signature...</p>
          )}
        </div>
      )}
    </div>
  )
}
