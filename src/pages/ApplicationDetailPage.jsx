import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getApplication, reprocessApplication } from '../api/helocApi'
import StatusBadge from '../components/StatusBadge'
import PipelineTracker from '../components/PipelineTracker'
import LoadingSpinner from '../components/LoadingSpinner'
import PropertyImage from '../components/PropertyImage'
import DocumentUploadPanel from '../components/DocumentUploadPanel'
import LienRecordingPanel from '../components/LienRecordingPanel'
import CounterOfferPanel from '../components/CounterOfferPanel'
import ESignPanel from '../components/ESignPanel'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}
function fmtDate(val) {
  if (!val) return '\u2014'
  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function scoreColor(val, thresholds) {
  if (val == null) return 'text-gray-400'
  if (val >= thresholds[0]) return 'text-green-600'
  if (val >= thresholds[1]) return 'text-yellow-600'
  return 'text-red-600'
}
function dtiColor(val) { if (val == null) return 'text-gray-400'; return val < 30 ? 'text-green-600' : val < 43 ? 'text-yellow-600' : 'text-red-600' }
function cltvColor(val) { if (val == null) return 'text-gray-400'; return val < 80 ? 'text-green-600' : val < 90 ? 'text-yellow-600' : 'text-red-600' }

function MetricTile({ label, value, color, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${color ?? 'text-gray-800'}`}>{value ?? '\u2014'}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

function DecisionChip({ label, value }) {
  const colors = {
    APPROVED: 'bg-green-100 text-green-700', APPROVE: 'bg-green-100 text-green-700',
    DENIED: 'bg-red-100 text-red-700', DECLINE: 'bg-red-100 text-red-700',
    MANUAL_REVIEW: 'bg-yellow-100 text-yellow-700',
    BOOKED: 'bg-green-100 text-green-700',
    APPRAISED: 'bg-indigo-100 text-indigo-700',
    CONNECTED: 'bg-blue-100 text-blue-700',
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[value] ?? 'bg-gray-100 text-gray-600'}`}>
        {value ?? '\u2014'}
      </span>
    </div>
  )
}

/* --- Collapsible Section --- */
function Section({ title, icon, children, badge, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
          {badge}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value ?? '\u2014'}</span>
    </div>
  )
}

/* --- 1. Customer Demographics --- */
function CustomerDemographicsSection({ applicant }) {
  if (!applicant) return null
  const ap = applicant
  return (
    <Section title="Customer Demographics" icon={'\ud83d\udc64'}>
      <div className="grid grid-cols-3 gap-6 pt-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Personal Information</p>
          <Row label="Full Name" value={`${ap.firstName} ${ap.lastName}`} />
          <Row label="Date of Birth" value={fmtDate(ap.dob)} />
          <Row label="SSN" value={ap.ssn ? `***-**-${ap.ssn.slice(-4)}` : '\u2014'} />
          <Row label="Email" value={ap.email} />
          <Row label="Phone" value={ap.phone} />
          <Row label="Address" value={ap.address} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Employment</p>
          <Row label="Employment Type" value={ap.employmentType?.replace(/_/g, ' ')} />
          <Row label="Employer" value={ap.employerName} />
          <Row label="Annual Income" value={fmt(ap.annualIncome)} />
          <Row label="Monthly Housing" value={fmt(ap.monthlyHousingPayment)} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Financial Summary</p>
          <Row label="Gross Monthly Income" value={ap.annualIncome ? fmt(ap.annualIncome / 12) : '\u2014'} />
          <Row label="Housing-to-Income" value={ap.annualIncome && ap.monthlyHousingPayment ? `${((ap.monthlyHousingPayment / (ap.annualIncome / 12)) * 100).toFixed(1)}%` : '\u2014'} />
          <Row label="Disposable (est.)" value={ap.annualIncome && ap.monthlyHousingPayment ? fmt((ap.annualIncome / 12) - ap.monthlyHousingPayment) : '\u2014'} />
        </div>
      </div>
    </Section>
  )
}

/* --- 2. Property Information --- */
function PropertyInfoSection({ propertyInfo, app }) {
  if (!propertyInfo) return null
  const prop = propertyInfo
  const equity = prop.estimatedPropertyValue && prop.currentMortgageBalance
    ? prop.estimatedPropertyValue - prop.currentMortgageBalance : null
  const ltv = prop.estimatedPropertyValue && prop.currentMortgageBalance
    ? ((prop.currentMortgageBalance / prop.estimatedPropertyValue) * 100) : null

  return (
    <Section title="Property Information" icon={'\ud83c\udfe0'}>
      <div className="pt-3">
        <div className="mb-4">
          <PropertyImage address={`${prop.propertyAddress}, ${prop.propertyCity}, ${prop.propertyState}`} />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Location</p>
            <Row label="Street" value={prop.propertyAddress} />
            <Row label="City" value={prop.propertyCity} />
            <Row label="State" value={prop.propertyState} />
            <Row label="ZIP" value={prop.propertyZip} />
            <Row label="Property Type" value={prop.propertyType?.replace(/_/g, ' ')} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Property Details</p>
            <Row label="Year Built" value={prop.yearBuilt} />
            <Row label="Square Footage" value={prop.squareFootage?.toLocaleString()} />
            <Row label="Annual Property Tax" value={fmt(prop.propertyTaxAnnual)} />
            <Row label="Annual Insurance" value={fmt(prop.homeInsuranceAnnual)} />
            <Row label="Monthly HOA" value={prop.hoaMonthly ? fmt(prop.hoaMonthly) : 'None'} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Valuation</p>
            <Row label="Estimated Value" value={fmt(prop.estimatedPropertyValue)} />
            <Row label="Current Mortgage" value={fmt(prop.currentMortgageBalance)} />
            <Row label="Available Equity" value={equity != null ? fmt(equity) : '\u2014'} />
            <Row label="Current LTV" value={ltv != null ? `${ltv.toFixed(1)}%` : '\u2014'} />
            {app.appraisedValue != null && <Row label="Appraised Value" value={fmt(app.appraisedValue)} />}
            {app.appraisalDate && <Row label="Appraisal Date" value={fmtDate(app.appraisalDate)} />}
          </div>
        </div>
      </div>
    </Section>
  )
}

/* --- 3. Loan (HELOC) Information --- */
function LoanInfoSection({ app }) {
  const interestOnlyPayment = app.requestedCreditLine && app.interestRate
    ? (app.requestedCreditLine * (app.interestRate / 100 / 12)) : null

  return (
    <Section title="HELOC Loan Information" icon={'\ud83d\udcb0'}>
      <div className="grid grid-cols-3 gap-6 pt-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Credit Line Details</p>
          <Row label="Requested Credit Line" value={fmt(app.requestedCreditLine ?? app.loanAmount)} />
          <Row label="Draw Period" value={app.drawPeriodYears ? `${app.drawPeriodYears} years` : '\u2014'} />
          <Row label="Repayment Period" value={app.repaymentPeriodYears ? `${app.repaymentPeriodYears} years` : '\u2014'} />
          <Row label="Intended Use" value={app.intendedUse?.replace(/_/g, ' ')} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pricing</p>
          <Row label="Interest Rate" value={app.interestRate != null ? `${Number(app.interestRate).toFixed(2)}%` : '\u2014'} />
          <Row label="Interest-Only Payment" value={interestOnlyPayment != null ? fmt(interestOnlyPayment) : '\u2014'} />
          <Row label="P+I Monthly Payment" value={app.monthlyPayment != null ? fmt(app.monthlyPayment) : '\u2014'} />
          <Row label="APR" value={app.apr != null ? `${Number(app.apr).toFixed(2)}%` : '\u2014'} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Account</p>
          <Row label="HELOC Account #" value={app.helocAccountNumber} />
          <Row label="Account Status" value={app.loanStatus ?? app.helocStatus} />
          <Row label="Booking Date" value={fmtDate(app.bookedAt)} />
          <Row label="First Draw Available" value={app.helocAccountNumber ? 'Yes' : 'Pending'} />
        </div>
      </div>
    </Section>
  )
}

/* --- 4. Open Banking --- */
function OpenBankingSection({ app }) {
  const hasBankData = app.bankName != null || app.cashflowScore != null || app.bankAccountVerified != null
  return (
    <Section
      title="Open Banking"
      icon={'\ud83c\udfe6'}
      badge={hasBankData
        ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Connected</span>
        : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Pending</span>}
    >
      <div className="pt-3">
        {hasBankData ? (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bank Account</p>
              <Row label="Bank Name" value={app.bankName ?? 'Citizens Bank'} />
              <Row label="Account Number" value={app.maskedAccountNumber ?? '****1234'} />
              <Row label="Account Type" value={app.bankAccountType ?? 'Checking'} />
              <Row label="Verified" value={app.bankAccountVerified !== false ? 'Yes' : 'No'} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cashflow Analysis</p>
              <Row label="Cashflow Score" value={app.cashflowScore} />
              <Row label="Avg Monthly Balance" value={app.avgMonthlyBalance ? fmt(app.avgMonthlyBalance) : '\u2014'} />
              <Row label="Monthly Inflows" value={app.monthlyInflows ? fmt(app.monthlyInflows) : '\u2014'} />
              <Row label="Monthly Outflows" value={app.monthlyOutflows ? fmt(app.monthlyOutflows) : '\u2014'} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Auto-Pay</p>
              <Row label="Autopay Enrolled" value={app.autopayEnrolled ? 'Enrolled' : 'Not Enrolled'} />
              <Row label="Payment Method" value={app.paymentMethod ?? 'ACH'} />
              <Row label="Next Payment" value={fmtDate(app.nextPaymentDate)} />
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">Open Banking verification has not been completed yet.</p>
            <p className="text-xs mt-1">Bank account details and cashflow analysis will appear here once the applicant connects their account.</p>
          </div>
        )}
      </div>
    </Section>
  )
}

/* --- 5. Credit Decisioning --- */
function CreditDecisioningSection({ app }) {
  const hasCreditData = app.creditScore != null
  return (
    <Section
      title="Credit Decisioning"
      icon={'\ud83d\udcca'}
      badge={app.creditDecisionType ? <StatusBadge status={app.creditDecisionType} /> : null}
    >
      <div className="pt-3">
        {hasCreditData ? (
          <>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <MetricTile
                label="Credit Score"
                value={app.creditScore}
                color={scoreColor(app.creditScore, [740, 620])}
                sub={app.creditScore >= 740 ? 'Good\u2013Excellent' : app.creditScore >= 620 ? 'Fair' : 'Below Threshold'}
              />
              <MetricTile
                label="DTI Ratio"
                value={app.dti != null ? `${Number(app.dti).toFixed(1)}%` : null}
                color={dtiColor(app.dti)}
                sub={app.dti != null ? (app.dti < 30 ? 'Low risk' : app.dti < 43 ? 'Moderate' : 'High risk') : null}
              />
              <MetricTile
                label="CLTV Ratio"
                value={app.cltv != null ? `${Number(app.cltv).toFixed(1)}%` : null}
                color={cltvColor(app.cltv)}
                sub={app.cltv != null ? (app.cltv < 80 ? 'Low risk' : app.cltv < 90 ? 'Moderate' : 'High risk') : null}
              />
              <MetricTile
                label="Interest Rate"
                value={app.interestRate != null ? `${Number(app.interestRate).toFixed(2)}%` : null}
                color="text-gray-800"
                sub={app.interestRate != null ? (app.interestRate < 7 ? 'Below avg' : app.interestRate < 10 ? 'Market rate' : 'Above avg') : null}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Credit Bureau Data</p>
                <Row label="Credit Score" value={app.creditScore} />
                <Row label="Credit Bureau" value={app.creditBureau ?? 'TransUnion'} />
                <Row label="Report Date" value={fmtDate(app.creditReportDate ?? app.submittedAt)} />
                <Row label="Open Tradelines" value={app.openTradelines ?? '\u2014'} />
                <Row label="Derogatory Marks" value={app.derogatoryMarks ?? '0'} />
                <Row label="Credit Utilization" value={app.creditUtilization != null ? `${app.creditUtilization}%` : '\u2014'} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Decision Details</p>
                <Row label="Decision Type" value={app.creditDecisionType} />
                <Row label="Decision Reason" value={app.decisionReason} />
                <Row label="DTI Ratio" value={app.dti != null ? `${Number(app.dti).toFixed(1)}%` : '\u2014'} />
                <Row label="CLTV Ratio" value={app.cltv != null ? `${Number(app.cltv).toFixed(1)}%` : '\u2014'} />
                <Row label="Risk Grade" value={app.riskGrade ?? (app.creditScore >= 740 ? 'A' : app.creditScore >= 680 ? 'B' : app.creditScore >= 620 ? 'C' : 'D')} />
                <Row label="Max Approved Line" value={app.maxApprovedLine ? fmt(app.maxApprovedLine) : '\u2014'} />
              </div>
            </div>

            {/* Decision Trail */}
            <div className="mt-4 bg-gray-50 rounded-lg border border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Decision Trail</p>
              <div className="flex items-center gap-2 flex-wrap">
                <DecisionChip label="Credit" value={app.creditDecisionType} />
                {app.appraisedValue != null && <>
                  <span className="text-gray-300 text-lg">&rarr;</span>
                  <DecisionChip label="Appraisal" value="APPRAISED" />
                </>}
                {(app.cashflowScore != null || app.bankName != null) && <>
                  <span className="text-gray-300 text-lg">&rarr;</span>
                  <DecisionChip label="Banking" value="CONNECTED" />
                </>}
                {app.underwritingRecommendation && <>
                  <span className="text-gray-300 text-lg">&rarr;</span>
                  <DecisionChip label="Underwriting" value={app.underwritingRecommendation} />
                </>}
                {app.helocAccountNumber && <>
                  <span className="text-gray-300 text-lg">&rarr;</span>
                  <DecisionChip label="Booking" value="BOOKED" />
                </>}
                <span className="flex-1" />
                {app.decisionReason && (
                  <p className="text-xs text-gray-500 italic max-w-xs text-right">{app.decisionReason}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">Credit decision has not been run yet.</p>
            <p className="text-xs mt-1">Credit score, DTI, CLTV ratios and the decision will appear here after the credit check is performed.</p>
          </div>
        )}
      </div>
    </Section>
  )
}

/* --- 6. Underwriting --- */
function UnderwritingSection({ app }) {
  const hasUwData = app.underwritingRecommendation != null || app.cashflowScore != null
  return (
    <Section
      title="Underwriting"
      icon={'\ud83d\udccb'}
      badge={app.underwritingRecommendation ? <StatusBadge status={app.underwritingRecommendation} /> : null}
    >
      <div className="pt-3">
        {hasUwData ? (
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Risk Assessment</p>
              <Row label="Cashflow Score" value={app.cashflowScore} />
              <Row label="Credit Score" value={app.creditScore} />
              <Row label="DTI Ratio" value={app.dti != null ? `${Number(app.dti).toFixed(1)}%` : '\u2014'} />
              <Row label="CLTV Ratio" value={app.cltv != null ? `${Number(app.cltv).toFixed(1)}%` : '\u2014'} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Property Assessment</p>
              <Row label="Appraised Value" value={app.appraisedValue ? fmt(app.appraisedValue) : '\u2014'} />
              <Row label="Flood Zone" value={app.floodZoneStatus ?? 'N/A'} />
              <Row label="Title Clear" value={app.titleClear !== false ? 'Yes' : 'No'} />
              <Row label="Insurance Verified" value={app.insuranceVerified !== false ? 'Yes' : 'Pending'} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Decision</p>
              <Row label="Recommendation" value={app.underwritingRecommendation} />
              <Row label="Risk Grade" value={app.riskGrade ?? (app.creditScore >= 740 ? 'A' : app.creditScore >= 680 ? 'B' : app.creditScore >= 620 ? 'C' : 'D')} />
              <Row label="Conditions" value={app.underwritingConditions ?? 'None'} />
              <Row label="Review Date" value={fmtDate(app.underwritingDate ?? app.submittedAt)} />
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">Underwriting has not been completed yet.</p>
            <p className="text-xs mt-1">Risk assessment, property evaluation, and the underwriting recommendation will appear here.</p>
          </div>
        )}
      </div>
    </Section>
  )
}

/* --- Reprocess Panel --- */
const SSN_OPTIONS = [
  { ssn: '555-55-5555', score: 800, label: 'Excellent',  outcome: 'Approve',       color: 'text-green-700' },
  { ssn: '444-44-4444', score: 740, label: 'Good',       outcome: 'Approve',       color: 'text-green-700' },
  { ssn: '333-33-3333', score: 700, label: 'Fair',       outcome: 'Likely Approve', color: 'text-citizens-green' },
  { ssn: '222-22-2222', score: 650, label: 'Below Avg',  outcome: 'Manual Review', color: 'text-yellow-700' },
  { ssn: '111-11-1111', score: 620, label: 'Poor',       outcome: 'Manual Review', color: 'text-yellow-700' },
  { ssn: '000-00-0000', score: 580, label: 'Very Poor',  outcome: 'Decline',       color: 'text-red-700' },
]

function ReprocessPanel({ appId, onComplete }) {
  const [selectedSsn, setSelectedSsn] = useState(SSN_OPTIONS[0].ssn)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const updated = await reprocessApplication(appId, selectedSsn)
      onComplete(updated)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Reprocess failed.')
      setLoading(false)
    }
  }

  return (
    <div className="my-4 bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-4">
      <h3 className="text-yellow-800 font-bold text-base mb-1">Override Decision</h3>
      <p className="text-yellow-700 text-sm mb-4">
        Select a credit profile to re-run the pipeline and resolve this application.
      </p>
      {error && (
        <div className="mb-3 bg-red-50 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2">
          {SSN_OPTIONS.map(opt => (
            <label key={opt.ssn} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
              ${selectedSsn === opt.ssn ? 'border-yellow-400 bg-yellow-100' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <input
                type="radio"
                name="ssn"
                value={opt.ssn}
                checked={selectedSsn === opt.ssn}
                onChange={() => setSelectedSsn(opt.ssn)}
                className="accent-yellow-500"
              />
              <div className="flex-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Score <span className="font-bold text-gray-900">{opt.score}</span>
                  <span className="ml-2 text-gray-400 font-normal">({opt.label})</span>
                </span>
                <span className={`font-semibold ${opt.color}`}>{opt.outcome}</span>
              </div>
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="self-end bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition">
          {loading ? 'Processing\u2026' : 'Re-run Pipeline \u2192'}
        </button>
      </form>
    </div>
  )
}

/* --- Outcome Banner --- */
function OutcomeBanner({ app }) {
  if (app.status === 'BOOKED') return (
    <div className="my-4 bg-green-50 border border-green-300 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-green-500 text-xl mt-0.5 font-bold">&check;</span>
      <div>
        <p className="text-green-800 font-bold text-base">HELOC Approved & Activated</p>
        <p className="text-green-700 text-sm mt-0.5">
          Your HELOC has been approved and activated.
          {app.helocAccountNumber ? ` Account: ${app.helocAccountNumber}.` : ''}
          {app.monthlyPayment ? ` Monthly payment: ${fmt(app.monthlyPayment)}.` : ''}
        </p>
      </div>
    </div>
  )
  if (app.status === 'DENIED') return (
    <div className="my-4 bg-red-50 border border-red-300 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-red-500 text-xl mt-0.5 font-bold">&times;</span>
      <div>
        <p className="text-red-800 font-bold text-base">HELOC Application Declined</p>
        <p className="text-red-700 text-sm mt-0.5">
          {app.decisionReason ?? 'This application did not meet our HELOC lending criteria.'}
        </p>
      </div>
    </div>
  )
  if (app.status === 'MANUAL_REVIEW') return (
    <div className="my-4 bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-yellow-500 text-xl mt-0.5 font-bold">!</span>
      <div>
        <p className="text-yellow-800 font-bold text-base">Under Manual Review</p>
        <p className="text-yellow-700 text-sm mt-0.5">
          This application has been flagged for manual review by our underwriting team. You will be contacted shortly.
        </p>
      </div>
    </div>
  )
  return null
}

/* === Main Application Detail Page === */
export default function ApplicationDetailPage() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getApplication(id)
      .then(setApp)
      .catch(err => setError(err.response?.data?.message ?? err.message ?? 'Failed to load.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner message="Loading application\u2026" />
  if (error) return <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
  if (!app) return null

  return (
    <div>
      {/* Back link */}
      <Link to="/applications" className="text-sm text-citizens-green hover:underline mb-4 inline-block">&larr; All Applications</Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : 'Application'}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5 font-mono">{id}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={app.status} />
          <span className="text-xs text-gray-400">{fmtDate(app.submittedAt)}</span>
        </div>
      </div>

      {/* Outcome banner */}
      <OutcomeBanner app={app} />

      {/* Reprocess panel for MANUAL_REVIEW / DENIED */}
      {(app.status === 'MANUAL_REVIEW' || app.status === 'DENIED') && (
        <ReprocessPanel appId={app.id} onComplete={setApp} />
      )}

      {/* Counter offer for MANUAL_REVIEW / DENIED */}
      {(app.status === 'DENIED' || app.status === 'MANUAL_REVIEW') && (
        <CounterOfferPanel appId={app.id} status={app.status} />
      )}

      {/* Pipeline tracker */}
      <PipelineTracker status={app.status} banked={app.appraisedValue != null} />

      {/* HELOC summary bar */}
      <div className="mb-4 bg-citizens-green-light border border-citizens-green rounded-xl px-5 py-4 flex gap-8 flex-wrap">
        <div>
          <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Credit Line</p>
          <p className="text-xl font-bold text-citizens-navy">{fmt(app.requestedCreditLine ?? app.loanAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Draw Period</p>
          <p className="text-xl font-bold text-citizens-navy">{app.drawPeriodYears ? `${app.drawPeriodYears} years` : '\u2014'}</p>
        </div>
        <div>
          <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Repayment Period</p>
          <p className="text-xl font-bold text-citizens-navy">{app.repaymentPeriodYears ? `${app.repaymentPeriodYears} years` : '\u2014'}</p>
        </div>
        {app.interestRate != null && (
          <div>
            <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Interest Rate</p>
            <p className="text-xl font-bold text-citizens-navy">{Number(app.interestRate).toFixed(2)}%</p>
          </div>
        )}
        {app.monthlyPayment != null && (
          <div>
            <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Monthly Payment</p>
            <p className="text-xl font-bold text-citizens-navy">{fmt(app.monthlyPayment)}</p>
          </div>
        )}
        <div className="ml-auto flex items-center">
          <StatusBadge status={app.status} />
        </div>
      </div>

      {/* 1. Customer Demographics */}
      <CustomerDemographicsSection applicant={app.applicant} />

      {/* 2. Property Information */}
      <PropertyInfoSection propertyInfo={app.propertyInfo} app={app} />

      {/* 3. HELOC Loan Information */}
      <LoanInfoSection app={app} />

      {/* 4. Open Banking */}
      <OpenBankingSection app={app} />

      {/* 5. Credit Decisioning */}
      <CreditDecisioningSection app={app} />

      {/* 6. Underwriting */}
      <UnderwritingSection app={app} />

      {/* 7. Document Upload & OCR */}
      <Section title="Document Upload & OCR" icon={'\ud83d\udcc4'}>
        <div className="pt-1">
          <DocumentUploadPanel appId={app.id} applicant={app.applicant} />
        </div>
      </Section>

      {/* 8. E-Signature Integration */}
      <Section
        title="E-Signature Integration"
        icon={'\u270d\ufe0f'}
        badge={app.status === 'BOOKED'
          ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Available</span>
          : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Pending Approval</span>}
      >
        <div className="pt-1">
          {app.status === 'BOOKED' ? (
            <ESignPanel appId={app.id} />
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">E-Signature is available after HELOC approval.</p>
              <p className="text-xs mt-1">Once the application is approved and booked, HELOC closing documents can be sent for electronic signature.</p>
            </div>
          )}
        </div>
      </Section>

      {/* 9. Lien Recording */}
      <Section
        title="Lien Recording"
        icon={'\ud83c\udfe2'}
        badge={app.status === 'BOOKED'
          ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Available</span>
          : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Pending Approval</span>}
      >
        <div className="pt-1">
          {app.status === 'BOOKED' ? (
            <LienRecordingPanel app={app} />
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">Lien recording is available after HELOC approval.</p>
              <p className="text-xs mt-1">Once the HELOC is booked, a lien can be filed against the property with the county recorder.</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
