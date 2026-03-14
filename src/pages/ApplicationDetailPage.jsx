import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getApplication, reprocessApplication } from '../api/helocApi'
import PipelineTracker from '../components/PipelineTracker'
import StatusBadge from '../components/StatusBadge'
import DocumentUploadPanel from '../components/DocumentUploadPanel'
import LienRecordingPanel from '../components/LienRecordingPanel'
import ESignPanel from '../components/ESignPanel'
import CounterOfferPanel from '../components/CounterOfferPanel'
import LoadingSpinner from '../components/LoadingSpinner'

const dtiColor = v => (v == null ? 'text-gray-400' : v < 0.30 ? 'text-green-600' : v < 0.43 ? 'text-yellow-600' : 'text-red-600')
const ltvColor = v => (v == null ? 'text-gray-400' : v < 0.80 ? 'text-green-600' : v < 0.90 ? 'text-yellow-600' : 'text-red-600')
const scoreColor = v => (v == null ? 'text-gray-400' : v >= 740 ? 'text-green-600' : v >= 620 ? 'text-yellow-600' : 'text-red-600')
const cashflowColor = v => (v == null ? 'text-gray-400' : v >= 750 ? 'text-green-600' : v >= 650 ? 'text-yellow-600' : 'text-red-600')

function MetricTile({ label, value, fmt, colorFn }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorFn ? colorFn(value) : 'text-citizens-navy'}`}>
        {value != null ? (fmt ? fmt(value) : value) : '\u2014'}
      </p>
    </div>
  )
}

function DecisionChip({ label, type }) {
  const colors = {
    APPROVED: 'bg-green-100 text-green-700', APPROVE: 'bg-green-100 text-green-700',
    DENIED: 'bg-red-100 text-red-700', DECLINE: 'bg-red-100 text-red-700',
    MANUAL_REVIEW: 'bg-yellow-100 text-yellow-700'
  }
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
      {label}: {type || '\u2014'}
    </span>
  )
}

const SSN_OPTIONS = [
  { ssn: '555-55-5555', label: 'Excellent (800)' },
  { ssn: '444-44-4444', label: 'Good (740)' },
  { ssn: '333-33-3333', label: 'Fair (700)' },
  { ssn: '222-22-2222', label: 'Below Avg (650)' },
  { ssn: '111-11-1111', label: 'Low (620)' },
  { ssn: '000-00-0000', label: 'Poor (580)' },
]

function ReprocessPanel({ appId, onReprocessed }) {
  const [ssn, setSsn] = useState(SSN_OPTIONS[0].ssn)
  const [loading, setLoading] = useState(false)

  async function handleReprocess() {
    setLoading(true)
    try {
      await reprocessApplication(appId, ssn)
      onReprocessed()
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div className="card p-5">
      <p className="section-label mb-3">Reprocess Application</p>
      <p className="text-sm text-gray-500 mb-3">Select a credit profile to re-run the pipeline:</p>
      <div className="flex gap-2 flex-wrap mb-3">
        {SSN_OPTIONS.map(o => (
          <button key={o.ssn} onClick={() => setSsn(o.ssn)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ssn === o.ssn ? 'bg-citizens-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {o.label}
          </button>
        ))}
      </div>
      <button onClick={handleReprocess} disabled={loading} className="btn-primary text-sm disabled:opacity-50">
        {loading ? 'Reprocessing\u2026' : 'Reprocess'}
      </button>
    </div>
  )
}

function OutcomeBanner({ app }) {
  if (app.status === 'BOOKED') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-bold text-green-800 mb-2">HELOC Approved &amp; Booked</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">Account #</span><br /><strong>{app.helocAccountNumber || app.loanAccountNumber || '\u2014'}</strong></div>
          <div><span className="text-gray-500">Credit Line</span><br /><strong>${Number(app.approvedCreditLine || app.requestedCreditLine || 0).toLocaleString()}</strong></div>
          <div><span className="text-gray-500">Monthly (IO)</span><br /><strong>${Number(app.interestOnlyPayment || app.monthlyPayment || 0).toLocaleString()}</strong></div>
        </div>
      </div>
    )
  }
  if (app.status === 'DENIED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-bold text-red-800 mb-1">Application Denied</h2>
        <p className="text-sm text-red-600">{app.decisionReason || 'The application did not meet underwriting criteria.'}</p>
      </div>
    )
  }
  if (app.status === 'MANUAL_REVIEW') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-bold text-yellow-800 mb-1">Manual Review Required</h2>
        <p className="text-sm text-yellow-700">This application requires additional documentation or underwriter review.</p>
      </div>
    )
  }
  return null
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getApplication(id)
      .then(data => { setApp(data); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="max-w-5xl mx-auto px-6 py-8 text-red-600">Error: {error}</div>
  if (!app) return null

  const prop = app.propertyInfo || {}

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-citizens-navy">
            {app.applicant?.firstName} {app.applicant?.lastName}
          </h1>
          <p className="text-sm text-gray-500">Application {app.id?.substring(0, 8)}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <PipelineTracker status={app.status} appraised={app.status === 'UNDERWRITING' || app.status === 'BOOKED'} />

      <OutcomeBanner app={app} />

      {/* Underwriter Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricTile label="Credit Score" value={app.creditScore} colorFn={scoreColor} />
        <MetricTile label="DTI" value={app.dti} fmt={v => `${(v * 100).toFixed(1)}%`} colorFn={dtiColor} />
        <MetricTile label="CLTV" value={app.cltv || app.ltv} fmt={v => `${(v * 100).toFixed(1)}%`} colorFn={ltvColor} />
        <MetricTile label="Cashflow Score" value={app.cashflowScore} colorFn={cashflowColor} />
      </div>

      {/* Decision Trail */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <DecisionChip label="Credit" type={app.creditDecisionType} />
        <DecisionChip label="Underwriting" type={app.underwritingRecommendation} />
      </div>

      {/* Applicant + Property Cards */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <p className="section-label mb-3">Applicant</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">Name</dt><dd className="font-medium">{app.applicant?.firstName} {app.applicant?.lastName}</dd>
            <dt className="text-gray-500">Email</dt><dd>{app.applicant?.email || '\u2014'}</dd>
            <dt className="text-gray-500">Phone</dt><dd>{app.applicant?.phone || '\u2014'}</dd>
            <dt className="text-gray-500">Employment</dt><dd>{app.applicant?.employmentType || '\u2014'}</dd>
            <dt className="text-gray-500">Income</dt><dd>${Number(app.applicant?.annualIncome || 0).toLocaleString()}/yr</dd>
            <dt className="text-gray-500">Housing</dt><dd>${Number(app.applicant?.monthlyHousingPayment || 0).toLocaleString()}/mo</dd>
          </dl>
        </div>

        <div className="card p-5">
          <p className="section-label mb-3">Property</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">Address</dt><dd className="font-medium">{prop.propertyAddress || '\u2014'}</dd>
            <dt className="text-gray-500">City/State</dt><dd>{prop.propertyCity}, {prop.propertyState} {prop.propertyZip}</dd>
            <dt className="text-gray-500">Type</dt><dd>{(prop.propertyType || '').replace(/_/g, ' ')}</dd>
            <dt className="text-gray-500">Value</dt><dd>${Number(prop.estimatedPropertyValue || 0).toLocaleString()}</dd>
            <dt className="text-gray-500">Mortgage</dt><dd>${Number(prop.currentMortgageBalance || 0).toLocaleString()}</dd>
            <dt className="text-gray-500">Sq Ft</dt><dd>{prop.squareFootage?.toLocaleString() || '\u2014'}</dd>
          </dl>
        </div>
      </div>

      {/* HELOC Details */}
      <div className="card p-5 mb-6">
        <p className="section-label mb-3">HELOC Details</p>
        <dl className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">Credit Line</dt><dd className="font-medium">${Number(app.requestedCreditLine || 0).toLocaleString()}</dd>
          <dt className="text-gray-500">Draw Period</dt><dd>{app.drawPeriodYears || '\u2014'} years</dd>
          <dt className="text-gray-500">Repayment</dt><dd>{app.repaymentPeriodYears || '\u2014'} years</dd>
          <dt className="text-gray-500">Intended Use</dt><dd>{(app.intendedUse || '').replace(/_/g, ' ')}</dd>
        </dl>
      </div>

      {/* Action Panels */}
      {app.status === 'BOOKED' && (
        <div className="space-y-6">
          <ESignPanel applicationId={app.id} />
          <LienRecordingPanel application={app} />
        </div>
      )}

      {app.status === 'DENIED' && (
        <div className="space-y-6">
          <CounterOfferPanel applicationId={app.id} />
          <ReprocessPanel appId={app.id} onReprocessed={load} />
        </div>
      )}

      {app.status === 'MANUAL_REVIEW' && (
        <div className="space-y-6">
          <DocumentUploadPanel applicationId={app.id} annualIncome={app.applicant?.annualIncome} />
          <ReprocessPanel appId={app.id} onReprocessed={load} />
        </div>
      )}
    </div>
  )
}
