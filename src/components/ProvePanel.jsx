import { useState } from 'react'

// Mock identity data keyed by normalized phone (digits only)
// Property data instead of vehicle data for HELOC
const MOCK_IDENTITIES = {
  '4015551234': {
    last4: '1234',
    applicant: {
      firstName: 'John', lastName: 'Smith', dob: '1985-06-15', ssn: '444-44-4444',
      email: 'john.smith@email.com', phone: '(401) 555-1234',
      address: '100 Westminster St, Providence, RI 02903',
      employmentType: 'EMPLOYED', employerName: 'Citizens Financial Group',
      annualIncome: '95000', monthlyHousingPayment: '1800'
    },
    property: {
      propertyAddress: '100 Westminster St', propertyCity: 'Providence', propertyState: 'RI', propertyZip: '02903',
      propertyType: 'PRIMARY_RESIDENCE', estimatedPropertyValue: '450000', currentMortgageBalance: '280000',
      yearBuilt: '1995', squareFootage: '2200', propertyTaxAnnual: '5400', homeInsuranceAnnual: '1800', hoaMonthly: '0'
    },
    display: {
      name: 'John Smith', dob: 'Jun 15, 1985',
      address: '100 Westminster St, Providence, RI 02903',
      email: 'john.smith@email.com'
    }
  },
  '6175555678': {
    last4: '5678',
    applicant: {
      firstName: 'Jane', lastName: 'Williams', dob: '1990-03-22', ssn: '555-55-5555',
      email: 'jane.williams@email.com', phone: '(617) 555-5678',
      address: '245 Summer St, Boston, MA 02210',
      employmentType: 'EMPLOYED', employerName: 'Fidelity Investments',
      annualIncome: '120000', monthlyHousingPayment: '2200'
    },
    property: {
      propertyAddress: '245 Summer St', propertyCity: 'Boston', propertyState: 'MA', propertyZip: '02210',
      propertyType: 'PRIMARY_RESIDENCE', estimatedPropertyValue: '650000', currentMortgageBalance: '420000',
      yearBuilt: '2005', squareFootage: '2800', propertyTaxAnnual: '7200', homeInsuranceAnnual: '2400', hoaMonthly: '350'
    },
    display: {
      name: 'Jane Williams', dob: 'Mar 22, 1990',
      address: '245 Summer St, Boston, MA 02210',
      email: 'jane.williams@email.com'
    }
  },
  '5085554321': {
    last4: '4321',
    applicant: {
      firstName: 'Michael', lastName: 'Johnson', dob: '1978-11-08', ssn: '333-33-3333',
      email: 'michael.johnson@email.com', phone: '(508) 555-4321',
      address: '72 East Newton St, Boston, MA 02118',
      employmentType: 'EMPLOYED', employerName: 'Boston Medical Center',
      annualIncome: '85000', monthlyHousingPayment: '1500'
    },
    property: {
      propertyAddress: '72 East Newton St', propertyCity: 'Boston', propertyState: 'MA', propertyZip: '02118',
      propertyType: 'PRIMARY_RESIDENCE', estimatedPropertyValue: '520000', currentMortgageBalance: '310000',
      yearBuilt: '1988', squareFootage: '1900', propertyTaxAnnual: '6100', homeInsuranceAnnual: '1600', hoaMonthly: '0'
    },
    display: {
      name: 'Michael Johnson', dob: 'Nov 8, 1978',
      address: '72 East Newton St, Boston, MA 02118',
      email: 'michael.johnson@email.com'
    }
  },
  '4015550000': {
    last4: '0000',
    applicant: {
      firstName: 'Bob', lastName: 'Martinez', dob: '1975-09-30', ssn: '000-00-0000',
      email: 'bob.martinez@email.com', phone: '(401) 555-0000',
      address: '18 Broad St, Cranston, RI 02905',
      employmentType: 'SELF_EMPLOYED', employerName: 'Self Employed',
      annualIncome: '42000', monthlyHousingPayment: '900'
    },
    property: {
      propertyAddress: '18 Broad St', propertyCity: 'Cranston', propertyState: 'RI', propertyZip: '02905',
      propertyType: 'PRIMARY_RESIDENCE', estimatedPropertyValue: '280000', currentMortgageBalance: '195000',
      yearBuilt: '1972', squareFootage: '1400', propertyTaxAnnual: '3800', homeInsuranceAnnual: '1200', hoaMonthly: '0'
    },
    display: {
      name: 'Bob Martinez', dob: 'Sep 30, 1975',
      address: '18 Broad St, Cranston, RI 02905',
      email: 'bob.martinez@email.com'
    }
  }
}

export default function ProvePanel({ onVerified, onSkip }) {
  const [status, setStatus] = useState('idle') // idle | loading | verified | not_found
  const [phone, setPhone] = useState('')
  const [last4, setLast4] = useState('')
  const [verifiedData, setVerifiedData] = useState(null)

  async function handleVerify() {
    const digits = phone.replace(/\D/g, '')
    setStatus('loading')
    await new Promise(resolve => setTimeout(resolve, 1500))
    const identity = MOCK_IDENTITIES[digits]
    if (identity && identity.last4 === last4) {
      setVerifiedData(identity)
      setStatus('verified')
      onVerified(identity.applicant, identity.property)
    } else {
      setStatus('not_found')
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4 text-sm text-blue-700">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Verifying identity with Prove...
      </div>
    )
  }

  if (status === 'verified' && verifiedData) {
    return (
      <div className="p-4 bg-green-50 border border-green-300 rounded-xl mb-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-green-700 mb-2">
          <span>{'\u2713'}</span> Identity Verified
        </div>
        <div className="text-gray-700 space-y-0.5">
          <div className="font-medium">{verifiedData.display.name} &middot; DOB: {verifiedData.display.dob}</div>
          <div>{verifiedData.display.address}</div>
          <div>{verifiedData.display.email}</div>
        </div>
        <div className="mt-2 text-xs text-green-600">Fields have been prefilled &mdash; review and continue</div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base font-black tracking-tight text-blue-800">prove</span>
          <span className="text-xs bg-blue-700 text-white px-1.5 py-0.5 rounded font-bold leading-tight">ID</span>
        </div>
        <span className="text-sm font-semibold text-gray-700">Instant Identity Prefill</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">Enter your phone and last 4 digits of your SSN to prefill your application</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Mobile Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(401) 555-1234"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Last 4 of SSN</label>
          <input
            type="text"
            value={last4}
            onChange={e => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="1234"
            maxLength={4}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {status === 'not_found' && (
        <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
          <span>{'\u2715'}</span> Identity not found. Please fill the form manually.
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleVerify}
          disabled={!phone || last4.length < 4}
          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          Verify with Prove {'\u2192'}
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          or Fill manually {'\u2193'}
        </button>
      </div>
    </div>
  )
}
