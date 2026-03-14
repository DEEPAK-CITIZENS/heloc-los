import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

function fmtUSD(n) {
  if (n == null || isNaN(n)) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function Slider({ label, value, onChange, min, max, step = 1, format }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        <span className="text-sm font-bold text-gray-800">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-citizens-green"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  )
}

function ResultCard({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl border-2 px-5 py-4 text-center ${highlight ? 'border-citizens-green bg-citizens-green-light' : 'border-gray-200 bg-white'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${highlight ? 'text-citizens-green' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-2xl font-extrabold ${highlight ? 'text-citizens-navy' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${highlight ? 'text-citizens-green' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  )
}

const RATE = 0.085 // 8.5% default variable rate

export default function PreQualPage() {
  const [income, setIncome]         = useState(95000)
  const [housing, setHousing]       = useState(2200)
  const [homeValue, setHomeValue]   = useState(450000)
  const [mortgage, setMortgage]     = useState(280000)
  const [creditLine, setCreditLine] = useState(80000)
  const [drawPeriod, setDrawPeriod] = useState(10)

  const equity = useMemo(() => Math.max(0, homeValue - mortgage), [homeValue, mortgage])
  const maxEquity80 = useMemo(() => Math.max(0, homeValue * 0.80 - mortgage), [homeValue, mortgage])
  const cltv = useMemo(() => homeValue > 0 ? ((mortgage + creditLine) / homeValue * 100) : 0, [homeValue, mortgage, creditLine])
  const dti = useMemo(() => {
    const monthlyIncome = income / 12
    if (monthlyIncome <= 0) return 0
    const monthlyPayment = creditLine * (RATE / 12)
    return ((housing + monthlyPayment) / monthlyIncome * 100)
  }, [income, housing, creditLine])

  const interestOnly = useMemo(() => creditLine * (RATE / 12), [creditLine])
  const maxQualifying = useMemo(() => Math.min(maxEquity80, Math.max(0, (income / 12 * 0.43 - housing) / (RATE / 12))), [income, housing, maxEquity80])

  // Term comparison table
  const comparisons = useMemo(() => {
    const draws = [5, 7, 10]
    const repays = [10, 15, 20]
    const rows = []
    draws.forEach(d => {
      repays.forEach(rp => {
        const r = RATE / 12
        const n = rp * 12
        const pi = creditLine * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        rows.push({ draw: d, repay: rp, io: creditLine * r, pi })
      })
    })
    return rows
  }, [creditLine])

  return (
    <div className="max-w-3xl mx-auto">
      <p className="section-label mb-1">Citizens HELOC</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pre-Qualification</h1>
      <p className="text-sm text-gray-500 mb-8">No hard credit pull. Adjust the sliders to see your estimated HELOC terms.</p>

      <div className="card p-6 space-y-6 mb-8">
        <Slider label="Annual Income" value={income} onChange={setIncome} min={30000} max={500000} step={5000} format={fmtUSD} />
        <Slider label="Monthly Housing Payment" value={housing} onChange={setHousing} min={0} max={10000} step={100} format={fmtUSD} />
        <Slider label="Home Value" value={homeValue} onChange={setHomeValue} min={100000} max={2000000} step={10000} format={fmtUSD} />
        <Slider label="Current Mortgage Balance" value={mortgage} onChange={setMortgage} min={0} max={1500000} step={10000} format={fmtUSD} />
        <Slider label="Requested Credit Line" value={creditLine} onChange={setCreditLine} min={10000} max={500000} step={5000} format={fmtUSD} />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Draw Period</label>
          <div className="flex gap-2">
            {[5, 7, 10].map(t => (
              <button key={t} onClick={() => setDrawPeriod(t)}
                className={`px-4 py-2 rounded-md text-sm font-bold border transition-colors
                  ${drawPeriod === t ? 'bg-citizens-green text-white border-citizens-green' : 'bg-white text-gray-600 border-gray-200 hover:border-citizens-green'}`}>
                {t} yrs
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <ResultCard label="Estimated CLTV" value={`${cltv.toFixed(1)}%`} sub={cltv <= 80 ? 'Good' : cltv <= 90 ? 'Moderate' : 'High'} highlight={cltv <= 80} />
        <ResultCard label="Estimated DTI" value={`${dti.toFixed(1)}%`} sub={dti < 30 ? 'Low risk' : dti < 43 ? 'Moderate' : 'High risk'} highlight={dti < 43} />
        <ResultCard label="Interest-Only/mo" value={fmtUSD(interestOnly)} sub={`${drawPeriod}-yr draw period`} highlight />
        <ResultCard label="Max Qualifying Line" value={fmtUSD(maxQualifying)} sub="Based on DTI & equity" />
      </div>

      {/* Term comparison table */}
      <div className="card overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="section-label">Term Comparison</h2>
          <p className="text-xs text-gray-400 mt-0.5">Monthly payments at {(RATE * 100).toFixed(2)}% for {fmtUSD(creditLine)} credit line</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-citizens-green text-white">
            <tr>
              {['Draw Period', 'Repayment Period', 'Interest-Only/mo', 'P+I Monthly'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row, i) => (
              <tr key={i} className={`border-b border-gray-50 ${row.draw === drawPeriod ? 'bg-citizens-green-light' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{row.draw} years</td>
                <td className="px-4 py-2.5 text-gray-600">{row.repay} years</td>
                <td className="px-4 py-2.5 text-gray-700 font-semibold">{fmtUSD(row.io)}</td>
                <td className="px-4 py-2.5 text-gray-700 font-semibold">{fmtUSD(row.pi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center">
        <Link to="/apply" className="btn-primary text-base px-8 py-3">
          Apply Now &rarr;
        </Link>
        <p className="text-xs text-gray-400 mt-2">
          * Pre-qualification estimates only. Final terms subject to credit review and property appraisal.
        </p>
      </div>
    </div>
  )
}
