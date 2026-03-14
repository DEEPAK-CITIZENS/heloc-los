import { useState } from 'react'
import { runPropertyAppraisal, getPropertyAppraisal } from '../api/helocApi'

const INITIAL_INPUT = {
  applicationId: '',
  propertyAddress: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
  propertyType: 'PRIMARY_RESIDENCE',
  estimatedPropertyValue: '',
  yearBuilt: '',
  squareFootage: '',
  lotSize: '',
}

export default function PropertyAppraisalPage() {
  const [input, setInput] = useState(INITIAL_INPUT)
  const [result, setResult] = useState(null)
  const [lookupId, setLookupId] = useState('')
  const [lookupResult, setLookupResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState('')
  const [lookupError, setLookupError] = useState('')

  const set = (k) => (e) => setInput({ ...input, [k]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const payload = {
        ...input,
        estimatedPropertyValue: parseFloat(input.estimatedPropertyValue) || 0,
        yearBuilt: parseInt(input.yearBuilt) || 0,
        squareFootage: parseInt(input.squareFootage) || 0,
        lotSize: parseFloat(input.lotSize) || 0,
      }
      const data = await runPropertyAppraisal(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Appraisal request failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLookup(e) {
    e.preventDefault()
    if (!lookupId.trim()) return
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const data = await getPropertyAppraisal(lookupId.trim())
      setLookupResult(data)
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Not found')
    } finally {
      setLookupLoading(false)
    }
  }

  function AppraisalCard({ data, title }) {
    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-citizens-navy mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Appraised Value</p>
            <p className="text-2xl font-bold text-citizens-green">${(data.appraisedValue || data.estimatedPropertyValue || 0).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">CLTV Ratio</p>
            <p className={`text-2xl font-bold ${(data.cltvRatio || 0) > 90 ? 'text-red-600' : (data.cltvRatio || 0) > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
              {data.cltvRatio != null ? `${data.cltvRatio}%` : '—'}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Flood Zone</p>
            <p className={`text-2xl font-bold ${data.floodZone === 'X' ? 'text-green-600' : 'text-yellow-600'}`}>
              {data.floodZone || '—'}
            </p>
          </div>
        </div>
        {data.comparableSales && data.comparableSales.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Comparable Sales</h4>
            <div className="space-y-2">
              {data.comparableSales.map((comp, i) => (
                <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                  <span>{comp.address}</span>
                  <span className="font-medium">${(comp.salePrice || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.appraisalDate && (
          <p className="text-xs text-gray-400 mt-3">Appraised: {new Date(data.appraisalDate).toLocaleString()}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-citizens-navy">Property Appraisal Service</h1>
        <p className="text-gray-500 mt-1">Port 9092 · Determines property value, CLTV ratio, and flood zone status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Run Appraisal */}
        <div className="card p-6">
          <h2 className="section-label">Run Property Appraisal</h2>
          <p className="text-sm text-gray-500 mb-4">POST /property-appraisal</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={input.applicationId} onChange={set('applicationId')} />
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Property Address" value={input.propertyAddress} onChange={set('propertyAddress')} />
            <div className="grid grid-cols-3 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="City" value={input.propertyCity} onChange={set('propertyCity')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="State" value={input.propertyState} onChange={set('propertyState')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="ZIP" value={input.propertyZip} onChange={set('propertyZip')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select className="border rounded px-3 py-2 text-sm" value={input.propertyType} onChange={set('propertyType')}>
                <option value="PRIMARY_RESIDENCE">Primary Residence</option>
                <option value="SECOND_HOME">Second Home</option>
                <option value="INVESTMENT">Investment Property</option>
              </select>
              <input className="border rounded px-3 py-2 text-sm" placeholder="Estimated Value" type="number" value={input.estimatedPropertyValue} onChange={set('estimatedPropertyValue')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Year Built" type="number" value={input.yearBuilt} onChange={set('yearBuilt')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Sq Ft" type="number" value={input.squareFootage} onChange={set('squareFootage')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Lot Size (acres)" type="number" step="0.01" value={input.lotSize} onChange={set('lotSize')} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Appraising…' : 'Run Appraisal'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {result && <AppraisalCard data={result} title="Appraisal Result" />}
        </div>

        {/* Lookup Appraisal */}
        <div className="card p-6">
          <h2 className="section-label">Lookup Appraisal</h2>
          <p className="text-sm text-gray-500 mb-4">GET /property-appraisal/{'{applicationId}'}</p>
          <form onSubmit={handleLookup} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <button type="submit" disabled={lookupLoading} className="btn-secondary w-full">
              {lookupLoading ? 'Looking up…' : 'Lookup Appraisal'}
            </button>
          </form>
          {lookupError && <p className="text-red-600 text-sm mt-3">{lookupError}</p>}
          {lookupResult && <AppraisalCard data={lookupResult} title="Stored Appraisal" />}

          <div className="mt-8 p-4 bg-citizens-green-pale rounded-lg">
            <h3 className="text-sm font-semibold text-citizens-navy mb-2">Appraisal Info</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Appraisal uses property details and comparable sales data</li>
              <li>• CLTV = (Mortgage Balance + Credit Line) / Appraised Value</li>
              <li>• Flood zone X = minimal risk; A/V = high risk (insurance required)</li>
              <li>• Properties in flood zones may require additional insurance documentation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
