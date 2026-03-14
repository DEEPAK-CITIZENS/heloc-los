import { useState, useEffect } from 'react'
import { initiateLienRecording, getLienRecording } from '../api/helocApi'

const STATUS_LABELS = {
  PENDING: 'Pending',
  SUBMITTED_TO_COUNTY: 'Submitted to County',
  LIEN_RECORDED: 'Lien Recorded',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUBMITTED_TO_COUNTY: 'bg-blue-100 text-blue-700',
  LIEN_RECORDED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
}

export default function LienRecordingPanel({ application }) {
  const [recording, setRecording] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initiating, setInitiating] = useState(false)

  useEffect(() => {
    if (!application?.id) return
    setLoading(true)
    getLienRecording(application.id)
      .then(data => setRecording(data))
      .catch(() => setRecording(null))
      .finally(() => setLoading(false))
  }, [application?.id])

  async function handleInitiate() {
    setInitiating(true)
    try {
      const payload = {
        applicationId: application.id,
        propertyAddress: application.propertyInfo?.propertyAddress,
        propertyCity: application.propertyInfo?.propertyCity,
        propertyState: application.propertyInfo?.propertyState,
        propertyZip: application.propertyInfo?.propertyZip,
        borrowerFirstName: application.applicant?.firstName,
        borrowerLastName: application.applicant?.lastName,
        creditLineAmount: application.requestedCreditLine || application.approvedCreditLine,
        existingMortgageBalance: application.propertyInfo?.currentMortgageBalance,
      }
      const result = await initiateLienRecording(payload)
      setRecording(result)
    } catch { /* ignore */ }
    setInitiating(false)
  }

  if (loading) return <div className="card p-5 text-sm text-gray-400">Loading lien recording status...</div>

  return (
    <div className="card p-5">
      <p className="section-label mb-3">Lien Recording</p>

      {!recording ? (
        <div>
          <p className="text-sm text-gray-500 mb-3">Initiate lien recording to file the HELOC lien with the county recorder.</p>
          <button onClick={handleInitiate} disabled={initiating} className="btn-primary text-sm disabled:opacity-50">
            {initiating ? 'Initiating\u2026' : 'Initiate Lien Recording'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[recording.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[recording.status] || recording.status}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {recording.recordingNumber && (
              <><dt className="text-gray-500">Recording #</dt><dd className="font-mono font-medium">{recording.recordingNumber}</dd></>
            )}
            {recording.countyName && (
              <><dt className="text-gray-500">County</dt><dd>{recording.countyName}</dd></>
            )}
            {recording.filedAt && (
              <><dt className="text-gray-500">Filed</dt><dd>{new Date(recording.filedAt).toLocaleDateString()}</dd></>
            )}
            {recording.estimatedCompletionDate && (
              <><dt className="text-gray-500">Est. Completion</dt><dd>{new Date(recording.estimatedCompletionDate).toLocaleDateString()}</dd></>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}
