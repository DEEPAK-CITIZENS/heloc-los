import { useState } from 'react'

const MOCK_IDENTITIES = {
  '2125551001': {
    applicant: { firstName: 'Sarah', lastName: 'Chen', dob: '1985-03-15', ssn: '444-44-4444', email: 'sarah.chen@example.com', phone: '212-555-1001', address: '742 Maple Drive, Greenwich, CT 06830', employmentType: 'EMPLOYED', employerName: 'Deloitte Consulting', annualIncome: '185000', monthlyHousingPayment: '2800' },
    property: { propertyAddress: '742 Maple Drive', propertyCity: 'Greenwich', propertyState: 'CT', propertyZip: '06830', propertyType: 'PRIMARY_RESIDENCE', yearBuilt: '1992', estimatedPropertyValue: '850000', currentMortgageBalance: '320000', squareFootage: '3200', propertyTaxAnnual: '12500', homeInsuranceAnnual: '2400', hoaMonthly: '0' }
  },
  '3105551002': {
    applicant: { firstName: 'Michael', lastName: 'Rodriguez', dob: '1978-07-22', ssn: '555-55-5555', email: 'mrodriguez@example.com', phone: '310-555-1002', address: '1100 Ocean Blvd, Santa Monica, CA 90401', employmentType: 'SELF_EMPLOYED', employerName: 'Rodriguez Design LLC', annualIncome: '225000', monthlyHousingPayment: '4200' },
    property: { propertyAddress: '1100 Ocean Blvd', propertyCity: 'Santa Monica', propertyState: 'CA', propertyZip: '90401', propertyType: 'PRIMARY_RESIDENCE', yearBuilt: '2005', estimatedPropertyValue: '1450000', currentMortgageBalance: '680000', squareFootage: '2800', propertyTaxAnnual: '18000', homeInsuranceAnnual: '3600', hoaMonthly: '350' }
  },
  '6175551003': {
    applicant: { firstName: 'Emily', lastName: 'Thompson', dob: '1990-11-08', ssn: '333-33-3333', email: 'ethompson@example.com', phone: '617-555-1003', address: '45 Beacon Street, Boston, MA 02108', employmentType: 'EMPLOYED', employerName: 'Mass General Hospital', annualIncome: '145000', monthlyHousingPayment: '2100' },
    property: { propertyAddress: '45 Beacon Street', propertyCity: 'Boston', propertyState: 'MA', propertyZip: '02108', propertyType: 'PRIMARY_RESIDENCE', yearBuilt: '1920', estimatedPropertyValue: '720000', currentMortgageBalance: '410000', squareFootage: '1800', propertyTaxAnnual: '9800', homeInsuranceAnnual: '1800', hoaMonthly: '500' }
  },
  '4045551004': {
    applicant: { firstName: 'James', lastName: 'Williams', dob: '1972-01-30', ssn: '222-22-2222', email: 'jwilliams@example.com', phone: '404-555-1004', address: '890 Peachtree Lane, Atlanta, GA 30309', employmentType: 'EMPLOYED', employerName: 'Delta Air Lines', annualIncome: '120000', monthlyHousingPayment: '1650' },
    property: { propertyAddress: '890 Peachtree Lane', propertyCity: 'Atlanta', propertyState: 'GA', propertyZip: '30309', propertyType: 'PRIMARY_RESIDENCE', yearBuilt: '2001', estimatedPropertyValue: '520000', currentMortgageBalance: '280000', squareFootage: '2400', propertyTaxAnnual: '6200', homeInsuranceAnnual: '1500', hoaMonthly: '75' }
  },
}

export default function ProvePanel({ onVerified, onSkip }) {
  const [phone, setPhone] = useState('')
  const [last4, setLast4] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function normalize(p) {
    return p.replace(/\D/g, '')
  }

  function handlePhoneSubmit(e) {
    e.preventDefault()
    setError(null)
    const norm = normalize(phone)
    if (norm.length < 10) { setError('Please enter a valid 10-digit phone number.'); return }
    setStep('ssn')
  }

  function handleVerify(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    setTimeout(() => {
      const norm = normalize(phone)
      const identity = MOCK_IDENTITIES[norm]
      if (identity && identity.applicant.ssn.endsWith(last4.replace(/-/g, ''))) {
        onVerified(identity.applicant, identity.property)
      } else if (identity) {
        setError('SSN last 4 digits do not match. Please try again.')
        setLoading(false)
        return
      } else {
        setError('No identity found for this phone number. You can skip and enter manually.')
        setLoading(false)
        return
      }
      setLoading(false)
    }, 1200)
  }

  return (
    <div className="bg-citizens-green-pale border border-citizens-green/20 rounded-lg p-5 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-citizens-navy text-sm">Prove Identity Verification</p>
          <p className="text-xs text-gray-500">Instantly verify your identity and prefill your application.</p>
        </div>
        <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600 underline">Skip</button>
      </div>

      {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="flex gap-2">
          <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)}
            className="form-input flex-1" />
          <button type="submit" className="btn-primary text-sm">Verify Phone</button>
        </form>
      )}

      {step === 'ssn' && (
        <form onSubmit={handleVerify} className="flex gap-2">
          <input type="text" placeholder="Last 4 of SSN" value={last4} onChange={e => setLast4(e.target.value)}
            maxLength={4} className="form-input w-32" />
          <button type="submit" disabled={loading} className="btn-primary text-sm disabled:opacity-50">
            {loading ? 'Verifying\u2026' : 'Confirm Identity'}
          </button>
        </form>
      )}

      <p className="text-xs text-gray-400 mt-2">
        Demo phones: 212-555-1001, 310-555-1002, 617-555-1003, 404-555-1004
      </p>
    </div>
  )
}
