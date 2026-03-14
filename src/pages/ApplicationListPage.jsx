import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getApplications } from '../api/helocApi'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ApplicationListPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getApplications()
      .then(data => setApps(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="max-w-5xl mx-auto px-6 py-8 text-red-600">Error: {error}</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-citizens-navy">HELOC Applications</h1>
        <Link to="/apply" className="btn-primary">New Application</Link>
      </div>

      {apps.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No applications yet.</p>
          <Link to="/apply" className="btn-primary">Submit Your First Application</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Property Address</th>
                <th className="px-4 py-3">Credit Line</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {app.applicant?.firstName} {app.applicant?.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {app.propertyInfo?.propertyAddress || '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {app.requestedCreditLine ? `$${Number(app.requestedCreditLine).toLocaleString()}` : '\u2014'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/applications/${app.id}`} className="text-citizens-green hover:text-citizens-green-dark font-medium text-xs">
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
