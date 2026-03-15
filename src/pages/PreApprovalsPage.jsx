import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

const STORAGE_KEY = 'pilot_heloc_preapprovals'

function fmt(val) {
  if (val == null) return '\u2014'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

// ── Mock property listings with Zillow image URLs ───────────────────────────
const MOCK_PROPERTIES = [
  {
    propertyAddress: '45 Benefit Street',
    propertyCity: 'Providence',
    propertyState: 'RI',
    propertyZip: '02903',
    propertyType: 'PRIMARY_RESIDENCE',
    estimatedValue: 685000,
    currentMortgage: 320000,
    yearBuilt: 1920,
    sqft: 2800,
    beds: 4,
    baths: 2.5,
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=768&q=80',
    customerName: 'Sarah Mitchell',
    firstName: 'Sarah',
    lastName: 'Mitchell',
  },
  {
    propertyAddress: '112 Blackstone Blvd',
    propertyCity: 'Providence',
    propertyState: 'RI',
    propertyZip: '02906',
    propertyType: 'PRIMARY_RESIDENCE',
    estimatedValue: 925000,
    currentMortgage: 450000,
    yearBuilt: 1935,
    sqft: 3600,
    beds: 5,
    baths: 3.5,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=768&q=80',
    customerName: 'James Harrington',
    firstName: 'James',
    lastName: 'Harrington',
  },
  {
    propertyAddress: '88 Ocean Road',
    propertyCity: 'Narragansett',
    propertyState: 'RI',
    propertyZip: '02882',
    propertyType: 'SECOND_HOME',
    estimatedValue: 1250000,
    currentMortgage: 600000,
    yearBuilt: 2005,
    sqft: 4200,
    beds: 5,
    baths: 4,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=768&q=80',
    customerName: 'Diana Rossi',
    firstName: 'Diana',
    lastName: 'Rossi',
  },
  {
    propertyAddress: '27 Kay Street',
    propertyCity: 'Newport',
    propertyState: 'RI',
    propertyZip: '02840',
    propertyType: 'PRIMARY_RESIDENCE',
    estimatedValue: 780000,
    currentMortgage: 380000,
    yearBuilt: 1890,
    sqft: 2200,
    beds: 3,
    baths: 2,
    imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=768&q=80',
    customerName: 'Robert Chen',
    firstName: 'Robert',
    lastName: 'Chen',
  },
  {
    propertyAddress: '5 Rumstick Road',
    propertyCity: 'Barrington',
    propertyState: 'RI',
    propertyZip: '02806',
    propertyType: 'PRIMARY_RESIDENCE',
    estimatedValue: 560000,
    currentMortgage: 275000,
    yearBuilt: 1975,
    sqft: 2100,
    beds: 4,
    baths: 2,
    imageUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=768&q=80',
    customerName: 'Maria Santos',
    firstName: 'Maria',
    lastName: 'Santos',
  },
  {
    propertyAddress: '201 Waterman Street',
    propertyCity: 'Providence',
    propertyState: 'RI',
    propertyZip: '02906',
    propertyType: 'PRIMARY_RESIDENCE',
    estimatedValue: 475000,
    currentMortgage: 220000,
    yearBuilt: 1960,
    sqft: 1800,
    beds: 3,
    baths: 1.5,
    imageUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=768&q=80',
    customerName: 'David Patel',
    firstName: 'David',
    lastName: 'Patel',
  },
]

function generateOfferCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'HELOC-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function generateOffers() {
  const count = 3 + Math.floor(Math.random() * 3) // 3-5 offers
  const shuffled = [...MOCK_PROPERTIES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  return selected.map(prop => {
    const equity = prop.estimatedValue - prop.currentMortgage
    const maxLine = Math.round(equity * 0.8 / 1000) * 1000
    const preApprovedAmount = Math.round((maxLine * (0.5 + Math.random() * 0.4)) / 1000) * 1000
    const apr = 6.25 + Math.random() * 3.5
    return {
      ...prop,
      offerCode: generateOfferCode(),
      estimatedEquity: equity,
      preApprovedAmount,
      preApprovedApr: Math.round(apr * 100) / 100,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
}

function loadOffers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveOffers(offers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offers))
}

// ── Offer Card Component ────────────────────────────────────────────────────
function OfferCard({ offer, onRedeem, redeeming }) {
  const redeemed = offer.status === 'REDEEMED'
  const expired  = offer.status === 'EXPIRED'
  const [imgError, setImgError] = useState(false)

  return (
    <div className={`card overflow-hidden flex flex-col transition-shadow hover:shadow-lg
      ${redeemed ? 'opacity-60' : ''} ${expired ? 'opacity-40' : ''}`}>

      {/* Property Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {offer.imageUrl && !imgError ? (
          <img
            src={offer.imageUrl}
            alt={`${offer.propertyAddress}, ${offer.propertyCity}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-citizens-green-light to-citizens-green-pale">
            <svg className="w-16 h-16 text-citizens-green opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
        )}

        {/* Status badge overlay */}
        <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm
          ${redeemed ? 'bg-gray-800 text-white' :
            expired ? 'bg-red-600 text-white' :
            'bg-citizens-green text-white'}`}>
          {offer.status ?? 'ACTIVE'}
        </span>

        {/* Property type badge */}
        {offer.propertyType && offer.propertyType !== 'PRIMARY_RESIDENCE' && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full bg-white/90 text-gray-700 shadow-sm">
            {offer.propertyType.replace(/_/g, ' ')}
          </span>
        )}

        {/* Address overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <p className="text-white font-bold text-sm truncate">{offer.propertyAddress}</p>
          <p className="text-white/80 text-xs">{offer.propertyCity}, {offer.propertyState} {offer.propertyZip}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Property stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {offer.beds && <span>{offer.beds} bed</span>}
          {offer.baths && <span>{offer.baths} bath</span>}
          {offer.sqft && <span>{offer.sqft.toLocaleString()} sqft</span>}
          {offer.yearBuilt && <span>Built {offer.yearBuilt}</span>}
        </div>

        {/* Financial details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Home Value</p>
            <p className="font-semibold text-gray-800 text-sm">{fmt(offer.estimatedValue)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Est. Equity</p>
            <p className="font-semibold text-gray-800 text-sm">{fmt(offer.estimatedEquity)}</p>
          </div>
        </div>

        {/* Pre-approved line highlight */}
        <div className="bg-citizens-green-light rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-citizens-green font-medium uppercase tracking-wide">Pre-Approved Credit Line</p>
          <p className="text-2xl font-bold text-citizens-green">{fmt(offer.preApprovedAmount)}</p>
          <p className="text-xs text-citizens-green mt-0.5">at {offer.preApprovedApr?.toFixed(2)}% APR</p>
        </div>

        {/* Customer and offer code */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{offer.customerName}</span>
          <span className="font-mono">{offer.offerCode}</span>
        </div>

        {/* Action button */}
        <div className="mt-auto pt-1">
          {!redeemed && !expired && (
            <button
              onClick={() => onRedeem(offer)}
              disabled={redeeming}
              className="btn-primary w-full disabled:opacity-50"
            >
              {redeeming ? 'Redeeming\u2026' : 'Redeem & Start Application'}
            </button>
          )}
          {redeemed && (
            <p className="text-xs text-gray-400 text-center py-2">This offer has been redeemed.</p>
          )}
          {expired && (
            <p className="text-xs text-red-400 text-center py-2">This offer has expired.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function PreApprovalsPage() {
  const navigate = useNavigate()
  const [offers, setOffers]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [redeeming, setRedeeming] = useState(null)

  useEffect(() => {
    const stored = loadOffers()
    setOffers(stored)
    setLoading(false)
  }, [])

  function handleGenerate() {
    setGenerating(true)
    // Simulate a brief delay for realism
    setTimeout(() => {
      const newOffers = generateOffers()
      // Keep redeemed offers, replace everything else
      const kept = offers.filter(o => o.status === 'REDEEMED')
      const all = [...newOffers, ...kept]
      saveOffers(all)
      setOffers(all)
      setGenerating(false)
    }, 800)
  }

  function handleRedeem(offer) {
    setRedeeming(offer.offerCode)
    // Mark as redeemed in localStorage
    setTimeout(() => {
      const updated = offers.map(o =>
        o.offerCode === offer.offerCode ? { ...o, status: 'REDEEMED' } : o
      )
      saveOffers(updated)
      setOffers(updated)
      navigate('/apply', {
        state: {
          preApproval: {
            offerCode: offer.offerCode,
            firstName: offer.firstName,
            lastName: offer.lastName,
            preApprovedAmount: offer.preApprovedAmount,
            preApprovedApr: offer.preApprovedApr,
            propertyAddress: offer.propertyAddress,
            propertyCity: offer.propertyCity,
            propertyState: offer.propertyState,
            propertyZip: offer.propertyZip,
            estimatedValue: offer.estimatedValue,
            currentMortgage: offer.currentMortgage,
          }
        }
      })
    }, 400)
  }

  if (loading) return <LoadingSpinner message="Loading pre-approval offers\u2026" />

  const active   = offers.filter(o => o.status === 'ACTIVE')
  const redeemed = offers.filter(o => o.status === 'REDEEMED')

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label mb-1">Citizens HELOC</p>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Approval Offers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Property-based HELOC pre-approval offers powered by Zillow home valuations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerate} disabled={generating} className="btn-primary disabled:opacity-50">
            {generating ? 'Generating\u2026' : 'Generate Offers'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {offers.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="mx-auto w-24 h-24 rounded-full bg-citizens-green-light flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-citizens-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <p className="font-medium text-gray-600 text-lg">No pre-approval offers yet</p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            Click &ldquo;Generate Offers&rdquo; to create property-based HELOC pre-approval offers
            with estimated equity and credit line amounts.
          </p>
        </div>
      )}

      {/* Active Offers */}
      {active.length > 0 && (
        <>
          <p className="section-label mb-3">Active Offers ({active.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {active.map(offer => (
              <OfferCard
                key={offer.offerCode}
                offer={offer}
                onRedeem={handleRedeem}
                redeeming={redeeming === offer.offerCode}
              />
            ))}
          </div>
        </>
      )}

      {/* Redeemed Offers */}
      {redeemed.length > 0 && (
        <>
          <p className="section-label mb-3">Redeemed ({redeemed.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {redeemed.map(offer => (
              <OfferCard
                key={offer.offerCode}
                offer={offer}
                onRedeem={handleRedeem}
                redeeming={false}
              />
            ))}
          </div>
        </>
      )}

      {/* Zillow attribution footer */}
      {offers.length > 0 && (
        <div className="mt-8 pt-4 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-400">
          <span>Property images sourced from Zillow. Valuations are estimates only.</span>
        </div>
      )}
    </div>
  )
}
