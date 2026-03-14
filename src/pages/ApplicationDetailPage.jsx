import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getApplication, reprocessApplication } from '../api/helocApi'
import StatusBadge from '../components/StatusBadge'
import PipelineTracker from '../components/PipelineTracker'
import LoadingSpinner from '../components/LoadingSpinner'
import PropertyImage from '../components/PropertyImage'
import DocumentUploadPanel from '../components/DocumentUploadPanel'
import LienRecordingPanel from '../components/LienRecordingPanel'
import CounterOfferPanel from '../components/CounterOfferPanel'
import ESignPanel from '../components/ESignPanel'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}
function fmtDate(val) {
  if (!val) return '\u2014'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreColor(val, thresholds) {
  if (val == null) return 'text-gray-400'
  if (val >= thresholds[0]) return 'text-green-600'
  if (val >= thresholds[1]) return 'text-yellow-600'
  return 'text-red-600'
}
function dtiColor(val)  { if (val == null) return 'text-gray-400'; return val < 30 ? 'text-green-600' : val < 43 ? 'text-yellow-600' : 'text-red-600' }
function cltvColor(val) { if (val == null) return 'text-gray-400'; return val < 80 ? 'text-green-600' : val < 90 ? 'text-yellow-600' : 'text-red-600' }

function MetricTile({ label, value, color, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${color ?? 'text-gray-800'}`}>{value ?? '\u2014'}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

function DecisionChip({ label, value }) {
  const colors = {
    APPROVED: 'bg-green-100 text-green-700', APPROVE: 'bg-green-100 text-green-700',
    DENIED: 'bg-red-100 text-red-700', DECLINE: 'bg-red-100 text-red-700',
    MANUAL_REVIEW: 'bg-yellow-100 text-yellow-700',
    BOOKED: 'bg-green-100 text-green-700',
    APPRAISED: 'bg-indigo-100 text-indigo-700',
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[value] ?? 'bg-gray-100 text-gray-600'}`}>
        {value ?? '\u2014'}
      </span>
    </div>
  )
}

function UnderwriterSummary({ app }) {
  const ap   = app.applicant
  const prop = app.propertyInfo

  return (
    <div className="bg-citizens-navy-light border border-citizens-navy rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-citizens-navy">Underwriter Summary</span>
          <span className="text-xs text-gray-400">&middot; {fmtDate(app.submittedAt)}</span>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricTile
          label="Credit Score"
          value={app.creditScore}
          color={scoreColor(app.creditScore, [740, 620])}
          sub={app.creditScore >= 740 ? 'Good\u2013Excellent' : app.creditScore >= 620 ? 'Fair' : 'Below Threshold'}
        />
        <MetricTile
          label="DTI Ratio"
          value={app.dti != null ? `${Number(app.dti).toFixed(1)}%` : null}
          color={dtiColor(app.dti)}
          sub={app.dti != null ? (app.dti < 30 ? 'Low risk' : app.dti < 43 ? 'Moderate' : 'High risk') : null}
        />
        <MetricTile
          label="CLTV Ratio"
          value={app.cltv != null ? `${Number(app.cltv).toFixed(1)}%` : null}
          color={cltvColor(app.cltv)}
          sub={app.cltv != null ? (app.cltv < 80 ? 'Low risk' : app.cltv < 90 ? 'Moderate' : 'High risk') : null}
        />
        <MetricTile
          label="Cashflow Score"
          value={app.cashflowScore}
          color={scoreColor(app.cashflowScore, [750, 650])}
          sub={app.cashflowScore != null ? (app.cashflowScore >= 750 ? 'Strong' : app.cashflowScore >= 650 ? 'Adequate' : 'Weak') : null}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Applicant</p>
          <p className="font-semibold text-gray-800">{ap ? `${ap.firstName} ${ap.lastName}` : '\u2014'}</p>
          <p className="text-gray-500">{ap?.employmentType?.replace(/_/g, ' ')} {ap?.employerName ? `\u00b7 ${ap.employerName}` : ''}</p>
          <p className="text-gray-600">Income: <span className="font-medium text-gray-800">{fmt(ap?.annualIncome)}/yr</span></p>
          <p className="text-gray-600">Housing: <span className="font-medium text-gray-800">{fmt(ap?.monthlyHousingPayment)}/mo</span></p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">HELOC Request</p>
          <p className="font-semibold text-gray-800">{fmt(app.requestedCreditLine)} <span className="font-normal text-gray-500">credit line</span></p>
          <p className="text-gray-600">Draw: <span className="font-medium text-gray-800">{app.drawPeriodYears} years</span></p>
          <p className="text-gray-600">Repayment: <span className="font-medium text-gray-800">{app.repaymentPeriodYears} years</span></p>
          {app.interestRate != null && <p className="text-gray-600">Rate: <span className="font-medium text-gray-800">{Number(app.interestRate).toFixed(2)}%</span></p>}
          {app.monthlyPayment != null && <p className="text-gray-600">Payment: <span className="font-medium text-gray-800">{fmt(app.monthlyPayment)}/mo</span></p>}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Property</p>
          {prop ? (
            <>
              <p className="font-semibold text-gray-800">{prop.propertyAddress}</p>
              <p className="text-gray-500">{prop.propertyCity}, {prop.propertyState} {prop.propertyZip}</p>
              <p className="text-gray-600">Type: <span className="font-medium text-gray-800">{prop.propertyType?.replace(/_/g, ' ')}</span></p>
              <p className="text-gray-600">Value: <span className="font-medium text-gray-800">{fmt(prop.estimatedPropertyValue)}</span></p>
              <p className="text-gray-600">Mortgage: <span className="font-medium text-gray-800">{fmt(prop.currentMortgageBalance)}</span></p>
            </>
          ) : <p className="text-gray-400">No property data</p>}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Decision Trail</p>
        <div className="flex items-center gap-2">
          <DecisionChip label="Credit" value={app.creditDecisionType} />
          {app.appraisedValue != null && <>
            <span className="text-gray-300 text-lg">&rarr;</span>
            <DecisionChip label="Appraisal" value="APPRAISED" />
          </>}
          {app.underwritingRecommendation && <>
            <span className="text-gray-300 text-lg">&rarr;</span>
            <DecisionChip label="Underwriting" value={app.underwritingRecommendation} />
          </>}
          {app.helocAccountNumber && <>
            <span className="text-gray-300 text-lg">&rarr;</span>
            <DecisionChip label="Booking" value="BOOKED" />
          </>}
          <span className="flex-1" />
          {app.decisionReason && (
            <p className="text-xs text-gray-500 italic max-w-xs text-right">{app.decisionReason}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{title}</h3>
      {children}
    </div>
  )
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value ?? '\u2014'}</span>
    </div>
  )
}

const SSN_OPTIONS = [
  { ssn: '555-55-5555', score: 800, label: 'Excellent',  outcome: 'Approve',       color: 'text-green-700' },
  { ssn: '444-44-4444', score: 740, label: 'Good',       outcome: 'Approve',       color: 'text-green-700' },
  { ssn: '333-33-3333', score: 700, label: 'Fair',       outcome: 'Likely Approve', color: 'text-citizens-green' },
  { ssn: '222-22-2222', score: 650, label: 'Below Avg',  outcome: 'Manual Review', color: 'text-yellow-700' },
  { ssn: '111-11-1111', score: 620, label: 'Poor',       outcome: 'Manual Review', color: 'text-yellow-700' },
  { ssn: '000-00-0000', score: 580, label: 'Very Poor',  outcome: 'Decline',       color: 'text-red-700' },
]

function ReprocessPanel({ appId, onComplete }) {
  const [selectedSsn, setSelectedSsn] = useState(SSN_OPTIONS[0].ssn)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const updated = await reprocessApplication(appId, selectedSsn)
      onComplete(updated)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Reprocess failed.')
      setLoading(false)
    }
  }

  return (
    <div className="my-4 bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-4">
      <h3 className="text-yellow-800 font-bold text-base mb-1">Override Decision</h3>
      <p className="text-yellow-700 text-sm mb-4">
        Select a credit profile to re-run the pipeline and resolve this application.
      </p>
      {error && (
        <div className="mb-3 bg-red-50 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2">
          {SSN_OPTIONS.map(opt => (
            <label key={opt.ssn} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${selectedSsn === opt.ssn ? 'border-yellow-400 bg-yellow-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <input
                type="radio"
                name="ssn"
                value={opt.ssn}
                checked={selectedSsn === opt.ssn}
                onChange={() => setSelectedSsn(opt.ssn)}
                className="accent-yellow-500"
              />
              <div className="flex-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Score <span className="font-bold text-gray-900">{opt.score}</span>
                  <span className="ml-2 text-gray-400 font-normal">({opt.label})</span>
                </span>
                <span className={`font-semibold ${opt.color}`}>{opt.outcome}</span>
              </div>
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="self-end bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition">
          {loading ? 'Processing\u2026' : 'Re-run Pipeline \u2192'}
        </button>
      </form>
    </div>
  )
}

function OutcomeBanner({ app }) {
  if (app.status === 'BOOKED') return (
    <div className="my-4 bg-green-50 border border-green-300 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-green-500 text-xl mt-0.5 font-bold">&check;</span>
      <div>
        <p className="text-green-800 font-bold text-base">HELOC Approved & Activated</p>
        <p className="text-green-700 text-sm mt-0.5">
          Your HELOC has been approved and activated.
          {app.helocAccountNumber ? ` Account: ${app.helocAccountNumber}.` : ''}
          {app.monthlyPayment ? ` Monthly payment: ${fmt(app.monthlyPayment)}.` : ''}
        </p>
      </div>
    </div>
  )
  if (app.status === 'DENIED') return (
    <div className="my-4 bg-red-50 border border-red-300 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-red-500 text-xl mt-0.5 font-bold">&times;</span>
      <div>
        <p className="text-red-800 font-bold text-base">HELOC Application Declined</p>
        <p className="text-red-700 text-sm mt-0.5">
          {app.decisionReason ?? 'This application did not meet our HELOC lending criteria.'}
        </p>
      </div>
    </div>
  )
  if (app.status === 'MANUAL_REVIEW') return (
    <div className="my-4 bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-yellow-500 text-xl mt-0.5 font-bold">!</span>
      <div>
        <p className="text-yellow-800 font-bold text-base">Under Manual Review</p>
        <p className="text-yellow-700 text-sm mt-0.5">
          This application has been flagged for manual review by our underwriting team. You will be contacted shortly.
        </p>
      </div>
    </div>
  )
  return null
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getApplication(id)
      .then(setApp)
      .catch(err => setError(err.response?.data?.message ?? err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner message="Loading application\u2026" />
  if (error) return <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
  if (!app) return null

  const ap   = app.applicant
  const prop = app.propertyInfo

  const hasCreditData    = app.creditScore != null
  const hasAppraisalData = app.appraisedValue != null
  const hasUwData        = app.cashflowScore != null
  const hasBookingData   = app.helocAccountNumber != null

  return (
    <div>
      <Link to="/applications" className="text-sm text-citizens-green hover:underline mb-4 inline-block">&larr; All Applications</Link>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {ap ? `${ap.firstName} ${ap.lastName}` : 'Application'}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5 font-mono">{id}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={app.status} />
          <span className="text-xs text-gray-400">{fmtDate(app.submittedAt)}</span>
        </div>
      </div>

      <OutcomeBanner app={app} />

      {(app.status === 'MANUAL_REVIEW' || app.status === 'DENIED') && (
        <ReprocessPanel appId={app.id} onComplete={setApp} />
      )}

      {(app.status === 'DENIED' || app.status === 'MANUAL_REVIEW') && (
        <CounterOfferPanel appId={app.id} status={app.status} />
      )}

      {app.status === 'MANUAL_REVIEW' && <DocumentUploadPanel appId={app.id} applicant={app.applicant} />}

      {app.status === 'BOOKED' && <ESignPanel appId={app.id} />}
      {app.status === 'BOOKED' && <LienRecordingPanel app={app} />}

      <PipelineTracker status={app.status} banked={hasAppraisalData} />

      {hasCreditData && <UnderwriterSummary app={app} />}

      <div className="grid grid-cols-2 gap-4 mb-6">
        {hasCreditData && (
          <Card title="Credit Decision">
            <Row label="Credit Score" value={app.creditScore} />
            <Row label="DTI" value={app.dti != null ? `${Number(app.dti).toFixed(1)}%` : '\u2014'} />
            <Row label="CLTV" value={app.cltv != null ? `${Number(app.cltv).toFixed(1)}%` : '\u2014'} />
            <Row label="Interest Rate" value={app.interestRate != null ? `${Number(app.interestRate).toFixed(2)}%` : '\u2014'} />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Decision:</span>
              <StatusBadge status={app.creditDecisionType} />
            </div>
          </Card>
        )}

        {hasAppraisalData && (
          <Card title="Property Appraisal">
            <Row label="Appraised Value" value={fmt(app.appraisedValue)} />
            <Row label="Appraisal Date" value={fmtDate(app.appraisalDate)} />
            <Row label="CLTV Ratio" value={app.cltv != null ? `${Number(app.cltv).toFixed(1)}%` : '\u2014'} />
            <Row label="Flood Zone" value={app.floodZoneStatus ?? 'N/A'} />
          </Card>
        )}

        {hasUwData && (
          <Card title="Underwriting">
            <Row label="Cashflow Score" value={app.cashflowScore} />
            <Row label="Recommendation" value={app.underwritingRecommendation} />
          </Card>
        )}

        {hasBookingData && (
          <Card title="HELOC Account">
            <Row label="HELOC Account #" value={app.helocAccountNumber} />
            <Row label="Credit Line" value={fmt(app.requestedCreditLine)} />
            <Row label="Monthly Payment" value={fmt(app.monthlyPayment)} />
            <Row label="Account Status" value={app.loanStatus ?? app.helocStatus} />
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ap && (
          <Card title="Applicant">
            <Row label="Name" value={`${ap.firstName} ${ap.lastName}`} />
            <Row label="DOB" value={fmtDate(ap.dob)} />
            <Row label="Email" value={ap.email} />
            <Row label="Phone" value={ap.phone} />
            <Row label="Employment" value={ap.employmentType?.replace(/_/g, ' ')} />
            <Row label="Annual Income" value={fmt(ap.annualIncome)} />
            <Row label="Monthly Housing" value={fmt(ap.monthlyHousingPayment)} />
          </Card>
        )}

        {prop && (
          <Card title="Property">
            <PropertyImage address={`${prop.propertyAddress}, ${prop.propertyCity}, ${prop.propertyState}`} />
            <Row label="Address" value={`${prop.propertyAddress}, ${prop.propertyCity}, ${prop.propertyState} ${prop.propertyZip}`} />
            <Row label="Type" value={prop.propertyType?.replace(/_/g, ' ')} />
            <Row label="Est. Value" value={fmt(prop.estimatedPropertyValue)} />
            <Row label="Mortgage Balance" value={fmt(prop.currentMortgageBalance)} />
            <Row label="Year Built" value={prop.yearBuilt} />
            <Row label="Sq Ft" value={prop.squareFootage?.toLocaleString()} />
          </Card>
        )}
      </div>

      <div className="mt-4 bg-citizens-green-light border border-citizens-green rounded-xl px-5 py-4 flex gap-8">
        <div>
          <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Credit Line</p>
          <p className="text-xl font-bold text-citizens-navy">{fmt(app.requestedCreditLine)}</p>
        </div>
        <div>
          <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Draw Period</p>
          <p className="text-xl font-bold text-citizens-navy">{app.drawPeriodYears ? `${app.drawPeriodYears} years` : '\u2014'}</p>
        </div>
        <div>
          <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Repayment Period</p>
          <p className="text-xl font-bold text-citizens-navy">{app.repaymentPeriodYears ? `${app.repaymentPeriodYears} years` : '\u2014'}</p>
        </div>
        {app.interestRate != null && (
          <div>
            <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Interest Rate</p>
            <p className="text-xl font-bold text-citizens-navy">{Number(app.interestRate).toFixed(2)}%</p>
          </div>
        )}
      </div>
    </div>
  )
}
