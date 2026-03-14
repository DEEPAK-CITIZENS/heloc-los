import axios from 'axios'

const api = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } })

// HELOC Application CRUD
export function submitApplication(payload) {
  return api.post('/heloc-application', payload).then(r => r.data)
}
export function getApplications() {
  return api.get('/heloc-application').then(r => r.data)
}
export function getApplication(id) {
  return api.get(`/heloc-application/${id}`).then(r => r.data)
}
export function reprocessApplication(id, ssn) {
  return api.post(`/heloc-application/${id}/reprocess`, { ssn }).then(r => r.data)
}

// Document upload (same pattern as auto-loan)
export async function uploadDocument(appId, documentType, file) {
  const formData = new FormData()
  formData.append('documentType', documentType)
  formData.append('file', file)
  const { data } = await api.post(`/heloc-application/${appId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}
export async function getDocuments(appId) {
  const { data } = await api.get(`/heloc-application/${appId}/documents`)
  return data
}

// Pre-qualification & Deal Structuring
export function preQualify(payload) {
  return api.post('/heloc-pre-qual', payload).then(r => r.data)
}
export function dealStructure(payload) {
  return api.post('/heloc-deal-structure', payload).then(r => r.data)
}
export function getAllApplications() {
  return api.get('/heloc-application?all=true').then(r => r.data)
}

// Counter-Offer & Adverse Action
export function getCounterOffer(id) {
  return api.get(`/heloc-application/${id}/counter-offer`).then(r => r.data)
}
export function getAdverseActionNoticeUrl(id) {
  return `/api/heloc-application/${id}/adverse-action-notice`
}

// Lien Recording (replaces Title Transfer)
const lienApi = axios.create({ baseURL: '/lien-api', headers: { 'Content-Type': 'application/json' } })
export async function initiateLienRecording(payload) {
  const { data } = await lienApi.post('/lien-recording', payload)
  return data
}
export async function getLienRecording(applicationId) {
  const { data } = await lienApi.get(`/lien-recording/application/${applicationId}`)
  return data
}

// E-Sign
const esignApi = axios.create({ baseURL: '/esign-api', headers: { 'Content-Type': 'application/json' } })
export async function sendForSigning(applicationId) {
  const { data } = await esignApi.post('/esign/send', { applicationId })
  return data
}
export async function getEsignStatus(applicationId) {
  const { data } = await esignApi.get(`/esign/status/${applicationId}`)
  return data
}

// Portfolio Analytics
const portfolioApi = axios.create({ baseURL: '/portfolio-api', headers: { 'Content-Type': 'application/json' } })
export async function getPortfolioMetrics() {
  const { data } = await portfolioApi.get('/heloc-portfolio/metrics')
  return data
}

// Pre-Approval
const preapprovalApi = axios.create({ baseURL: '/preapproval-api', headers: { 'Content-Type': 'application/json' } })
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
