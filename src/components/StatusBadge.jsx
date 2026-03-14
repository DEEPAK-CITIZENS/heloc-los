const STYLES = {
  SUBMITTED:          'bg-blue-100 text-blue-700',
  CREDIT_REVIEW:      'bg-indigo-100 text-indigo-700',
  PROPERTY_APPRAISED: 'bg-cyan-100 text-cyan-700',
  UNDERWRITING:       'bg-purple-100 text-purple-700',
  BOOKED:             'bg-green-100 text-green-700',
  DENIED:             'bg-red-100 text-red-700',
  MANUAL_REVIEW:      'bg-yellow-100 text-yellow-700',
  BANKING_CONNECTED:  'bg-teal-100 text-teal-700',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-gray-100 text-gray-600'
  const label = (status || 'UNKNOWN').replace(/_/g, ' ')
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}
