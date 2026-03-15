import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { submitApplication } from '../api/helocApi'
import ProvePanel from '../components/ProvePanel'

const STEPS = ['Applicant', 'Property', 'HELOC']
const DRAFTS_KEY = 'pilot_heloc_drafts'

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

function readDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [] } catch { return [] }
}
function saveDraft(id, stepReached, firstName, lastName) {
  const drafts = readDrafts()
  const now = new Date().toISOString()
  const idx = drafts.findIndex(d => d.id === id)
  const entry = {
    id, stepReached,
    applicantFirstName: firstName, applicantLastName: lastName,
    startedAt: idx >= 0 ? drafts[idx].startedAt : now,
    lastUpdatedAt: now
  }
  if (idx >= 0) drafts[idx] = entry; else drafts.push(entry)
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}
function removeDraft(id) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(readDrafts().filter(d => d.id !== id)))
}

function safeFloat(val) {
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}
function safeInt(val) {
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

function validatePayload(applicant, property, heloc) {
  if (safeFloat(applicant.annualIncome) === null || safeFloat(applicant.annualIncome) <= 0) {
    return 'Please enter a valid annual income greater than zero.'
  }
  if (safeFloat(applicant.monthlyHousingPayment) === null || safeFloat(applicant.monthlyHousingPayment) < 0) {
    return 'Please enter a valid monthly housing payment.'
  }
  if (safeFloat(property.estimatedPropertyValue) === null || safeFloat(property.estimatedPropertyValue) <= 0) {
    return 'Please enter a valid estimated property value.'
  }
  if (safeFloat(property.currentMortgageBalance) === null || safeFloat(property.currentMortgageBalance) < 0) {
    return 'Please enter a valid current mortgage balance.'
  }
  if (safeInt(property.yearBuilt) === null || safeInt(property.yearBuilt) < 1800 || safeInt(property.yearBuilt) > new Date().getFullYear()) {
    return 'Please enter a valid year built.'
  }
  if (safeInt(property.squareFootage) === null || safeInt(property.squareFootage) <= 0) {
    return 'Please enter a valid square footage.'
  }
  if (safeFloat(property.propertyTaxAnnual) === null || safeFloat(property.propertyTaxAnnual) < 0) {
    return 'Please enter a valid annual property tax amount.'
  }
  if (safeFloat(property.homeInsuranceAnnual) === null || safeFloat(property.homeInsuranceAnnual) < 0) {
    return 'Please enter a valid annual home insurance amount.'
  }
  if (safeFloat(heloc.requestedCreditLine) === null || safeFloat(heloc.requestedCreditLine) <= 0) {
    return 'Please enter a valid requested credit line amount.'
  }
  if (safeInt(heloc.drawPeriodYears) === null) {
    return 'Please select a draw period.'
  }
  if (safeInt(heloc.repaymentPeriodYears) === null) {
    return 'Please select a repayment period.'
  }
  const cltv = (safeFloat(property.currentMortgageBalance) + safeFloat(heloc.requestedCreditLine)) / safeFloat(property.estimatedPropertyValue)
  if (cltv > 1.0) {
    return 'Combined loan-to-value (CLTV) exceeds 100%. Please reduce the credit line or check your property value.'
  }
  return null
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export default function NewApplicationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const preApproval = location.state?.preApproval ?? null

  const [step, setStep] = useState(0)
  const [applicant, setApplicant] = useState(INITIAL_APPLICANT)
  const [property, setProperty] = useState(INITIAL_PROPERTY)
  const [heloc, setHeloc] = useState(INITIAL_HELOC)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showProve, setShowProve] = useState(true)
  const [draftId] = useState(() => crypto.randomUUID())

  useEffect(() => {
    if (preApproval) {
      if (preApproval.firstName || preApproval.lastName) {
        setApplicant(prev => ({ ...prev, firstName: preApproval.firstName ?? '', lastName: preApproval.lastName ?? '' }))
      }
      if (preApproval.preApprovedAmount) setHeloc(prev => ({ ...prev, requestedCreditLine: String(preApproval.preApprovedAmount) }))
    }
  }, [preApproval])

  useEffect(() => {
    saveDraft(draftId, step, applicant.firstName, applicant.lastName)
  }, [step, applicant.firstName, applicant.lastName, draftId])

  const input = 'form-input w-full'
  const select = 'form-input w-full bg-white'

  function updateApplicant(e) { setApplicant(prev => ({ ...prev, [e.target.name]: e.target.value })) }
  function updateProperty(e) { setProperty(prev => ({ ...prev, [e.target.name]: e.target.value })) }
  function updateHeloc(e) { setHeloc(prev => ({ ...prev, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const validationError = validatePayload(applicant, property, heloc)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const payload = {
        applicant: {
          ...applicant,
          annualIncome: safeFloat(applicant.annualIncome),
          monthlyHousingPayment: safeFloat(applicant.monthlyHousingPayment)
        },
        propertyInfo: {
          ...property,
          estimatedPropertyValue: safeFloat(property.estimatedPropertyValue),
          currentMortgageBalance: safeFloat(property.currentMortgageBalance),
          yearBuilt: safeInt(property.yearBuilt),
          squareFootage: safeInt(property.squareFootage),
          propertyTaxAnnual: safeFloat(property.propertyTaxAnnual),
          homeInsuranceAnnual: safeFloat(property.homeInsuranceAnnual),
          hoaMonthly: safeFloat(property.hoaMonthly) || 0
        },
        requestedCreditLine: safeFloat(heloc.requestedCreditLine),
        drawPeriodYears: safeInt(heloc.drawPeriodYears),
        repaymentPeriodYears: safeInt(heloc.repaymentPeriodYears),
        intendedUse: heloc.intendedUse,
        ...(preApproval?.offerCode ? { preApprovalOfferCode: preApproval.offerCode } : {})
      }
      const result = await submitApplication(payload)
      removeDraft(draftId)
      navigate(`/applications/${result.id}/confirmation`)
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Submission failed.')
      setLoading(false)
    }
  }

  function handleProveVerified(applicantData, propertyData) {
    if (applicantData) setApplicant(prev => ({ ...prev, ...applicantData }))
    if (propertyData) setProperty(prev => ({ ...prev, ...propertyData }))
    setShowProve(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-citizens-navy mb-1">New HELOC Application</h1>
      <p className="text-sm text-gray-500 mb-6">Complete all three steps to submit your home equity line of credit application.</p>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < step ? 'bg-citizens-green border-citizens-green text-white' :
                i === step ? 'bg-white border-citizens-green text-citizens-green' :
                'bg-white border-gray-300 text-gray-400'
              }`}>
                {i < step ? '\u2713' : i + 1}
              </div>
              <span className={`mt-1 text-xs ${i <= step ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < step ? 'bg-citizens-green' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {preApproval && (
        <div className="mb-4 bg-citizens-green-light border border-citizens-green rounded-lg px-4 py-3 text-sm text-citizens-green">
          Pre-approved for up to <strong>${Number(preApproval.preApprovedAmount).toLocaleString()}</strong> at <strong>{preApproval.preApprovedApr}% APR</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Applicant */}
        {step === 0 && (
          <>
            {showProve && <ProvePanel onVerified={handleProveVerified} onSkip={() => setShowProve(false)} />}
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name"><input name="firstName" value={applicant.firstName} onChange={updateApplicant} required className={input} /></Field>
              <Field label="Last Name"><input name="lastName" value={applicant.lastName} onChange={updateApplicant} required className={input} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of Birth"><input type="date" name="dob" value={applicant.dob} onChange={updateApplicant} required className={input} /></Field>
              <Field label="SSN"><input name="ssn" value={applicant.ssn} onChange={updateApplicant} required placeholder="XXX-XX-XXXX" className={input} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email"><input type="email" name="email" value={applicant.email} onChange={updateApplicant} required className={input} /></Field>
              <Field label="Phone"><input type="tel" name="phone" value={applicant.phone} onChange={updateApplicant} required className={input} /></Field>
            </div>
            <Field label="Address"><input name="address" value={applicant.address} onChange={updateApplicant} required className={input} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employment Type">
                <select name="employmentType" value={applicant.employmentType} onChange={updateApplicant} className={select}>
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self-Employed</option>
                  <option value="RETIRED">Retired</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Employer Name"><input name="employerName" value={applicant.employerName} onChange={updateApplicant} className={input} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Annual Income ($)"><input type="number" name="annualIncome" value={applicant.annualIncome} onChange={updateApplicant} required min="0" className={input} /></Field>
              <Field label="Monthly Housing Payment ($)"><input type="number" name="monthlyHousingPayment" value={applicant.monthlyHousingPayment} onChange={updateApplicant} required min="0" className={input} /></Field>
            </div>
          </>
        )}

        {/* Step 2: Property */}
        {step === 1 && (
          <>
            <Field label="Property Address"><input name="propertyAddress" value={property.propertyAddress} onChange={updateProperty} required className={input} /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="City"><input name="propertyCity" value={property.propertyCity} onChange={updateProperty} required className={input} /></Field>
              <Field label="State"><input name="propertyState" value={property.propertyState} onChange={updateProperty} required className={input} /></Field>
              <Field label="ZIP"><input name="propertyZip" value={property.propertyZip} onChange={updateProperty} required className={input} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Property Type">
                <select name="propertyType" value={property.propertyType} onChange={updateProperty} className={select}>
                  <option value="PRIMARY_RESIDENCE">Primary Residence</option>
                  <option value="SECOND_HOME">Second Home</option>
                  <option value="INVESTMENT">Investment Property</option>
                </select>
              </Field>
              <Field label="Year Built"><input type="number" name="yearBuilt" value={property.yearBuilt} onChange={updateProperty} required min="1800" className={input} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Estimated Property Value ($)"><input type="number" name="estimatedPropertyValue" value={property.estimatedPropertyValue} onChange={updateProperty} required min="0" className={input} /></Field>
              <Field label="Current Mortgage Balance ($)"><input type="number" name="currentMortgageBalance" value={property.currentMortgageBalance} onChange={updateProperty} required min="0" className={input} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Square Footage"><input type="number" name="squareFootage" value={property.squareFootage} onChange={updateProperty} required min="0" className={input} /></Field>
              <Field label="HOA Monthly ($)"><input type="number" name="hoaMonthly" value={property.hoaMonthly} onChange={updateProperty} min="0" className={input} placeholder="0" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Annual Property Tax ($)"><input type="number" name="propertyTaxAnnual" value={property.propertyTaxAnnual} onChange={updateProperty} required min="0" className={input} /></Field>
              <Field label="Annual Home Insurance ($)"><input type="number" name="homeInsuranceAnnual" value={property.homeInsuranceAnnual} onChange={updateProperty} required min="0" className={input} /></Field>
            </div>
          </>
        )}

        {/* Step 3: HELOC Details */}
        {step === 2 && (
          <>
            <Field label="Requested Credit Line ($)"><input type="number" name="requestedCreditLine" value={heloc.requestedCreditLine} onChange={updateHeloc} required min="5000" className={input} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Draw Period">
                <select name="drawPeriodYears" value={heloc.drawPeriodYears} onChange={updateHeloc} className={select}>
                  <option value="5">5 years</option>
                  <option value="7">7 years</option>
                  <option value="10">10 years</option>
                </select>
              </Field>
              <Field label="Repayment Period">
                <select name="repaymentPeriodYears" value={heloc.repaymentPeriodYears} onChange={updateHeloc} className={select}>
                  <option value="10">10 years</option>
                  <option value="15">15 years</option>
                  <option value="20">20 years</option>
                </select>
              </Field>
            </div>
            <Field label="Intended Use">
              <select name="intendedUse" value={heloc.intendedUse} onChange={updateHeloc} className={select}>
                <option value="HOME_IMPROVEMENT">Home Improvement</option>
                <option value="DEBT_CONSOLIDATION">Debt Consolidation</option>
                <option value="EDUCATION">Education</option>
                <option value="EMERGENCY_FUND">Emergency Fund</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary">&larr; Back</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary">Next &rarr;</button>
          ) : (
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Submitting\u2026' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
