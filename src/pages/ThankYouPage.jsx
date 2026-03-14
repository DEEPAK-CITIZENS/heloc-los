import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getApplication } from '../api/helocApi'
import LoadingSpinner from '../components/LoadingSpinner'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}
function fmtDate(val) {
  if (!val) return '\u2014'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const OUTCOMES = {
  BOOKED: {
    icon: '\ud83c\udf89',
    heading: 'Congratulations! Your HELOC has been approved and activated.',
    sub: 'Your HELOC account has been created and is now active. You can draw funds at any time.',
    bg: 'bg-green-50',
    border: 'border-green-300',
    headingColor: 'text-green-800',
    subColor: 'text-green-600',
  },
  DENIED: {
    icon: '\u2715',
    heading: "We're sorry \u2014 your HELOC application was declined.",
    sub: 'You may re-apply in the future with updated information.',
    bg: 'bg-red-50',
    border: 'border-red-300',
    headingColor: 'text-red-800',
    subColor: 'text-red-600',
  },
  MANUAL_REVIEW: {
    icon: '\ud83d\udccb',
    heading: 'Your HELOC application is under review.',
    sub: 'Our underwriting team will contact you shortly with a decision.',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    headingColor: 'text-yellow-800',
    subColor: 'text-yellow-600',
  },
}

function SummaryRow({ label, value }) {
  if (value == null || value === '\u2014') return null
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}

export default function ThankYouPage() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getApplication(id)
      .then(setApp)
      .catch(err => setError(err.response?.data?.message ?? err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner message="Loading your application result\u2026" />
  if (error)   return <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
  if (!app)    return null

  const outcome = OUTCOMES[app.status] ?? OUTCOMES.MANUAL_REVIEW
  const ap   = app.applicant
  const prop = app.propertyInfo

  return (
    <div className="max-w-xl mx-auto">

      {/* Outcome hero */}
      <div className={`${outcome.bg} ${outcome.border} border rounded-2xl px-8 py-8 text-center mb-6`}>
        <div className="text-5xl mb-3">{outcome.icon}</div>
        <h1 className={`text-xl font-bold ${outcome.headingColor} mb-1`}>{outcome.heading}</h1>
        <p className={`text-sm ${outcome.subColor}`}>{outcome.sub}</p>
        {app.status === 'DENIED' && app.decisionReason && (
          <p className="mt-3 text-sm text-red-700 bg-red-100 rounded-lg px-4 py-2 inline-block">
            {app.decisionReason}
          </p>
        )}
      </div>

      {/* Application summary */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Application Summary</h2>

        {ap && (
          <>
            <SummaryRow label="Applicant"      value={`${ap.firstName} ${ap.lastName}`} />
            <SummaryRow label="Submitted"      value={fmtDate(app.submittedAt)} />
          </>
        )}

        {prop && (
          <SummaryRow label="Property" value={`${prop.propertyAddress}, ${prop.propertyCity}, ${prop.propertyState}`} />
        )}

        <SummaryRow label="Credit Line"      value={fmt(app.requestedCreditLine)} />
        <SummaryRow label="Draw Period"      value={app.drawPeriodYears ? `${app.drawPeriodYears} years` : null} />
        <SummaryRow label="Repayment Period" value={app.repaymentPeriodYears ? `${app.repaymentPeriodYears} years` : null} />

        {app.creditScore != null && (
          <SummaryRow label="Credit Score"  value={app.creditScore} />
        )}
        {app.interestRate != null && (
          <SummaryRow label="Interest Rate" value={`${Number(app.interestRate).toFixed(2)}%`} />
        )}
        {app.dti != null && (
          <SummaryRow label="DTI"           value={`${Number(app.dti).toFixed(1)}%`} />
        )}
        {app.cltv != null && (
          <SummaryRow label="CLTV"          value={`${Number(app.cltv).toFixed(1)}%`} />
        )}

        {app.cashflowScore != null && (
          <SummaryRow label="Cashflow Score" value={app.cashflowScore} />
        )}

        {app.helocAccountNumber && (
          <SummaryRow label="HELOC Account #"  value={app.helocAccountNumber} />
        )}
        {app.monthlyPayment != null && (
          <SummaryRow label="Monthly Payment" value={fmt(app.monthlyPayment)} />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link to={`/applications/${id}`} className="flex-1 text-center btn-primary">
          View Full Details
        </Link>
        <Link to="/applications" className="flex-1 text-center btn-secondary">
          All Applications
        </Link>
      </div>
    </div>
  )
}
