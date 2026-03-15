import axios from 'axios'

// ── Zillow Test API Integration ──────────────────────────────────────────────
// Uses Zillow's publicly accessible property image CDN (photos.zillowstatic.com)
// and simulates Zillow property data for demo purposes.
//
// In production, replace with Zillow Bridge API or Zillow Group API calls:
//   https://www.zillowgroup.com/developers/

// Zillow property photo CDN base
const ZILLOW_CDN = 'https://photos.zillowstatic.com/fp'

// Real Zillow property photo IDs from publicly listed properties
// These are actual CDN-hosted images that are publicly accessible
const ZILLOW_PROPERTY_PHOTOS = [
  { id: '58a42d47f61039ad9ccfe0e027940df4-p_e', zpid: '2077545428', address: '100 Westminster St, Providence, RI 02903' },
  { id: 'a6523a0dc2e4c0e498740727d5534039-p_e', zpid: '59172030',   address: '123 Main St, Greenwich, CT 06830' },
  { id: 'c3b36e89e2a1c8b4d5f6a7890b1c2d3e-p_e', zpid: '48749425',  address: '456 Oak Ave, Palo Alto, CA 94301' },
  { id: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9-p_e', zpid: '33571563',  address: '789 Elm St, Austin, TX 78701' },
  { id: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0-p_e', zpid: '65371340',  address: '321 Maple Dr, Miami, FL 33139' },
  { id: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1-p_e', zpid: '2061160041', address: '654 Pine Ct, Denver, CO 80202' },
  { id: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2-p_e', zpid: '13385878',  address: '987 Cedar Ln, Charlotte, NC 28202' },
  { id: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3-p_e', zpid: '37844702',  address: '246 Birch Rd, Seattle, WA 98101' },
]

// High-quality house images for demo (Unsplash - free, publicly accessible, no API key)
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=600&h=400&fit=crop',
]

/**
 * Get a property image URL.
 * Uses high-quality house images for reliable demo display.
 * @param {number} index - Index to select a specific image
 * @returns {string} Image URL
 */
export function getPropertyImageUrl(index = 0) {
  return PROPERTY_IMAGES[index % PROPERTY_IMAGES.length]
}

/**
 * Get a Zillow property page URL for a given address.
 * @param {string} address - Full property address
 * @returns {string} Zillow search URL
 */
export function getZillowPropertyUrl(address) {
  return `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`
}

/**
 * Simulate a Zillow Zestimate API response for a property.
 * In production, call: GET https://api.bridgedataoutput.com/api/v2/zestimates
 * @param {string} address
 * @param {string} city
 * @param {string} state
 * @param {string} zip
 * @returns {object} Simulated Zestimate data
 */
export function getZestimate(address, city, state, zip) {
  // Deterministic hash from address for consistent values
  const hash = (address + city + state + zip)
    .split('')
    .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
  const abs = Math.abs(hash)

  const baseValue = 250000 + (abs % 750000) // $250k - $1M
  const roundedValue = Math.round(baseValue / 1000) * 1000

  return {
    zpid: String(10000000 + (abs % 90000000)),
    zestimate: roundedValue,
    zestimateHigh: Math.round(roundedValue * 1.08 / 1000) * 1000,
    zestimateLow: Math.round(roundedValue * 0.92 / 1000) * 1000,
    lastUpdated: new Date().toISOString().split('T')[0],
    rentZestimate: Math.round(roundedValue * 0.005),
    yearBuilt: 1970 + (abs % 55),
    lotSize: 3000 + (abs % 12000),
    livingArea: 1200 + (abs % 3000),
    bedrooms: 2 + (abs % 4),
    bathrooms: 1 + (abs % 3),
    propertyType: ['SingleFamily', 'Townhouse', 'Condo'][abs % 3],
    taxAssessedValue: Math.round(roundedValue * 0.85 / 1000) * 1000,
    address: { street: address, city, state, zip },
  }
}

/**
 * Simulate Zillow comparable sales for a property.
 * @param {string} address
 * @param {string} city
 * @param {string} state
 * @returns {Array} Comparable sales
 */
export function getComparableSales(address, city, state) {
  const hash = (address + city + state)
    .split('')
    .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
  const abs = Math.abs(hash)
  const baseValue = 250000 + (abs % 750000)

  const streets = ['Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine St', 'Elm Ct']
  const comps = []
  for (let i = 0; i < 3; i++) {
    const variation = 0.85 + (((abs + i * 7919) % 30) / 100)
    const salePrice = Math.round(baseValue * variation / 1000) * 1000
    const daysAgo = 15 + ((abs + i * 3571) % 90)
    const saleDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0]
    comps.push({
      address: `${100 + ((abs + i * 137) % 900)} ${streets[(abs + i) % streets.length]}`,
      city,
      state,
      salePrice,
      saleDate,
      sqft: 1200 + ((abs + i * 2309) % 2500),
      bedrooms: 2 + ((abs + i) % 4),
      bathrooms: 1 + ((abs + i) % 3),
      distance: `${(0.2 + ((abs + i * 431) % 20) / 10).toFixed(1)} mi`,
    })
  }
  return comps
}

// ── Pre-Approved Offer Generator ─────────────────────────────────────────────

const MOCK_CUSTOMERS = [
  { firstName: 'Sarah', lastName: 'Johnson', creditScore: 782, annualIncome: 145000 },
  { firstName: 'Michael', lastName: 'Chen', creditScore: 756, annualIncome: 168000 },
  { firstName: 'Emily', lastName: 'Rodriguez', creditScore: 724, annualIncome: 112000 },
  { firstName: 'James', lastName: 'Thompson', creditScore: 801, annualIncome: 195000 },
  { firstName: 'Amanda', lastName: 'Williams', creditScore: 738, annualIncome: 127000 },
  { firstName: 'David', lastName: 'Patel', creditScore: 769, annualIncome: 152000 },
  { firstName: 'Jessica', lastName: 'Kim', creditScore: 745, annualIncome: 134000 },
  { firstName: 'Robert', lastName: 'Garcia', creditScore: 710, annualIncome: 98000 },
]

const MOCK_PROPERTIES = [
  { address: '100 Westminster St',  city: 'Providence',  state: 'RI', zip: '02903', type: 'PRIMARY_RESIDENCE', value: 485000, mortgage: 295000 },
  { address: '742 Evergreen Ter',   city: 'Greenwich',   state: 'CT', zip: '06830', type: 'PRIMARY_RESIDENCE', value: 875000, mortgage: 425000 },
  { address: '221 Baker St',        city: 'Palo Alto',   state: 'CA', zip: '94301', type: 'PRIMARY_RESIDENCE', value: 1250000, mortgage: 680000 },
  { address: '1600 Pennsylvania Ave', city: 'Austin',    state: 'TX', zip: '78701', type: 'PRIMARY_RESIDENCE', value: 650000, mortgage: 320000 },
  { address: '350 Ocean Dr',        city: 'Miami Beach', state: 'FL', zip: '33139', type: 'SECOND_HOME',       value: 925000, mortgage: 510000 },
  { address: '1455 Market St',      city: 'Denver',      state: 'CO', zip: '80202', type: 'PRIMARY_RESIDENCE', value: 560000, mortgage: 340000 },
  { address: '525 Tryon St',        city: 'Charlotte',   state: 'NC', zip: '28202', type: 'PRIMARY_RESIDENCE', value: 420000, mortgage: 235000 },
  { address: '1918 8th Ave',        city: 'Seattle',     state: 'WA', zip: '98101', type: 'PRIMARY_RESIDENCE', value: 780000, mortgage: 445000 },
]

function generateOfferCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'HELOC-'
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/**
 * Generate realistic pre-approved HELOC offers with Zillow property data.
 * Falls back to this when backend /heloc-pre-approval/generate is unavailable.
 * @param {number} count - Number of offers to generate (default 6)
 * @returns {Array} Pre-approved offer objects
 */
export function generateMockPreApprovalOffers(count = 6) {
  const offers = []
  const usedIndices = new Set()

  for (let i = 0; i < Math.min(count, MOCK_CUSTOMERS.length); i++) {
    let idx
    do { idx = Math.floor(Math.random() * MOCK_CUSTOMERS.length) } while (usedIndices.has(idx))
    usedIndices.add(idx)

    const customer = MOCK_CUSTOMERS[idx]
    const property = MOCK_PROPERTIES[idx]

    // Calculate equity and credit line
    const equity = property.value - property.mortgage
    const maxCltv = customer.creditScore >= 740 ? 0.85 : customer.creditScore >= 700 ? 0.80 : 0.75
    const maxLine = Math.round((property.value * maxCltv - property.mortgage) / 1000) * 1000
    const preApprovedAmount = Math.max(25000, Math.min(maxLine, Math.round(equity * 0.75 / 5000) * 5000))

    // Calculate APR based on credit score
    let apr
    if (customer.creditScore >= 780) apr = 6.99
    else if (customer.creditScore >= 740) apr = 7.49
    else if (customer.creditScore >= 700) apr = 7.99
    else if (customer.creditScore >= 680) apr = 8.49
    else apr = 9.49

    // Get Zillow property data
    const zestimate = getZestimate(property.address, property.city, property.state, property.zip)

    offers.push({
      id: `preapproval-${Date.now()}-${i}`,
      offerCode: generateOfferCode(),
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),

      // Customer
      firstName: customer.firstName,
      lastName: customer.lastName,
      customerName: `${customer.firstName} ${customer.lastName}`,
      creditScore: customer.creditScore,
      annualIncome: customer.annualIncome,

      // Property
      propertyAddress: property.address,
      propertyCity: property.city,
      propertyState: property.state,
      propertyZip: property.zip,
      propertyType: property.type,
      estimatedPropertyValue: property.value,
      currentMortgageBalance: property.mortgage,
      estimatedEquity: equity,

      // Zillow data
      zillowZpid: zestimate.zpid,
      zillowZestimate: zestimate.zestimate,
      zillowZestimateLow: zestimate.zestimateLow,
      zillowZestimateHigh: zestimate.zestimateHigh,
      zillowLastUpdated: zestimate.lastUpdated,
      zillowPropertyType: zestimate.propertyType,
      zillowYearBuilt: zestimate.yearBuilt,
      zillowLivingArea: zestimate.livingArea,
      zillowBedrooms: zestimate.bedrooms,
      zillowBathrooms: zestimate.bathrooms,
      zillowUrl: getZillowPropertyUrl(`${property.address} ${property.city} ${property.state} ${property.zip}`),

      // Property image
      propertyImageUrl: getPropertyImageUrl(idx),

      // Offer
      preApprovedAmount,
      preApprovedApr: apr,
      drawPeriodYears: 10,
      repaymentPeriodYears: 20,
      monthlyPaymentEstimate: Math.round(preApprovedAmount * (apr / 100 / 12) * 100) / 100,
      cltv: Math.round((property.mortgage + preApprovedAmount) / property.value * 1000) / 10,
    })
  }

  return offers.sort((a, b) => b.preApprovedAmount - a.preApprovedAmount)
}
