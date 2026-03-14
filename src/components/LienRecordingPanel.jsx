import { useState, useEffect } from 'react'
import { initiateLienRecording, getLienRecording } from '../api/helocApi'

const STEPS = [
  { key: 'PENDING',             label: 'Lien Request Submitted',   icon: '\ud83d\udccb' },
  { key: 'TITLE_SEARCH',       label: 'Title Search Complete',     icon: '\ud83d\udd0d' },
  { key: 'LIEN_FILED',         label: 'Lien Filed with County',    icon: '\ud83d\udcc4' },
  { key: 'CLOSING_DISCLOSURE', label: 'Closing Disclosure Sent',   icon: '\ud83d\udcdd' },
  { key: 'COMPLETED',          label: 'HELOC Active',              icon: '\u2705' },
]

function stepIndex(status) {
  const idx = STEPS.findIndex(s => s.key === status)
  return idx >= 0 ? idx : -1
}

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function fmtDate(val) {
  if (!val) return '\u2014'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LienRecordingPanel({ app }) {
  const [recording, setRecording] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [initiating, setInitiating] = useState(false)
  const [error, setError]         = useState(null)

  const ap = app.applicant

  useEffect(() => {
    setLoading(true)
    getLienRecording(app.id)
      .then(setRecording)
      .catch(() => setRecording(null))
      .finally(() => setLoading(false))
  }, [app.id])

  async function handleInitiate() {
    setError(null)
    setInitiating(true)
    try {
      const payload = {
        applicationId: app.id,
        helocAccountNumber: app.helocAccountNumber,
        propertyAddress: app.propertyInfo?.propertyAddress,
        propertyCity: app.propertyInfo?.propertyCity,
        propertyState: app.propertyInfo?.propertyState,
        propertyZip: app.propertyInfo?.propertyZip,
        borrowerName: ap ? `${ap.firstName} ${ap.lastName}` : '',
        borrowerAddress: ap?.address ?? '',
        creditLineAmount: app.requestedCreditLine,
      }
      const result = await initiateLienRecording(payload)
      setRecording(result)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to initiate lien recording.')
    } finally {
      setInitiating(false)
    }
  }

  async function handleRefresh() {
    try {
      const updated = await getLienRecording(app.id)
      setRecording(updated)
    } catch { /* ignore */ }
  }

  if (loading) return null

  const currentIdx = recording ? stepIndex(recording.status) : -1

  return (
    <div className="my-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Lien Recording
        </h3>
        {recording && (
          <button onClick={handleRefresh} className="text-xs text-citizens-green hover:underline">
            Refresh Status
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}

      {!recording ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Initiate lien recording to secure the HELOC against the property. This will file a lien
            with the county recorder and send closing disclosures.
          </p>
          <button
            onClick={handleInitiate}
            disabled={initiating}
            className="btn-primary disabled:opacity-50"
          >
            {initiating ? 'Initiating...' : 'Initiate Lien Recording'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Step progress */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const done    = i <= currentIdx
              const current = i === currentIdx
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${done
                      ? current
                        ? 'bg-citizens-green text-white'
                        : 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                    <span>{step.icon}</span>
                    <span className="hidden md:inline">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 h-0.5 mx-0.5 ${i < currentIdx ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Recording details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Recording Number</p>
              <p className="font-medium text-gray-800 font-mono">{recording.recordingNumber ?? recording.trackingNumber ?? '\u2014'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
              <p className="font-medium text-gray-800">{recording.status?.replace(/_/g, ' ') ?? '\u2014'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Property</p>
              <p className="font-medium text-gray-800">
                {recording.propertyAddress ?? app.propertyInfo?.propertyAddress ?? '\u2014'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Credit Line</p>
              <p className="font-medium text-gray-800">{fmt(recording.creditLineAmount ?? app.requestedCreditLine)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Initiated</p>
              <p className="font-medium text-gray-800">{fmtDate(recording.initiatedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">HELOC Account</p>
              <p className="font-medium text-gray-800 font-mono">{recording.helocAccountNumber ?? app.helocAccountNumber ?? '\u2014'}</p>
            </div>
          </div>

          {/* Available credit summary */}
          {recording.status === 'COMPLETED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-green-800 font-semibold text-sm">HELOC is now active</p>
              <p className="text-green-700 text-xs mt-0.5">
                The lien has been recorded with the county. Your credit line of {fmt(app.requestedCreditLine)} is available for draw.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
