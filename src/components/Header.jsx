import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

function LoanCalculator({ onClose }) {
  const [creditLine, setCreditLine] = useState(50000)
  const [rate, setRate] = useState(7.25)
  const [drawYears, setDrawYears] = useState(10)
  const [repayYears, setRepayYears] = useState(20)

  const monthlyIO = (creditLine * (rate / 100)) / 12
  const totalMonths = repayYears * 12
  const monthlyRate = (rate / 100) / 12
  const monthlyPI = creditLine * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5 w-80">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-citizens-navy text-sm">HELOC Calculator</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs text-gray-500">Credit Line ($)</label>
          <input type="number" value={creditLine} onChange={e => setCreditLine(Number(e.target.value))}
            className="form-input w-full mt-1" min="5000" step="5000" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Interest Rate (%)</label>
          <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))}
            className="form-input w-full mt-1" min="0" step="0.125" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Draw Period</label>
            <select value={drawYears} onChange={e => setDrawYears(Number(e.target.value))} className="form-input w-full mt-1 bg-white">
              <option value={5}>5 yrs</option><option value={7}>7 yrs</option><option value={10}>10 yrs</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Repayment</label>
            <select value={repayYears} onChange={e => setRepayYears(Number(e.target.value))} className="form-input w-full mt-1 bg-white">
              <option value={10}>10 yrs</option><option value={15}>15 yrs</option><option value={20}>20 yrs</option>
            </select>
          </div>
        </div>
        <div className="border-t pt-3 grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xs text-gray-500">Interest-Only</p>
            <p className="text-lg font-bold text-citizens-green">${monthlyIO.toFixed(2)}</p>
            <p className="text-xs text-gray-400">during draw period</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">P + I</p>
            <p className="text-lg font-bold text-citizens-navy">${monthlyPI.toFixed(2)}</p>
            <p className="text-xs text-gray-400">during repayment</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/apply', label: 'Apply' },
  { to: '/pre-qualify', label: 'Pre-Qualify' },
  { to: '/applications', label: 'Applications' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/pre-approvals', label: 'Pre-Approvals' },
  { to: '/config', label: 'Config' },
]

export default function Header() {
  const [showCalc, setShowCalc] = useState(false)

  return (
    <header className="bg-citizens-navy text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">Citizens <span className="text-citizens-green-mid">HELOC</span></span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative">
            <button onClick={() => setShowCalc(!showCalc)}
              className="text-xs bg-citizens-green hover:bg-citizens-green-dark text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Calculator
            </button>
            {showCalc && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <LoanCalculator onClose={() => setShowCalc(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
