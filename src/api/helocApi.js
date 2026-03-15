import axios from 'axios'

// ── Shared error interceptor ────────────────────────────────────────────────
function attachInterceptor(instance, label) {
  instance.interceptors.response.use(
    response => response,
    error => {
      const { config, response } = error
      if (response) {
        console.error(
          `[${label}] ${config?.method?.toUpperCase()} ${config?.url} → ${response.status}`,
          response.data
        )
      } else {
        console.error(`[${label}] ${config?.method?.toUpperCase()} ${config?.url} → Network Error`, error.message)
      }
      return Promise.reject(error)
    }
  )
  return instance
}

const api = attachInterceptor(
  axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } }),
  'HELOC-API'
)

const lienApi = attachInterceptor(
  axios.create({ baseURL: '/lien-api', headers: { 'Content-Type': 'application/json' } }),
  'LIEN-API'
)

const esignApi = attachInterceptor(
  axios.create({ baseURL: '/esign-api', headers: { 'Content-Type': 'application/json' } }),
  'ESIGN-API'
)

const portfolioApi = attachInterceptor(
  axios.create({ baseURL: '/portfolio-api', headers: { 'Content-Type': 'application/json' } }),
  'PORTFOLIO-API'
)

const preapprovalApi = attachInterceptor(
  axios.create({ baseURL: '/preapproval-api', headers: { 'Content-Type': 'application/json' } }),
  'PREAPPROVAL-API'
)

// ── Response normalization ───────────────────────────────────────────────────
// Maps backend LoanApplication entity fields to the shape the frontend expects.
const STATUS_MAP = {
  STARTED: 'SUBMITTED',
  PROFILE_COMPLETE: 'CREDIT_REVIEW',
  CREDIT_PULLED: 'CREDIT_REVIEW',
  PRICED: 'PROPERTY_APPRAISED',
  DOCUMENTS_UPLOADED: 'MANUAL_REVIEW',
  DECISIONED: 'DENIED',
  FUNDED: 'BOOKED',
}

function deriveStatus(raw) {
  // Use underwritingStatus for terminal states when available
  const uw = raw.underwritingStatus
  if (uw === 'APPROVED') return 'BOOKED'
  if (uw === 'DENIED') return 'DENIED'
  if (uw === 'MANUAL_REVIEW') return 'MANUAL_REVIEW'
  // Fall back to STATUS_MAP for in-progress states
  return STATUS_MAP[raw.applicationStatus] ?? raw.applicationStatus ?? raw.status ?? 'SUBMITTED'
}

function getSubmissionData(id) {
  try {
    const store = JSON.parse(localStorage.getItem('pilot_heloc_submissions') || '{}')
    return store[id] ?? null
  } catch { return null }
}

function normalizeApplication(raw) {
  if (!raw) return raw
  const status = deriveStatus(raw)
  const parts = (raw.propertyAddress || '').split(',').map(s => s.trim())

  // Merge locally-stored submission data (applicant, propertyInfo, HELOC details)
  const local = getSubmissionData(raw.id)

  return {
    ...raw,
    status,
    submittedAt: raw.createdDate ?? raw.submittedAt,
    requestedCreditLine: raw.requestedCreditLine ?? raw.loanAmount,
    drawPeriodYears: raw.drawPeriodYears ?? local?.drawPeriodYears,
    repaymentPeriodYears: raw.repaymentPeriodYears ?? local?.repaymentPeriodYears,
    intendedUse: raw.intendedUse ?? local?.intendedUse,
    applicant: raw.applicant ?? local?.applicant ?? null,
    propertyInfo: raw.propertyInfo ?? local?.propertyInfo ?? (raw.propertyAddress ? {
      propertyAddress: parts[0] || '',
      propertyCity: parts[1] || '',
      propertyState: (parts[2] || '').split(' ')[0] || '',
      propertyZip: (parts[2] || '').split(' ')[1] || '',
    } : null),

    // ── Pipeline result fields from backend ──────────────────────────────
    creditScore: raw.creditScore ?? null,
    creditDecisionType: raw.creditDecision ?? null,
    creditDecisionReasons: raw.creditDecisionReasons ?? null,
    dti: raw.dti ?? null,
    ltv: raw.cltv ?? null,
    interestRate: raw.interestRate ?? null,

    // Open Banking (Argyle)
    bankName: raw.bankName ?? null,
    maskedAccountNumber: raw.maskedAccountNumber ?? null,
    monthlyIncome: raw.monthlyIncome ?? null,
    monthlyExpenses: raw.monthlyExpenses ?? null,
    cashflowScore: raw.cashflowScore ?? null,
    autopayEnrolled: raw.autopayEnrolled ?? null,

    // AVM Property Appraisal
    appraisedValue: raw.appraisedValue ?? null,
    avmConfidence: raw.avmConfidence ?? null,
    appraisalDate: raw.appraisalDate ?? null,

    // Underwriting
    underwritingRecommendation: raw.underwritingStatus ?? null,
    underwritingNotes: raw.underwritingNotes ?? null,
    approvedCreditLine: raw.approvedCreditLine ?? null,
    monthlyPayment: raw.monthlyPayment ?? null,

    // Derived flags
    banked: !!(raw.bankName),
    appraised: !!(raw.appraisedValue),
  }
}

// ── HELOC Application CRUD ──────────────────────────────────────────────────
export function submitApplication(payload) {
  return api.post('/application', payload).then(r => normalizeApplication(r.data))
}
export function getApplications() {
  return api.get('/application')
    .then(r => (Array.isArray(r.data) ? r.data : []).map(normalizeApplication))
    .catch(() => [])
}
export function getApplication(id) {
  return api.get(`/application/${id}`).then(r => normalizeApplication(r.data))
}
export function reprocessApplication(id, ssn) {
  return api.post(`/application/${id}/reprocess`, { ssn }).then(r => normalizeApplication(r.data))
}
export function decisionApplication(id, decision, reason) {
  return api.post(`/application/${id}/decision`, { decision, reason }).then(r => normalizeApplication(r.data))
}

// ── Documents ───────────────────────────────────────────────────────────────
export async function uploadDocument(appId, documentType, file) {
  const formData = new FormData()
  formData.append('documentType', documentType)
  formData.append('file', file)
  const { data } = await api.post(`/application/${appId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}
export async function getDocuments(appId) {
  const { data } = await api.get(`/application/${appId}/documents`)
  return data
}

// ── Pre-qualification & Deal Structuring ────────────────────────────────────
export function preQualify(payload) {
  return api.post('/heloc-pre-qual', payload).then(r => r.data)
}
export function dealStructure(payload) {
  return api.post('/heloc-deal-structure', payload).then(r => r.data)
}
export function getAllApplications() {
  return api.get('/application')
    .then(r => (Array.isArray(r.data) ? r.data : []).map(normalizeApplication))
    .catch(() => [])
}

// ── Counter-Offer & Adverse Action ──────────────────────────────────────────
export function getCounterOffer(id) {
  return api.get(`/application/${id}/counter-offer`).then(r => r.data)
}
export function getAdverseActionNoticeUrl(id) {
  return `/api/application/${id}/adverse-action-notice`
}

// ── Lien Recording (client-side mock — no backend service on port 9094) ──────
const LIEN_STORAGE_KEY = 'pilot_heloc_lien_recordings'
const LIEN_STEPS = ['PENDING', 'TITLE_SEARCH', 'LIEN_FILED', 'CLOSING_DISCLOSURE', 'COMPLETED']

function loadLienStore() {
  try { return JSON.parse(localStorage.getItem(LIEN_STORAGE_KEY) || '{}') } catch { return {} }
}
function saveLienStore(store) {
  try { localStorage.setItem(LIEN_STORAGE_KEY, JSON.stringify(store)) } catch { /* ignore */ }
}

function advanceLienStatus(recording) {
  const elapsed = Date.now() - new Date(recording.initiatedAt).getTime()
  const stepMs = 8000 // advance every 8 seconds
  const idx = Math.min(Math.floor(elapsed / stepMs), LIEN_STEPS.length - 1)
  return { ...recording, status: LIEN_STEPS[idx] }
}

export async function initiateLienRecording(payload) {
  const store = loadLienStore()
  if (store[payload.applicationId]) return advanceLienStatus(store[payload.applicationId])
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let num = 'LR-'
  for (let i = 0; i < 8; i++) num += chars[Math.floor(Math.random() * chars.length)]
  const recording = {
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    applicationId: payload.applicationId,
    recordingNumber: num,
    trackingNumber: num,
    status: 'PENDING',
    propertyAddress: payload.propertyAddress,
    creditLineAmount: payload.creditLineAmount,
    helocAccountNumber: payload.helocAccountNumber,
    borrowerName: payload.borrowerName,
    initiatedAt: new Date().toISOString(),
  }
  store[payload.applicationId] = recording
  saveLienStore(store)
  return recording
}

export async function getLienRecording(applicationId) {
  const store = loadLienStore()
  const recording = store[applicationId]
  if (!recording) throw new Error('Not found')
  const updated = advanceLienStatus(recording)
  store[applicationId] = updated
  saveLienStore(store)
  return updated
}

// ── E-Sign (client-side mock — no backend service on port 9098) ─────────────
const ESIGN_STORAGE_KEY = 'pilot_heloc_esign'

function loadEsignStore() {
  try { return JSON.parse(localStorage.getItem(ESIGN_STORAGE_KEY) || '{}') } catch { return {} }
}
function saveEsignStore(store) {
  try { localStorage.setItem(ESIGN_STORAGE_KEY, JSON.stringify(store)) } catch { /* ignore */ }
}

function advanceEsignStatus(esign) {
  const elapsed = Date.now() - new Date(esign.sentAt).getTime()
  if (elapsed > 12000) return { ...esign, status: 'COMPLETED', completedAt: new Date(new Date(esign.sentAt).getTime() + 12000).toISOString() }
  if (elapsed > 4000) return { ...esign, status: 'SENT' }
  return { ...esign, status: 'PENDING' }
}

export async function sendForSigning(applicationId) {
  const store = loadEsignStore()
  if (store[applicationId]) return advanceEsignStatus(store[applicationId])
  const chars = 'abcdef0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)]
  const esign = {
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    applicationId,
    status: 'PENDING',
    signingToken: token,
    sentAt: new Date().toISOString(),
    completedAt: null,
  }
  store[applicationId] = esign
  saveEsignStore(store)
  return esign
}

export async function getEsignStatus(applicationId) {
  const store = loadEsignStore()
  const esign = store[applicationId]
  if (!esign) return null
  const updated = advanceEsignStatus(esign)
  store[applicationId] = updated
  saveEsignStore(store)
  return updated
}

// ── Portfolio Analytics ─────────────────────────────────────────────────────
export async function getPortfolioMetrics() {
  const { data } = await portfolioApi.get('/heloc-portfolio/metrics')
  return data
}

// ── Pre-Approval ────────────────────────────────────────────────────────────
export async function getPreApprovalOffers() {
  const { data } = await preapprovalApi.get('/heloc-pre-approval/offers')
  return data
}
export async function generatePreApprovalOffers(request = {}) {
  const { data } = await preapprovalApi.post('/heloc-pre-approval/generate', request)
  return data
}
export async function redeemPreApprovalOffer(offerCode) {
  const { data } = await preapprovalApi.post(`/heloc-pre-approval/redeem/${offerCode}`)
  return data
}

// ── Health Check ────────────────────────────────────────────────────────────
export async function healthCheck() {
  try {
    await api.get('/application', { timeout: 5000 })
    return { ok: true }
  } catch (err) {
    return { ok: false, status: err.response?.status, message: err.response?.data?.message || err.message }
  }
}
