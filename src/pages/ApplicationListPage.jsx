import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getApplications } from '../api/helocApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}
function fmtFull(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}
function fmtDate(val) {
  if (!val) return '\u2014'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function OutcomeChip({ status }) {
  if (status === 'BOOKED')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">&check; Approved</span>
  if (status === 'DENIED')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">&times; Declined</span>
  if (status === 'MANUAL_REVIEW')
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">! Manual Review</span>
  return <span className="text-xs text-gray-400">In Progress</span>
}

function rowBg(status) {
  if (status === 'BOOKED')        return 'bg-green-50/30'
  if (status === 'DENIED')        return 'bg-red-50/30'
  if (status === 'MANUAL_REVIEW') return 'bg-yellow-50/30'
  return ''
}

function DetailItem({ label, value }) {
  if (value == null || value === '\u2014') return null
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  )
}

function ExpandedRow({ app }) {
  const ap   = app.applicant
  const prop = app.propertyInfo
  return (
    <tr>
      <td colSpan={8} className="px-6 py-4 bg-white border-b border-gray-100">
        <div className="grid grid-cols-3 gap-6">

          {/* Applicant */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1">Applicant</p>
            {ap ? (
              <>
                <DetailItem label="Name"       value={`${ap.firstName} ${ap.lastName}`} />
                <DetailItem label="Email"      value={ap.email} />
                <DetailItem label="Phone"      value={ap.phone} />
                <DetailItem label="Employment" value={ap.employmentType?.replace(/_/g,' ')} />
                <DetailItem label="Annual Income"     value={fmtFull(ap.annualIncome)} />
                <DetailItem label="Monthly Housing"   value={fmtFull(ap.monthlyHousingPayment)} />
              </>
            ) : <p className="text-sm text-gray-400">No data</p>}
          </div>

          {/* Property & HELOC */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1">Property & HELOC</p>
            {prop && (
              <>
                <DetailItem label="Property"       value={`${prop.propertyAddress}, ${prop.propertyCity}`} />
                <DetailItem label="Type"            value={prop.propertyType?.replace(/_/g, ' ')} />
                <DetailItem label="Est. Value"      value={fmtFull(prop.estimatedPropertyValue)} />
                <DetailItem label="Mortgage Balance" value={fmtFull(prop.currentMortgageBalance)} />
                <DetailItem label="Year Built"      value={prop.yearBuilt} />
                <DetailItem label="Sq Ft"           value={prop.squareFootage?.toLocaleString()} />
              </>
            )}
            <DetailItem label="Credit Line"    value={fmtFull(app.requestedCreditLine)} />
            <DetailItem label="Draw Period"    value={app.drawPeriodYears ? `${app.drawPeriodYears} years` : null} />
            <DetailItem label="Repayment"      value={app.repaymentPeriodYears ? `${app.repaymentPeriodYears} years` : null} />
          </div>

          {/* Decision */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1">Decision Details</p>
            <DetailItem label="Credit Score"    value={app.creditScore} />
            <DetailItem label="Interest Rate"   value={app.interestRate != null ? `${Number(app.interestRate).toFixed(2)}%` : null} />
            <DetailItem label="DTI"             value={app.dti != null ? `${Number(app.dti).toFixed(1)}%` : null} />
            <DetailItem label="CLTV"            value={app.cltv != null ? `${Number(app.cltv).toFixed(1)}%` : null} />
            <DetailItem label="Cashflow Score"  value={app.cashflowScore} />
            <DetailItem label="UW Decision"     value={app.underwritingRecommendation} />
            {app.status === 'BOOKED' && (
              <>
                <DetailItem label="HELOC Account #"  value={app.helocAccountNumber} />
                <DetailItem label="Monthly Payment" value={fmtFull(app.monthlyPayment)} />
              </>
            )}
            {app.status === 'DENIED' && app.decisionReason && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Decline Reason</p>
                <p className="text-sm text-red-700">{app.decisionReason}</p>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function ApplicationListPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [showAll, setShowAll] = useState(false)

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getApplications()
      setApps(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sorted     = [...apps].reverse()
  const displayed  = showAll ? sorted : sorted.slice(0, 4)

  const approved   = apps.filter(a => a.status === 'BOOKED').length
  const declined   = apps.filter(a => a.status === 'DENIED').length
  const manual     = apps.filter(a => a.status === 'MANUAL_REVIEW').length
  const inProgress = apps.filter(a => !['BOOKED','DENIED','MANUAL_REVIEW'].includes(a.status)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label mb-1">Citizens HELOC</p>
          <h1 className="text-2xl font-bold text-gray-900">HELOC Applications</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/apply" className="btn-primary">
            + New Application
          </Link>
          <button
            onClick={() => setShowAll(v => !v)}
            className="btn-secondary"
          >
            {showAll ? '\u2191 Recent' : `\u2193 All (${apps.length})`}
          </button>
          <button onClick={load} className="btn-secondary px-3">
            \u21bb
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {/* Summary bar */}
      {!loading && apps.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm">
            <span className="text-gray-500">Total </span>
            <span className="font-bold text-gray-800">{apps.length}</span>
          </div>
          {approved > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-green-600">&check; Approved </span>
              <span className="font-bold text-green-700">{approved}</span>
            </div>
          )}
          {declined > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-red-600">&times; Declined </span>
              <span className="font-bold text-red-700">{declined}</span>
            </div>
          )}
          {manual > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-yellow-600">! Manual Review </span>
              <span className="font-bold text-yellow-700">{manual}</span>
            </div>
          )}
          {inProgress > 0 && (
            <div className="bg-citizens-navy-light border border-citizens-navy rounded-lg px-4 py-2 text-sm">
              <span className="text-citizens-navy">&bull; In Progress </span>
              <span className="font-bold text-citizens-navy-dark">{inProgress}</span>
            </div>
          )}
        </div>
      )}

      {!loading && !error && apps.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">{'\ud83d\udccb'}</p>
          <p className="font-medium">No applications yet.</p>
          <Link to="/apply" className="mt-3 inline-block text-citizens-green hover:underline text-sm">Submit your first HELOC application &rarr;</Link>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-citizens-green text-white">
              <tr>
                {['#', 'Applicant', 'Property', 'Credit Line', 'Stage', 'Outcome', 'Submitted', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((app, i) => {
                const ap   = app.applicant
                const prop = app.propertyInfo
                const name = [ap?.firstName, ap?.lastName].filter(Boolean).join(' ') || '\u2014'
                const property = prop ? `${prop.propertyAddress}, ${prop.propertyCity}` : '\u2014'
                const isOpen = !!expanded[app.id]
                return (
                  <React.Fragment key={app.id}>
                    <tr
                      className={`border-b border-gray-100 transition cursor-pointer hover:bg-gray-50/80 ${rowBg(app.status)}`}
                      onClick={() => toggleExpand(app.id)}
                    >
                      <td className="px-4 py-3 text-gray-400">{apps.length - i}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{name}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{property}</td>
                      <td className="px-4 py-3 text-gray-700">{fmt(app.requestedCreditLine)}</td>
                      <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                      <td className="px-4 py-3"><OutcomeChip status={app.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{fmtDate(app.submittedAt)}</td>
                      <td className="px-4 py-3 flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        <Link to={`/applications/${app.id}`} className="text-citizens-green hover:underline font-medium">View</Link>
                        <button
                          onClick={() => toggleExpand(app.id)}
                          className="text-gray-400 hover:text-gray-600 text-xs font-medium transition"
                        >
                          {isOpen ? '\u25b2 Less' : '\u25bc More'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && <ExpandedRow key={`${app.id}-expanded`} app={app} />}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
