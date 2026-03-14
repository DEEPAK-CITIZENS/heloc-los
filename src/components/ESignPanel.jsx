import { useState, useEffect } from 'react'
import axios from 'axios'

const esignApi = axios.create({ baseURL: '/esign-api', headers: { 'Content-Type': 'application/json' } })

async function sendForSigning(applicationId) {
  const { data } = await esignApi.post('/esign/send', { applicationId })
  return data
}

async function getSigningStatus(applicationId) {
  const { data } = await esignApi.get(`/esign/status/${applicationId}`)
  return data
}

export default function ESignPanel({ appId }) {
  const [status, setStatus]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState(null)
  const [polling, setPolling]   = useState(false)

  useEffect(() => {
    setLoading(true)
    getSigningStatus(appId)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [appId])

  useEffect(() => {
    if (!polling || !status) return
    const timer = setInterval(async () => {
      try {
        const updated = await getSigningStatus(appId)
        setStatus(updated)
        if (updated?.status === 'COMPLETED' || updated?.status === 'DECLINED') {
          setPolling(false)
        }
      } catch { /* ignore polling errors */ }
    }, 3000)
    return () => clearInterval(timer)
  }, [polling, appId, status])

  async function handleSend() {
    setError(null)
    setSending(true)
    try {
      const result = await sendForSigning(appId)
      setStatus(result)
      setPolling(true)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to send for signing.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return null

  const isSigned = status?.status === 'COMPLETED'
  const isPending = status?.status === 'PENDING' || status?.status === 'SENT'

  return (
    <div className="my-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        E-Signature
      </h3>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}

      {isSigned ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-600 font-bold text-lg">&#10003;</span>
            <span className="text-green-800 font-semibold text-sm">Documents Signed</span>
          </div>
          <p className="text-green-700 text-xs">
            All HELOC closing documents have been signed electronically.
            {status.completedAt && ` Completed: ${new Date(status.completedAt).toLocaleString()}`}
          </p>
          {status.signingToken && (
            <p className="text-green-600 text-xs font-mono mt-1">Token: {status.signingToken}</p>
          )}
        </div>
      ) : isPending ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-yellow-800 font-semibold text-sm">Awaiting Signature</span>
          </div>
          <p className="text-yellow-700 text-xs">
            HELOC closing documents have been sent for e-signature. Waiting for borrower to sign.
          </p>
          {status.signingToken && (
            <p className="text-yellow-600 text-xs font-mono mt-1">Token: {status.signingToken}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={sending}
            className="btn-primary disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send for E-Signature'}
          </button>
          <span className="text-xs text-gray-400">
            Send HELOC closing documents for electronic signature
          </span>
        </div>
      )}
    </div>
  )
}
