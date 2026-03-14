import { useState, useEffect, useCallback, useRef } from 'react'
import { dealStructure } from '../api/helocApi'

function Slider({ label, value, onChange, min, max, step, fmt }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-citizens-navy">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-citizens-green" />
    </div>
  )
}

const fmtUSD = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
const fmtPct = v => v != null ? `${(v * 100).toFixed(1)}%` : '\u2014'

export default function PreQualPage() {
  const [income, setIncome] = useState(75000)
  const [housing, setHousing] = useState(1200)
  const [homeValue, setHomeValue] = useState(400000)
  const [mortgageBalance, setMortgageBalance] = useState(250000)
  const [creditLine, setCreditLine] = useState(50000)
  const [drawPeriod, setDrawPeriod] = useState(10)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const calculate = useCallback(() => {
    setLoading(true)
    dealStructure({
      annualIncome: income,
      monthlyHousingPayment: housing,
      estimatedPropertyValue: homeValue,
      currentMortgageBalance: mortgageBalance,
      requestedCreditLine: creditLine,
      drawPeriodYears: drawPeriod
    })
      .then(data => setResult(data))
      .catch(() => {
        const cltv = (mortgageBalance + creditLine) / homeValue
        const dti = (housing * 12) / income
        const rate = 0.0725
        const monthlyIO = (creditLine * rate) / 12
        setResult({
          estimatedCltv: cltv,
          estimatedDti: dti,
          interestOnlyMonthly: monthlyIO,
          maxQualifyingCreditLine: Math.max(0, homeValue * 0.85 - mortgageBalance)
        })
      })
      .finally(() => setLoading(false))
  }, [income, housing, homeValue, mortgageBalance, creditLine, drawPeriod])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(calculate, 400)
    return () => clearTimeout(debounceRef.current)
  }, [calculate])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-citizens-navy mb-1">HELOC Pre-Qualification</h1>
      <p className="text-sm text-gray-500 mb-8">Adjust the sliders to see estimated terms. No credit pull required.</p>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <Slider label="Annual Income" value={income} onChange={setIncome} min={20000} max={500000} step={5000} fmt={fmtUSD} />
          <Slider label="Monthly Housing Payment" value={housing} onChange={setHousing} min={0} max={10000} step={100} fmt={fmtUSD} />
          <Slider label="Home Value" value={homeValue} onChange={setHomeValue} min={50000} max={2000000} step={10000} fmt={fmtUSD} />
          <Slider label="Mortgage Balance" value={mortgageBalance} onChange={setMortgageBalance} min={0} max={1500000} step={5000} fmt={fmtUSD} />
          <Slider label="Credit Line Requested" value={creditLine} onChange={setCreditLine} min={5000} max={500000} step={5000} fmt={fmtUSD} />
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Draw Period</label>
            <div className="flex gap-2">
              {[5, 7, 10].map(y => (
                <button key={y} onClick={() => setDrawPeriod(y)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${drawPeriod === y ? 'bg-citizens-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {y} yrs
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {loading && <div className="text-sm text-gray-400 mb-2">Calculating...</div>}
          {result && (
            <div className="space-y-4">
              <div className="card p-5">
                <p className="section-label mb-3">Estimated Results</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">CLTV</p>
                    <p className={`text-2xl font-bold ${(result.estimatedCltv ?? 0) > 0.85 ? 'text-red-600' : 'text-citizens-green'}`}>
                      {fmtPct(result.estimatedCltv)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">DTI</p>
                    <p className={`text-2xl font-bold ${(result.estimatedDti ?? 0) > 0.43 ? 'text-red-600' : 'text-citizens-green'}`}>
                      {fmtPct(result.estimatedDti)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Interest-Only Monthly</p>
                    <p className="text-2xl font-bold text-citizens-navy">{fmtUSD(result.interestOnlyMonthly ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Max Qualifying Line</p>
                    <p className="text-2xl font-bold text-citizens-navy">{fmtUSD(result.maxQualifyingCreditLine ?? 0)}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                * Estimates only. Actual terms subject to credit review and property appraisal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
