import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { submitApplication } from '../api/helocApi'
import ProvePanel from '../components/ProvePanel'
import PropertyImage from '../components/PropertyImage'

const DRAFTS_KEY = 'pilot_heloc_drafts'

function saveDraft(draftId, stepReached, firstName, lastName) {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]')
    const idx = drafts.findIndex(d => d.id === draftId)
    const entry = {
      id: draftId,
      stepReached,
      applicantFirstName: firstName,
      applicantLastName: lastName,
      startedAt: idx >= 0 ? drafts[idx].startedAt : new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    }
    if (idx >= 0) drafts[idx] = entry
    else drafts.push(entry)
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch { /* ignore */ }
}

function removeDraft(draftId) {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]')
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.filter(d => d.id !== draftId)))
  } catch { /* ignore */ }
}

const INITIAL_APPLICANT = {
  firstName: '', lastName: '', dob: '', ssn: '', email: '', phone: '',
  address: '', employmentType: 'EMPLOYED', employerName: '', annualIncome: '', monthlyHousingPayment: ''
}
const INITIAL_PROPERTY = {
  propertyAddress: '', propertyCity: '', propertyState: '', propertyZip: '',
  propertyType: 'PRIMARY_RESIDENCE', estimatedPropertyValue: '', currentMortgageBalance: '',
  yearBuilt: '', squareFootage: '', propertyTaxAnnual: '', homeInsuranceAnnual: '', hoaMonthly: ''
}
const INITIAL_HELOC = { requestedCreditLine: '', drawPeriodYears: '10', repaymentPeriodYears: '20', intendedUse: 'HOME_IMPROVEMENT' }

const STEP_LABELS = ['Applicant', 'Property', 'HELOC']

function Input({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-citizens-green focus:border-citizens-green"
      />
    </div>
  )
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-citizens-green"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function NewApplicationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const preApproval = location.state?.preApproval

  const [step, setStep]           = useState(0)
  const [applicant, setApplicant] = useState(() => {
    if (preApproval) {
      return { ...INITIAL_APPLICANT, firstName: preApproval.firstName ?? '', lastName: preApproval.lastName ?? '' }
    }
    return { ...INITIAL_APPLICANT }
  })
  const [property, setProperty]   = useState({ ...INITIAL_PROPERTY })
  const [heloc, setHeloc]         = useState(() => {
    if (preApproval?.preApprovedAmount) {
      return { ...INITIAL_HELOC, requestedCreditLine: String(preApproval.preApprovedAmount) }
    }
    return { ...INITIAL_HELOC }
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)
  const [draftId] = useState(() => `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)

  function updateApplicant(field, value) {
    setApplicant(prev => ({ ...prev, [field]: value }))
  }
  function updateProperty(field, value) {
    setProperty(prev => ({ ...prev, [field]: value }))
  }
  function updateHeloc(field, value) {
    setHeloc(prev => ({ ...prev, [field]: value }))
  }

  function nextStep() {
    saveDraft(draftId, step, applicant.firstName, applicant.lastName)
    setStep(s => Math.min(s + 1, 2))
  }
  function prevStep() {
    setStep(s => Math.max(s - 1, 0))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        applicant: {
          ...applicant,
          annualIncome: parseFloat(applicant.annualIncome) || 0,
          monthlyHousingPayment: parseFloat(applicant.monthlyHousingPayment) || 0,
        },
        propertyInfo: {
          ...property,
          estimatedPropertyValue: parseFloat(property.estimatedPropertyValue) || 0,
          currentMortgageBalance: parseFloat(property.currentMortgageBalance) || 0,
          yearBuilt: parseInt(property.yearBuilt) || 0,
          squareFootage: parseInt(property.squareFootage) || 0,
          propertyTaxAnnual: parseFloat(property.propertyTaxAnnual) || 0,
          homeInsuranceAnnual: parseFloat(property.homeInsuranceAnnual) || 0,
          hoaMonthly: parseFloat(property.hoaMonthly) || 0,
        },
        requestedCreditLine: parseFloat(heloc.requestedCreditLine) || 0,
        drawPeriodYears: parseInt(heloc.drawPeriodYears),
        repaymentPeriodYears: parseInt(heloc.repaymentPeriodYears),
        intendedUse: heloc.intendedUse,
      }

      if (preApproval?.offerCode) {
        payload.preApprovalOfferCode = preApproval.offerCode
      }

      const result = await submitApplication(payload)
      removeDraft(draftId)
      navigate(`/applications/${result.id}/confirmation`)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Submission failed.')
      setSubmitting(false)
    }
  }

  function handleProveVerified(applicantData, propertyData) {
    if (applicantData) setApplicant(prev => ({ ...prev, ...applicantData }))
    if (propertyData) setProperty(prev => ({ ...prev, ...propertyData }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="section-label mb-1">Citizens HELOC</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New HELOC Application</h1>

      {/* Pre-approval banner */}
      {preApproval && (
        <div className="bg-citizens-green-light border border-citizens-green rounded-lg px-4 py-3 mb-6 text-sm">
          <span className="font-semibold text-citizens-green">Pre-Approved: </span>
          <span className="text-citizens-navy">
            Up to ${Number(preApproval.preApprovedAmount).toLocaleString()} at {Number(preApproval.preApprovedApr).toFixed(2)}% APR
          </span>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors
              ${i < step ? 'bg-citizens-green text-white'
                : i === step ? 'bg-citizens-navy text-white'
                : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? '\u2713' : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-citizens-green' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card p-6">
        {/* Step 0: Applicant */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Applicant Information</h2>

            <ProvePanel onVerified={handleProveVerified} />

            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={applicant.firstName} onChange={v => updateApplicant('firstName', v)} required />
              <Input label="Last Name"  value={applicant.lastName}  onChange={v => updateApplicant('lastName', v)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date of Birth" value={applicant.dob} onChange={v => updateApplicant('dob', v)} type="date" required />
              <Input label="SSN"           value={applicant.ssn} onChange={v => updateApplicant('ssn', v)} placeholder="555-55-5555" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" value={applicant.email} onChange={v => updateApplicant('email', v)} type="email" required />
              <Input label="Phone" value={applicant.phone} onChange={v => updateApplicant('phone', v)} placeholder="(401) 555-1234" required />
            </div>
            <Input label="Address" value={applicant.address} onChange={v => updateApplicant('address', v)} required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Employment Type" value={applicant.employmentType} onChange={v => updateApplicant('employmentType', v)}
                options={[
                  { value: 'EMPLOYED', label: 'Employed' },
                  { value: 'SELF_EMPLOYED', label: 'Self-Employed' },
                  { value: 'RETIRED', label: 'Retired' },
                  { value: 'OTHER', label: 'Other' },
                ]} />
              <Input label="Employer Name" value={applicant.employerName} onChange={v => updateApplicant('employerName', v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Annual Income" value={applicant.annualIncome} onChange={v => updateApplicant('annualIncome', v)} type="number" placeholder="95000" required />
              <Input label="Monthly Housing Payment" value={applicant.monthlyHousingPayment} onChange={v => updateApplicant('monthlyHousingPayment', v)} type="number" placeholder="2200" required />
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" onClick={nextStep} className="btn-primary">Next: Property &rarr;</button>
            </div>
          </div>
        )}

        {/* Step 1: Property */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Property Information</h2>

            <Input label="Property Address" value={property.propertyAddress} onChange={v => updateProperty('propertyAddress', v)} placeholder="100 Westminster St" required />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City"  value={property.propertyCity}  onChange={v => updateProperty('propertyCity', v)} placeholder="Providence" required />
              <Input label="State" value={property.propertyState} onChange={v => updateProperty('propertyState', v)} placeholder="RI" required />
              <Input label="ZIP"   value={property.propertyZip}   onChange={v => updateProperty('propertyZip', v)} placeholder="02903" required />
            </div>
            <Select label="Property Type" value={property.propertyType} onChange={v => updateProperty('propertyType', v)}
              options={[
                { value: 'PRIMARY_RESIDENCE', label: 'Primary Residence' },
                { value: 'SECOND_HOME', label: 'Second Home' },
                { value: 'INVESTMENT', label: 'Investment Property' },
              ]} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Estimated Property Value" value={property.estimatedPropertyValue} onChange={v => updateProperty('estimatedPropertyValue', v)} type="number" placeholder="450000" required />
              <Input label="Current Mortgage Balance"  value={property.currentMortgageBalance}  onChange={v => updateProperty('currentMortgageBalance', v)} type="number" placeholder="280000" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Year Built"     value={property.yearBuilt}     onChange={v => updateProperty('yearBuilt', v)} type="number" placeholder="1995" />
              <Input label="Square Footage"  value={property.squareFootage}  onChange={v => updateProperty('squareFootage', v)} type="number" placeholder="2200" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Annual Property Tax"    value={property.propertyTaxAnnual}    onChange={v => updateProperty('propertyTaxAnnual', v)} type="number" placeholder="5400" />
              <Input label="Annual Home Insurance"  value={property.homeInsuranceAnnual}  onChange={v => updateProperty('homeInsuranceAnnual', v)} type="number" placeholder="1800" />
              <Input label="Monthly HOA (optional)" value={property.hoaMonthly}           onChange={v => updateProperty('hoaMonthly', v)} type="number" placeholder="0" />
            </div>

            {property.propertyAddress && (
              <PropertyImage address={`${property.propertyAddress}, ${property.propertyCity}, ${property.propertyState}`} />
            )}

            <div className="flex justify-between pt-4">
              <button type="button" onClick={prevStep} className="btn-secondary">&larr; Back</button>
              <button type="button" onClick={nextStep} className="btn-primary">Next: HELOC Details &rarr;</button>
            </div>
          </div>
        )}

        {/* Step 2: HELOC */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">HELOC Details</h2>

            <Input label="Requested Credit Line" value={heloc.requestedCreditLine} onChange={v => updateHeloc('requestedCreditLine', v)} type="number" placeholder="100000" required />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Draw Period (Years)" value={heloc.drawPeriodYears} onChange={v => updateHeloc('drawPeriodYears', v)}
                options={[
                  { value: '5', label: '5 years' },
                  { value: '7', label: '7 years' },
                  { value: '10', label: '10 years' },
                ]} required />
              <Select label="Repayment Period (Years)" value={heloc.repaymentPeriodYears} onChange={v => updateHeloc('repaymentPeriodYears', v)}
                options={[
                  { value: '10', label: '10 years' },
                  { value: '15', label: '15 years' },
                  { value: '20', label: '20 years' },
                ]} required />
            </div>
            <Select label="Intended Use" value={heloc.intendedUse} onChange={v => updateHeloc('intendedUse', v)}
              options={[
                { value: 'HOME_IMPROVEMENT', label: 'Home Improvement' },
                { value: 'DEBT_CONSOLIDATION', label: 'Debt Consolidation' },
                { value: 'EDUCATION', label: 'Education' },
                { value: 'EMERGENCY_FUND', label: 'Emergency Fund' },
                { value: 'OTHER', label: 'Other' },
              ]} required />

            <div className="flex justify-between pt-4">
              <button type="button" onClick={prevStep} className="btn-secondary">&larr; Back</button>
              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
