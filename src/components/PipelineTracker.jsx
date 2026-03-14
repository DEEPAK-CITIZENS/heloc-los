const STEPS = ['Submitted', 'Credit Review', 'Property Appraisal', 'Underwriting', 'Closed']

function getStepStates(status, appraised) {
  const map = {
    SUBMITTED:          ['current', 'pending', 'pending', 'pending', 'pending'],
    CREDIT_REVIEW:      ['done',    'current', 'pending', 'pending', 'pending'],
    PROPERTY_APPRAISED: ['done',    'done',    'current', 'pending', 'pending'],
    UNDERWRITING:       ['done',    'done',    'done',    'current', 'pending'],
    BOOKED:             ['done',    'done',    'done',    'done',    'approved'],
    DENIED:             ['done',    'done',    appraised ? 'done' : 'denied', appraised ? 'denied' : 'pending', 'pending'],
    MANUAL_REVIEW:      ['done',    'done',    appraised ? 'done' : 'pending', 'manual',  'pending'],
  }
  return map[status] || map.SUBMITTED
}

function circleClass(state) {
  switch (state) {
    case 'done':     return 'bg-citizens-green border-citizens-green text-white'
    case 'current':  return 'bg-white border-citizens-green text-citizens-green animate-pulse'
    case 'approved': return 'bg-green-500 border-green-500 text-white'
    case 'denied':   return 'bg-red-500 border-red-500 text-white'
    case 'manual':   return 'bg-yellow-500 border-yellow-500 text-white'
    default:         return 'bg-white border-gray-300 text-gray-400'
  }
}

function circleIcon(state, idx) {
  switch (state) {
    case 'done':     return '\u2713'
    case 'approved': return '\u2713'
    case 'denied':   return '\u2717'
    case 'manual':   return '!'
    default:         return idx + 1
  }
}

export default function PipelineTracker({ status, appraised }) {
  const states = getStepStates(status, appraised)

  return (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${circleClass(states[i])}`}>
              {circleIcon(states[i], i)}
            </div>
            <span className={`mt-1 text-xs text-center ${states[i] !== 'pending' ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 ${states[i] === 'done' || states[i] === 'approved' ? 'bg-citizens-green' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
