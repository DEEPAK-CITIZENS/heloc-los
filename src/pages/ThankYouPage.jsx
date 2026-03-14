import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getApplication } from '../api/helocApi'
import LoadingSpinner from '../components/LoadingSpinner'

const OUTCOMES = {
  BOOKED: { bg: 'bg-green-50 border-green-200', icon: '\u2705', title: 'HELOC Approved!', sub: 'Your home equity line of credit has been approved and booked.' },
  DENIED: { bg: 'bg-red-50 border-red-200', icon: '\u274C', title: 'Application Denied', sub: 'Unfortunately, your application did not meet the underwriting criteria at this time.' },
  MANUAL_REVIEW: { bg: 'bg-yellow-50 border-yellow-200', icon: '\u23F3', title: 'Under Review', sub: 'Your application is being reviewed by an underwriter. We may reach out for additional documentation.' },
}

export default function ThankYouPage() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const poll = () => {
      getApplication(id)
        .then(data => {
          if (cancelled) return
          setApp(data)
          if (data.status === 'SUBMITTED' || data.status === 'CREDIT_REVIEW' || data.status === 'PROPERTY_APPRAISED' || data.status === 'UNDERWRITING') {
            setTimeout(poll, 2000)
          } else {
            setLoading(false)
          }
        })
        .catch(() => { if (!cancelled) setLoading(false) })
    }
    poll()
    return () => { cancelled = true }
  }, [id])

  if (loading || !app) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <LoadingSpinner />
        <h2 className="text-xl font-bold text-citizens-navy mt-4">Processing Your Application</h2>
        <p className="text-gray-500 mt-2">This usually takes less than 60 seconds...</p>
        <p className="text-xs text-gray-400 mt-1">Status: {app?.status || 'SUBMITTED'}</p>
      </div>
    )
  }

  const outcome = OUTCOMES[app.status] || OUTCOMES.MANUAL_REVIEW

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className={`${outcome.bg} border rounded-xl p-8 text-center mb-8`}>
        <div className="text-5xl mb-4">{outcome.icon}</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{outcome.title}</h1>
        <p className="text-gray-600">{outcome.sub}</p>
      </div>

      {app.status === 'BOOKED' && (
        <div className="card p-6 mb-6">
          <p className="section-label mb-4">HELOC Account Summary</p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Account Number</dt>
              <dd className="font-bold text-lg text-citizens-navy">{app.helocAccountNumber || app.loanAccountNumber || '\u2014'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Approved Credit Line</dt>
              <dd className="font-bold text-lg text-citizens-green">${Number(app.approvedCreditLine || app.requestedCreditLine || 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Interest Rate (APR)</dt>
              <dd className="font-bold">{app.interestRate ? `${app.interestRate}%` : '\u2014'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Interest-Only Payment</dt>
              <dd className="font-bold">${Number(app.interestOnlyPayment || app.monthlyPayment || 0).toLocaleString()}/mo</dd>
            </div>
            <div>
              <dt className="text-gray-500">Draw Period</dt>
              <dd>{app.drawPeriodYears || '\u2014'} years</dd>
            </div>
            <div>
              <dt className="text-gray-500">Repayment Period</dt>
              <dd>{app.repaymentPeriodYears || '\u2014'} years</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <Link to={`/applications/${id}`} className="btn-primary">View Application Details</Link>
        <Link to="/" className="btn-secondary">Back to Home</Link>
      </div>
    </div>
  )
}
