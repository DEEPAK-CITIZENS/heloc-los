import { useState } from 'react'
import { bookHeloc, getBookedHeloc } from '../api/helocApi'

const INITIAL_INPUT = {
  applicationId: '',
  borrowerFirstName: '',
  borrowerLastName: '',
  requestedCreditLine: '',
  interestRate: '',
  drawPeriodYears: '10',
  repaymentPeriodYears: '20',
  propertyAddress: '',
  propertyCity: '',
  propertyState: '',
  propertyZip: '',
}

export default function HelocBookingPage() {
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
        requestedCreditLine: parseFloat(input.requestedCreditLine) || 0,
        interestRate: parseFloat(input.interestRate) || 0,
        drawPeriodYears: parseInt(input.drawPeriodYears),
        repaymentPeriodYears: parseInt(input.repaymentPeriodYears),
      }
      const data = await bookHeloc(payload)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Booking failed')
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
      const data = await getBookedHeloc(lookupId.trim())
      setLookupResult(data)
    } catch (err) {
      setLookupError(err.response?.data?.message || err.message || 'Not found')
    } finally {
      setLookupLoading(false)
    }
  }

  function BookingCard({ data, title }) {
    return (
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-citizens-navy mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">HELOC Account #</p>
            <p className="text-lg font-bold text-citizens-green font-mono">{data.helocAccountNumber || data.loanAccountNumber || '—'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Credit Line</p>
            <p className="text-lg font-bold text-citizens-navy">${(data.creditLineAmount || data.principalAmount || 0).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
            <p className="text-lg font-bold text-citizens-navy">{data.interestRate != null ? `${data.interestRate}%` : '—'}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
            <p className="text-lg font-bold text-citizens-navy">${(data.monthlyPayment || 0).toLocaleString()}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Draw Period</p>
            <p className="text-lg font-bold text-citizens-navy">{data.drawPeriodYears || '—'} yrs</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Repayment Period</p>
            <p className="text-lg font-bold text-citizens-navy">{data.repaymentPeriodYears || '—'} yrs</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            data.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            data.status === 'CLOSED' ? 'bg-gray-100 text-gray-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {data.status || 'BOOKED'}
          </span>
          {data.activationDate && (
            <span className="text-sm text-gray-500">Activated: {new Date(data.activationDate).toLocaleDateString()}</span>
          )}
        </div>
        {data.bookedAt && (
          <p className="text-xs text-gray-400 mt-2">Booked at: {new Date(data.bookedAt).toLocaleString()}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-citizens-navy">HELOC Booking Service</h1>
        <p className="text-gray-500 mt-1">Port 9094 · Creates HELOC accounts and calculates payment schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Book HELOC */}
        <div className="card p-6">
          <h2 className="section-label">Book HELOC Account</h2>
          <p className="text-sm text-gray-500 mb-4">POST /booked-heloc</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={input.applicationId} onChange={set('applicationId')} />
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="First Name" value={input.borrowerFirstName} onChange={set('borrowerFirstName')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Last Name" value={input.borrowerLastName} onChange={set('borrowerLastName')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Credit Line Amount" type="number" value={input.requestedCreditLine} onChange={set('requestedCreditLine')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Interest Rate %" type="number" step="0.01" value={input.interestRate} onChange={set('interestRate')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select className="border rounded px-3 py-2 text-sm" value={input.drawPeriodYears} onChange={set('drawPeriodYears')}>
                <option value="5">5-Year Draw</option>
                <option value="7">7-Year Draw</option>
                <option value="10">10-Year Draw</option>
              </select>
              <select className="border rounded px-3 py-2 text-sm" value={input.repaymentPeriodYears} onChange={set('repaymentPeriodYears')}>
                <option value="10">10-Year Repayment</option>
                <option value="15">15-Year Repayment</option>
                <option value="20">20-Year Repayment</option>
              </select>
            </div>
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Property Address" value={input.propertyAddress} onChange={set('propertyAddress')} />
            <div className="grid grid-cols-3 gap-3">
              <input className="border rounded px-3 py-2 text-sm" placeholder="City" value={input.propertyCity} onChange={set('propertyCity')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="State" value={input.propertyState} onChange={set('propertyState')} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="ZIP" value={input.propertyZip} onChange={set('propertyZip')} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Booking…' : 'Book HELOC'}
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {result && <BookingCard data={result} title="Booked HELOC" />}
        </div>

        {/* Lookup Booked HELOC */}
        <div className="card p-6">
          <h2 className="section-label">Lookup Booked HELOC</h2>
          <p className="text-sm text-gray-500 mb-4">GET /booked-heloc/{'{applicationId}'}</p>
          <form onSubmit={handleLookup} className="space-y-3">
            <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Application ID (UUID)" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
            <button type="submit" disabled={lookupLoading} className="btn-secondary w-full">
              {lookupLoading ? 'Looking up…' : 'Lookup HELOC'}
            </button>
          </form>
          {lookupError && <p className="text-red-600 text-sm mt-3">{lookupError}</p>}
          {lookupResult && <BookingCard data={lookupResult} title="Stored HELOC Account" />}

          <div className="mt-8 p-4 bg-citizens-green-pale rounded-lg">
            <h3 className="text-sm font-semibold text-citizens-navy mb-2">HELOC Booking Details</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Booking creates the HELOC account with a unique account number</li>
              <li>• Draw period: interest-only payments on amounts drawn</li>
              <li>• Repayment period: principal + interest on outstanding balance</li>
              <li>• Monthly payment = Credit Line × (Rate/12) during draw period</li>
              <li>• Account activation triggers lien recording process</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
