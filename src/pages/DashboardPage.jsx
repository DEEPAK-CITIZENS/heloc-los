import { useState, useEffect, useMemo } from 'react'
import { getAllApplications } from '../api/helocApi'
import LoadingSpinner from '../components/LoadingSpinner'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

const PIPELINE_STAGES = [
  { key: 'SUBMITTED',          label: 'Submitted',          color: 'bg-gray-400' },
  { key: 'CREDIT_REVIEW',      label: 'Credit Review',      color: 'bg-citizens-green' },
  { key: 'PROPERTY_APPRAISED', label: 'Property Appraisal', color: 'bg-citizens-navy' },
  { key: 'UNDERWRITING',       label: 'Underwriting',       color: 'bg-purple-500' },
  { key: 'BOOKED',             label: 'Closed / Booked',    color: 'bg-green-500' },
]

const SCORE_BUCKETS = [
  { label: '750+',    min: 750, max: 900, color: 'bg-green-500' },
  { label: '700\u2013749', min: 700, max: 749, color: 'bg-citizens-green' },
  { label: '650\u2013699', min: 650, max: 699, color: 'bg-yellow-500' },
  { label: '620\u2013649', min: 620, max: 649, color: 'bg-orange-500' },
  { label: '<620',    min: 0,   max: 619, color: 'bg-red-500' },
]

function KpiCard({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl border-2 px-5 py-4 ${highlight ? 'border-citizens-green bg-citizens-green-light' : 'border-gray-200 bg-white'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${highlight ? 'text-citizens-green' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-3xl font-extrabold ${highlight ? 'text-citizens-navy' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${highlight ? 'text-citizens-green' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  )
}

function FunnelBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-500 w-36 text-right truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 4)}%` }}>
          <span className="text-xs text-white font-bold">{count}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 w-12">{pct.toFixed(0)}%</span>
    </div>
  )
}

export default function DashboardPage() {
  const [apps, setApps]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    getAllApplications()
      .then(data => setApps(Array.isArray(data) ? data : []))
      .catch(err => setError(err.response?.data?.message ?? err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const total     = apps.length
    const approved  = apps.filter(a => a.status === 'BOOKED').length
    const rate      = total > 0 ? ((approved / total) * 100).toFixed(1) : '0'
    const creditLines = apps.filter(a => a.requestedCreditLine).map(a => a.requestedCreditLine)
    const avgCreditLine = creditLines.length > 0 ? creditLines.reduce((a, b) => a + b, 0) / creditLines.length : 0
    const scores    = apps.filter(a => a.creditScore).map(a => a.creditScore)
    const avgScore  = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    const pipeline = {}
    PIPELINE_STAGES.forEach(s => { pipeline[s.key] = 0 })
    apps.forEach(a => {
      if (pipeline[a.status] !== undefined) pipeline[a.status]++
      else {
        if (a.status === 'DENIED' || a.status === 'MANUAL_REVIEW') {
          // count towards latest reached stage
          if (a.cashflowScore != null) pipeline.UNDERWRITING++
          else if (a.appraisedValue != null) pipeline.PROPERTY_APPRAISED++
          else if (a.creditScore != null) pipeline.CREDIT_REVIEW++
          else pipeline.SUBMITTED++
        }
      }
    })

    const scoreBuckets = SCORE_BUCKETS.map(b => ({
      ...b,
      count: scores.filter(s => s >= b.min && s <= b.max).length,
    }))

    // By property type
    const byPropertyType = {}
    apps.forEach(a => {
      const t = a.propertyInfo?.propertyType ?? 'UNKNOWN'
      byPropertyType[t] = (byPropertyType[t] || 0) + 1
    })

    // Fallout analysis
    const denied       = apps.filter(a => a.status === 'DENIED').length
    const manualReview = apps.filter(a => a.status === 'MANUAL_REVIEW').length

    return { total, approved, rate, avgCreditLine, avgScore, pipeline, scoreBuckets, byPropertyType, denied, manualReview }
  }, [apps])

  if (loading) return <LoadingSpinner message="Loading dashboard\u2026" />
  if (error) return <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>

  return (
    <div>
      <p className="section-label mb-1">Citizens HELOC</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Origination Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Applications" value={stats.total} highlight />
        <KpiCard label="Approval Rate" value={`${stats.rate}%`} sub={`${stats.approved} approved`} />
        <KpiCard label="Avg Credit Line" value={fmt(stats.avgCreditLine)} />
        <KpiCard label="Avg Credit Score" value={stats.avgScore || '\u2014'} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Pipeline funnel */}
        <div className="card p-5">
          <h2 className="section-label mb-4">Pipeline Funnel</h2>
          <div className="space-y-2">
            {PIPELINE_STAGES.map(s => (
              <FunnelBar key={s.key} label={s.label} count={stats.pipeline[s.key]} total={stats.total} color={s.color} />
            ))}
          </div>
        </div>

        {/* Credit score distribution */}
        <div className="card p-5">
          <h2 className="section-label mb-4">Credit Score Distribution</h2>
          <div className="space-y-2">
            {stats.scoreBuckets.map(b => (
              <FunnelBar key={b.label} label={b.label} count={b.count} total={stats.total} color={b.color} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* By property type */}
        <div className="card p-5">
          <h2 className="section-label mb-4">By Property Type</h2>
          {Object.keys(stats.byPropertyType).length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Property Type</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Apps</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.byPropertyType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <tr key={type} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-700">{type.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-right text-gray-800 font-semibold">{count}</td>
                    <td className="py-2 text-right text-gray-500">{stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-400">No data available.</p>
          )}
        </div>

        {/* Fallout analysis */}
        <div className="card p-5">
          <h2 className="section-label mb-4">Fallout Analysis</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-red-700">Denied</span>
              <span className="text-lg font-bold text-red-800">{stats.denied}</span>
            </div>
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-yellow-700">Manual Review</span>
              <span className="text-lg font-bold text-yellow-800">{stats.manualReview}</span>
            </div>
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-green-700">Approved</span>
              <span className="text-lg font-bold text-green-800">{stats.approved}</span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">
              Fallout rate: {stats.total > 0 ? (((stats.denied + stats.manualReview) / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
