export default function PropertyImage({ address, city, state, zip }) {
  const fullAddress = [address, city, state, zip].filter(Boolean).join(', ')

  return (
    <div className="w-full h-44 bg-gray-100 rounded-lg mb-4 flex flex-col items-center justify-center gap-2 text-gray-400">
      <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      {fullAddress ? (
        <>
          <span className="text-xs text-center px-4 max-w-xs">{fullAddress}</span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-citizens-green hover:underline"
          >
            View on Google Maps
          </a>
        </>
      ) : (
        <span className="text-xs">No property image available</span>
      )}
    </div>
  )
}
