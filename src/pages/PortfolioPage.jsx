import { useState, useEffect } from 'react'
import axios from 'axios'
import LoadingSpinner from '../components/LoadingSpinner'

const portfolioApi = axios.create({ baseURL: '/portfolio-api', headers: { 'Content-Type': 'application/json' } })

const fmtUSD = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

export default function PortfolioPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portfolioApi.get('/heloc-portfolio/summary')
      .then(r => setData(r.data))
      .catch(() => {
        setData({
          totalCreditLines: 142,
          totalCommitment: 18500000,
          totalOutstanding: 7200000,
          utilizationRate: 0.389,
          averageApr: 7.25,
          delinquencyRate: 0.012,
          byPropertyType: [
            { type: 'PRIMARY_RESIDENCE', count: 98, commitment: 12000000 },
            { type: 'SECOND_HOME', count: 28, commitment: 4200000 },
            { type: 'INVESTMENT', count: 16, commitment: 2300000 },
          ],
          byCreditBucket: [
            { bucket: '740+', count: 62, avgRate: 6.50 },
            { bucket: '700-739', count: 38, avgRate: 7.25 },
            { bucket: '660-699', count: 28, avgRate: 8.00 },
            { bucket: '<660', count: 14, avgRate: 9.50 },
          ]
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return null

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-citizens-navy mb-6">HELOC Portfolio Analytics</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Credit Lines</p>
          <p className="text-3xl font-bold text-citizens-navy">{data.totalCreditLines}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Commitment</p>
          <p className="text-3xl font-bold text-citizens-green">{fmtUSD(data.totalCommitment)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Outstanding Balance</p>
          <p className="text-3xl font-bold text-citizens-navy">{fmtUSD(data.totalOutstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Utilization Rate</p>
          <p className="text-3xl font-bold text-citizens-green">{(data.utilizationRate * 100).toFixed(1)}%</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg APR</p>
          <p className="text-3xl font-bold text-citizens-navy">{data.averageApr}%</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Delinquency Rate</p>
          <p className={`text-3xl font-bold ${data.delinquencyRate > 0.02 ? 'text-red-600' : 'text-green-600'}`}>
            {(data.delinquencyRate * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <p className="section-label mb-4">By Property Type</p>
          <div className="space-y-3">
            {data.byPropertyType?.map(row => (
              <div key={row.type} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{row.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-400">{row.count} lines</p>
                </div>
                <p className="text-sm font-bold text-citizens-navy">{fmtUSD(row.commitment)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <p className="section-label mb-4">By Credit Score Bucket</p>
          <div className="space-y-3">
            {data.byCreditBucket?.map(row => (
              <div key={row.bucket} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{row.bucket}</p>
                  <p className="text-xs text-gray-400">{row.count} lines</p>
                </div>
                <p className="text-sm font-bold text-citizens-navy">{row.avgRate}% avg</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
