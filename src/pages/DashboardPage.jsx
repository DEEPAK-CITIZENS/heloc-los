import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllApplications } from '../api/helocApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

const DRAFTS_KEY = 'pilot_heloc_drafts'
function readDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [] } catch { return [] }
}

const PIPELINE_STAGES = ['SUBMITTED', 'CREDIT_REVIEW', 'PROPERTY_APPRAISED', 'UNDERWRITING', 'BOOKED']
const TERMINAL = ['BOOKED', 'DENIED', 'MANUAL_REVIEW']

export default function DashboardPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const drafts = readDrafts()

  useEffect(() => {
    getAllApplications()
      .then(data => setApps(Array.isArray(data) ? data : []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false))
  }, [])

  const total = apps.length
  const byStatus = {}
  apps.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1 })

  const booked = byStatus['BOOKED'] || 0
  const denied = byStatus['DENIED'] || 0
  const manual = byStatus['MANUAL_REVIEW'] || 0
  const approvalRate = total > 0 ? ((booked / total) * 100).toFixed(1) : 0

  const byPropertyType = {}
  apps.forEach(a => {
    const t = a.propertyInfo?.propertyType || 'UNKNOWN'
    byPropertyType[t] = (byPropertyType[t] || 0) + 1
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-citizens-navy mb-6">HELOC Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Apps</p>
          <p className="text-3xl font-bold text-citizens-navy">{total}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Booked</p>
          <p className="text-3xl font-bold text-green-600">{booked}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Denied</p>
          <p className="text-3xl font-bold text-red-600">{denied}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Manual Review</p>
          <p className="text-3xl font-bold text-yellow-600">{manual}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Approval Rate</p>
          <p className="text-3xl font-bold text-citizens-green">{approvalRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Pipeline Funnel */}
        <div className="card p-5">
          <p className="section-label mb-4">Pipeline Funnel</p>
          <div className="space-y-2">
            {PIPELINE_STAGES.map(stage => {
              const count = byStatus[stage] || 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-36 truncate">{stage.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full bg-citizens-green rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Property Type Breakdown */}
        <div className="card p-5">
          <p className="section-label mb-4">Property Type Breakdown</p>
          {Object.keys(byPropertyType).length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(byPropertyType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{type.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-citizens-navy">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fallout Analysis */}
      <div className="card p-5 mb-8">
        <p className="section-label mb-4">Fallout Analysis</p>
        <div className="grid grid-cols-3 gap-6 text-center">
          {TERMINAL.map(status => {
            const count = byStatus[status] || 0
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
            return (
              <div key={status}>
                <StatusBadge status={status} />
                <p className="text-2xl font-bold text-citizens-navy mt-2">{count}</p>
                <p className="text-xs text-gray-500">{pct}% of total</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Incomplete Applications (Drafts) */}
      {drafts.length > 0 && (
        <div className="card p-5">
          <p className="section-label mb-4">Incomplete Applications ({drafts.length})</p>
          <div className="space-y-2">
            {drafts.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {d.applicantFirstName || 'Unknown'} {d.applicantLastName || ''}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">Step {d.stepReached + 1} of 3</span>
                </div>
                <span className="text-xs text-gray-400">{d.lastUpdatedAt ? new Date(d.lastUpdatedAt).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
