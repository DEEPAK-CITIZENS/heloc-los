const STYLES = {
  SUBMITTED:          'bg-gray-100 text-gray-700',
  CREDIT_REVIEW:      'bg-citizens-green-light text-citizens-green',
  PROPERTY_APPRAISED: 'bg-citizens-navy-light text-citizens-navy',
  UNDERWRITING:       'bg-purple-100 text-purple-700',
  BOOKED:             'bg-green-100 text-green-700',
  DENIED:             'bg-red-100 text-red-700',
  MANUAL_REVIEW:      'bg-yellow-100 text-yellow-700'
}

export default function StatusBadge({ status }) {
  const cls = STYLES[status] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status?.replace(/_/g, ' ') ?? '\u2014'}
    </span>
  )
}
