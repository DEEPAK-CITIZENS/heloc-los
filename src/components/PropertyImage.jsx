import { useState } from 'react'
import { getZillowPropertyUrl } from '../api/zillowApi'

/**
 * Displays a property image with Zillow branding.
 * Uses imageUrl prop with fallback to house icon placeholder.
 */
export default function PropertyImage({ address, city, state, zip, imageUrl, className = '', compact = false }) {
  const [imgError, setImgError] = useState(false)
  const fullAddress = [address, city, state, zip].filter(Boolean).join(', ')
  const zillowUrl = fullAddress ? getZillowPropertyUrl(fullAddress) : null

  const height = compact ? 'h-32' : 'h-44'

  if (imageUrl && !imgError) {
    return (
      <div className={`relative w-full ${height} rounded-lg overflow-hidden group ${className}`}>
        <img
          src={imageUrl}
          alt={fullAddress || 'Property'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        {/* Zillow attribution overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {!compact && fullAddress && (
                <span className="text-xs text-white/90 truncate max-w-[200px]">{fullAddress}</span>
              )}
            </div>
            {zillowUrl && (
              <a
                href={zillowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-white/80 hover:text-white transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <ZillowLogo />
                View on Zillow
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Fallback: house icon placeholder
  return (
    <div className={`w-full ${height} bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 ${className}`}>
      <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      {fullAddress ? (
        <>
          <span className="text-xs text-center px-4 max-w-xs">{fullAddress}</span>
          <div className="flex gap-3">
            {zillowUrl && (
              <a href={zillowUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <ZillowLogo /> Zillow
              </a>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
              target="_blank" rel="noopener noreferrer"
              className="text-xs text-citizens-green hover:underline"
            >
              Google Maps
            </a>
          </div>
        </>
      ) : (
        <span className="text-xs">No property image available</span>
      )}
    </div>
  )
}

function ZillowLogo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
      <path d="M12 1L1 8.5V23h22V8.5L12 1zm0 2.3L21 9v12H3V9l9-5.7z"/>
      <text x="7" y="19" fontSize="10" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">Z</text>
    </svg>
  )
}
