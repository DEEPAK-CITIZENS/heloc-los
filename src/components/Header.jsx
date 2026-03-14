import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PropertyValuePanel from './PropertyValuePanel'

// ── Citizens Logo ─────────────────────────────────────────────────────────────
function CitizensLogo() {
  return (
    <svg width="160" height="36" viewBox="0 0 160 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Citizens Financial Group">
      <g transform="translate(2,4)">
        <path d="M14 14 C14 14 14 6 20 4 C20 4 14 4 14 14Z" fill="#00965E"/>
        <path d="M14 14 C14 14 22 14 24 8 C24 8 24 14 14 14Z" fill="#00965E"/>
        <path d="M14 14 C14 14 14 22 8 24 C8 24 14 24 14 14Z" fill="#00965E"/>
        <path d="M14 14 C14 14 6 14 4 20 C4 20 4 14 14 14Z" fill="#00965E"/>
        <circle cx="14" cy="14" r="2.5" fill="#007A3D"/>
      </g>
      <text x="38" y="19" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="700" fill="#1a1a1a" letterSpacing="-0.3">Citizens</text>
      <text x="38" y="30" fontFamily="Inter, sans-serif" fontSize="8.5" fontWeight="500" fill="#4A4F55" letterSpacing="2">FINANCIAL GROUP</text>
    </svg>
  )
}

// ── Nav Link ──────────────────────────────────────────────────────────────────
function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const active = pathname === to || (to !== '/' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={`relative text-sm font-medium pb-0.5 transition-colors duration-150
        ${active
          ? 'text-citizens-green after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-0.5 after:bg-citizens-green after:rounded-full'
          : 'text-gray-600 hover:text-citizens-green'
        }`}
    >
      {children}
    </Link>
  )
}

// ── Ribbon toggle button ──────────────────────────────────────────────────────
function RibbonBtn({ icon, label, open, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative text-sm font-medium pb-0.5 transition-colors duration-150 flex items-center gap-1.5
        ${open
          ? 'text-citizens-green after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-0.5 after:bg-citizens-green after:rounded-full'
          : 'text-gray-600 hover:text-citizens-green'
        }`}
    >
      {icon}
      {label}
      <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
           fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELOC CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════
const DRAW_PERIODS = [5, 7, 10]
const REPAYMENT_PERIODS = [10, 15, 20]

function fmtUSD(n, decimals = 2) {
  if (n == null || isNaN(n) || !isFinite(n)) return '\u2014'
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals
  }).format(n)
}

function CalcInput({ label, value, onChange, placeholder, prefix }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`border border-gray-200 rounded-md py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-citizens-green focus:border-citizens-green bg-white transition-colors ${prefix ? 'pl-6 pr-3' : 'px-3'}`}
        />
      </div>
    </div>
  )
}

function ResultTile({ label, value, highlight, sub }) {
  return (
    <div className={`text-center px-5 py-2 rounded-lg ${highlight ? 'bg-citizens-green text-white' : 'bg-white border border-gray-200'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${highlight ? 'text-green-100' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-lg font-extrabold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${highlight ? 'text-green-200' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  )
}

function HelocCalculator() {
  const [homeValue, setHomeValue]       = useState('')
  const [mortgageBalance, setMortgageBalance] = useState('')
  const [creditLine, setCreditLine]     = useState('')
  const [rate, setRate]                 = useState('8.50')
  const [drawPeriod, setDrawPeriod]     = useState(10)
  const [repayPeriod, setRepayPeriod]   = useState(20)

  const hv = parseFloat(homeValue) || 0
  const mb = parseFloat(mortgageBalance) || 0
  const cl = parseFloat(creditLine) || 0
  const r  = (parseFloat(rate) || 0) / 100 / 12

  const availableEquity = useMemo(() => Math.max(0, hv * 0.80 - mb), [hv, mb])
  const cltv = useMemo(() => hv > 0 ? ((mb + cl) / hv * 100) : null, [hv, mb, cl])

  // Interest-only payment during draw period
  const interestOnly = useMemo(() => cl > 0 && r > 0 ? cl * r : null, [cl, r])

  // P+I payment during repayment period
  const piPayment = useMemo(() => {
    if (cl <= 0 || r <= 0) return null
    const n = repayPeriod * 12
    return cl * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  }, [cl, r, repayPeriod])

  const hasResult = cl > 0 && hv > 0

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-4 mb-5">
          <span className="text-xs text-gray-400">Estimate your HELOC payments before you apply</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <CalcInput label="Home Value"        value={homeValue}       onChange={setHomeValue}       placeholder="450,000" prefix="$" />
          <CalcInput label="Mortgage Balance"  value={mortgageBalance} onChange={setMortgageBalance} placeholder="280,000" prefix="$" />
          <CalcInput label="Credit Line"       value={creditLine}      onChange={setCreditLine}      placeholder="100,000" prefix="$" />
          <CalcInput label="Interest Rate (%)" value={rate}            onChange={setRate}            placeholder="8.50" />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Draw Period (yrs)</label>
            <div className="flex gap-1.5">
              {DRAW_PERIODS.map(t => (
                <button key={t} onClick={() => setDrawPeriod(t)}
                  className={`text-xs font-bold w-10 py-2 rounded-md border transition-colors duration-150
                    ${drawPeriod === t ? 'bg-citizens-green text-white border-citizens-green' : 'bg-white text-gray-600 border-gray-200 hover:border-citizens-green hover:text-citizens-green'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Repayment (yrs)</label>
            <div className="flex gap-1.5">
              {REPAYMENT_PERIODS.map(t => (
                <button key={t} onClick={() => setRepayPeriod(t)}
                  className={`text-xs font-bold w-10 py-2 rounded-md border transition-colors duration-150
                    ${repayPeriod === t ? 'bg-citizens-green text-white border-citizens-green' : 'bg-white text-gray-600 border-gray-200 hover:border-citizens-green hover:text-citizens-green'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {hasResult ? (
            <div className="flex gap-2 ml-auto flex-wrap">
              <ResultTile label="Interest-Only/mo"  value={fmtUSD(interestOnly)}       highlight sub={`${drawPeriod}-yr draw`} />
              <ResultTile label="P+I Monthly"       value={fmtUSD(piPayment)}          sub={`${repayPeriod}-yr repay`} />
              <ResultTile label="Available Equity"  value={fmtUSD(availableEquity, 0)} />
              <ResultTile label="CLTV"              value={cltv != null ? `${cltv.toFixed(1)}%` : '\u2014'} />
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-400 italic">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Enter home value and credit line to see your estimate
            </div>
          )}
        </div>

        {hasResult && (
          <p className="text-xs text-gray-400 mt-3">
            * Estimates only. Actual rate determined by credit profile, property appraisal, and HELOC terms at time of application.
          </p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════════
export default function Header() {
  const [panel, setPanel] = useState(null) // null | 'calc' | 'value'

  function toggle(name) {
    setPanel(p => p === name ? null : name)
  }

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm">
      {/* Main nav bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
            <CitizensLogo />
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-7">
            <NavLink to="/pre-approvals">Pre-Approvals</NavLink>
            <NavLink to="/pre-qualify">Pre-Qualify</NavLink>
            <NavLink to="/applications">Applications</NavLink>
            <NavLink to="/portfolio">Portfolio</NavLink>
            <NavLink to="/config">Config</NavLink>

            {/* Calculator toggle */}
            <RibbonBtn
              open={panel === 'calc'}
              onClick={() => toggle('calc')}
              label="HELOC Calculator"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            {/* Home Value toggle */}
            <RibbonBtn
              open={panel === 'value'}
              onClick={() => toggle('value')}
              label="Home Value Estimate"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              }
            />
          </nav>

          {/* CTA */}
          <Link
            to="/apply"
            className="bg-citizens-green hover:bg-citizens-green-dark text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors duration-150 shadow-sm"
          >
            Apply Now
          </Link>
        </div>

        {/* Brand accent line */}
        <div className="h-0.5 bg-gradient-to-r from-citizens-green via-citizens-green-mid to-citizens-green-dark" />
      </div>

      {/* Ribbon panels — only one at a time */}
      {panel === 'calc'  && <HelocCalculator />}
      {panel === 'value' && <PropertyValuePanel />}
    </header>
  )
}
