const STEPS = [
  { key: 'submitted',    label: 'Submitted' },
  { key: 'credit',       label: 'Credit Review' },
  { key: 'appraisal',    label: 'Property Appraisal' },
  { key: 'underwriting', label: 'Underwriting' },
  { key: 'closed',       label: 'Closed' },
]

// Returns array of states for each step
// states: 'done' | 'current' | 'approved' | 'denied' | 'manual' | 'pending'
function getStepStates(status, appraised) {
  const deniedAtCredit = status === 'DENIED' && !appraised
  const deniedAtUnderwriting = status === 'DENIED' && !!appraised
  if (status === 'SUBMITTED')           return ['done',    'pending', 'pending', 'pending', 'pending']
  if (status === 'CREDIT_REVIEW')       return ['done',    'current', 'pending', 'pending', 'pending']
  if (deniedAtCredit)                   return ['done',    'denied',  'pending', 'pending', 'pending']
  if (status === 'PROPERTY_APPRAISED')  return ['done',    'done',    'current', 'pending', 'pending']
  if (status === 'UNDERWRITING')        return ['done',    'done',    'done',    'current', 'pending']
  if (deniedAtUnderwriting)             return ['done',    'done',    'done',    'denied',  'pending']
  if (status === 'MANUAL_REVIEW')       return ['done',    'done',    'done',    'done',    'manual']
  if (status === 'BOOKED')              return ['done',    'done',    'done',    'done',    'approved']
  return                                       ['pending', 'pending', 'pending', 'pending', 'pending']
}

function circleClass(state) {
  switch (state) {
    case 'done':     return 'bg-citizens-green border-citizens-green text-white'
    case 'current':  return 'bg-white border-citizens-green text-citizens-green'
    case 'approved': return 'bg-green-600 border-green-600 text-white'
    case 'denied':   return 'bg-red-500 border-red-500 text-white'
    case 'manual':   return 'bg-yellow-500 border-yellow-500 text-white'
    default:         return 'bg-white border-gray-300 text-gray-400'
  }
}

function circleIcon(state, index) {
  if (state === 'done' || state === 'approved') return '\u2713'
  if (state === 'denied')  return '\u2715'
  if (state === 'manual')  return '!'
  if (state === 'current') return index + 1
  return index + 1
}

function closedLabel(state) {
  if (state === 'approved') return 'Approved'
  if (state === 'denied')   return 'Declined'
  if (state === 'manual')   return 'Review'
  return 'Closed'
}

export default function PipelineTracker({ status, appraised }) {
  const states = getStepStates(status, appraised)
  return (
    <div className="flex items-center my-6">
      {STEPS.map((step, i) => {
        const state = states[i]
        const isLast = i === STEPS.length - 1
        const connectorFilled = state === 'done' || state === 'approved'
        const labelActive = state !== 'pending'
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${circleClass(state)}`}>
                {circleIcon(state, i + 1)}
              </div>
              <span className={`mt-1 text-xs text-center leading-tight whitespace-nowrap ${labelActive ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                {step.key === 'closed' ? closedLabel(state) : step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-1 ${connectorFilled ? 'bg-citizens-green' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
