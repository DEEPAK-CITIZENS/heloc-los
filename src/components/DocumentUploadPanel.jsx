import { useState, useEffect, useRef } from 'react'
import { uploadDocument, getDocuments } from '../api/helocApi'

const DOC_TYPES = [
  { value: 'MORTGAGE_STATEMENT', label: 'Mortgage Statement' },
  { value: 'PROPERTY_TAX', label: 'Property Tax Bill' },
  { value: 'PROPERTY_DEED', label: 'Property Deed' },
  { value: 'PAY_STUB', label: 'Pay Stub' },
  { value: 'GOVERNMENT_ID', label: 'Government ID' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'HOMEOWNERS_INSURANCE', label: 'Homeowners Insurance' },
]

const FIELD_DEFS = {
  PAY_STUB: [
    { key: 'employer', label: 'Employer', regex: /employer[:\s]+(.+)/i },
    { key: 'employee', label: 'Employee', regex: /employee[:\s]+(.+)/i },
    { key: 'grossPay', label: 'Gross Pay', regex: /gross\s*pay[:\s$]+([0-9,.]+)/i },
    { key: 'payPeriod', label: 'Pay Period', regex: /pay\s*period[:\s]+(.+)/i },
    { key: 'ytd', label: 'YTD Earnings', regex: /ytd[:\s$]+([0-9,.]+)/i },
  ],
  GOVERNMENT_ID: [
    { key: 'name', label: 'Name', regex: /(?:name|full\s*name)[:\s]+(.+)/i },
    { key: 'dob', label: 'Date of Birth', regex: /(?:dob|date\s*of\s*birth|born)[:\s]+(.+)/i },
    { key: 'idNumber', label: 'ID Number', regex: /(?:id|license|number)[:\s#]+([A-Z0-9-]+)/i },
    { key: 'address', label: 'Address', regex: /(?:address|addr)[:\s]+(.+)/i },
  ],
  BANK_STATEMENT: [
    { key: 'accountHolder', label: 'Account Holder', regex: /(?:account\s*holder|name)[:\s]+(.+)/i },
    { key: 'accountNumber', label: 'Account Number', regex: /(?:account|acct)[:\s#]+([*0-9-]+)/i },
    { key: 'balance', label: 'Balance', regex: /(?:balance|ending\s*balance)[:\s$]+([0-9,.]+)/i },
  ],
  MORTGAGE_STATEMENT: [
    { key: 'lender', label: 'Lender', regex: /(?:lender|servicer|bank)[:\s]+(.+)/i },
    { key: 'balance', label: 'Outstanding Balance', regex: /(?:balance|principal)[:\s$]+([0-9,.]+)/i },
    { key: 'payment', label: 'Monthly Payment', regex: /(?:payment|monthly)[:\s$]+([0-9,.]+)/i },
    { key: 'rate', label: 'Interest Rate', regex: /(?:rate|interest)[:\s]+([0-9.]+%?)/i },
  ],
  PROPERTY_TAX: [
    { key: 'parcel', label: 'Parcel Number', regex: /(?:parcel|apn)[:\s#]+(.+)/i },
    { key: 'assessed', label: 'Assessed Value', regex: /(?:assessed|value)[:\s$]+([0-9,.]+)/i },
    { key: 'tax', label: 'Annual Tax', regex: /(?:tax|amount)[:\s$]+([0-9,.]+)/i },
  ],
  PROPERTY_DEED: [
    { key: 'grantor', label: 'Grantor', regex: /(?:grantor)[:\s]+(.+)/i },
    { key: 'grantee', label: 'Grantee', regex: /(?:grantee)[:\s]+(.+)/i },
    { key: 'parcel', label: 'Parcel Number', regex: /(?:parcel|apn)[:\s#]+(.+)/i },
  ],
}

function parseOcrFields(docType, text) {
  const defs = FIELD_DEFS[docType]
  if (!defs || !text) return null
  const fields = {}
  defs.forEach(d => {
    const match = text.match(d.regex)
    fields[d.key] = match ? match[1].trim() : null
  })
  return fields
}

function incomeMatchLabel(ocrGross, annualIncome) {
  if (!ocrGross || !annualIncome) return null
  const gross = parseFloat(ocrGross.replace(/[,$]/g, ''))
  if (isNaN(gross)) return null
  const annualized = gross * 26
  const diff = Math.abs(annualized - annualIncome) / annualIncome
  if (diff < 0.10) return { label: 'Match', color: 'text-green-600' }
  if (diff < 0.25) return { label: 'Close', color: 'text-yellow-600' }
  return { label: 'Differs', color: 'text-red-600' }
}

function OcrFieldsGrid({ docType, fields, annualIncome }) {
  const defs = FIELD_DEFS[docType]
  if (!defs || !fields) return null
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {defs.map(d => (
        <div key={d.key} className="flex items-center gap-1">
          <span className="text-gray-500">{d.label}:</span>
          <span className="font-medium text-gray-700">{fields[d.key] || '\u2014'}</span>
          {d.key === 'grossPay' && fields.grossPay && annualIncome && (() => {
            const match = incomeMatchLabel(fields.grossPay, annualIncome)
            return match ? <span className={`ml-1 font-semibold ${match.color}`}>({match.label})</span> : null
          })()}
        </div>
      ))}
    </div>
  )
}

export default function DocumentUploadPanel({ applicationId, annualIncome }) {
  const [docs, setDocs] = useState([])
  const [docType, setDocType] = useState(DOC_TYPES[0].value)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!applicationId) return
    getDocuments(applicationId)
      .then(data => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
  }, [applicationId])

  async function handleUpload(file) {
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadDocument(applicationId, docType, file)
      setDocs(prev => [...prev, result])
    } catch { /* ignore */ }
    setUploading(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="card p-5">
      <p className="section-label mb-3">Document Upload</p>

      <div className="flex gap-3 mb-3">
        <select value={docType} onChange={e => setDocType(e.target.value)} className="form-input bg-white text-sm flex-1">
          {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary text-sm disabled:opacity-50">
          {uploading ? 'Uploading\u2026' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={e => handleUpload(e.target.files?.[0])} accept=".pdf,.png,.jpg,.jpeg" />
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center text-sm transition-colors ${
          dragOver ? 'border-citizens-green bg-citizens-green-pale' : 'border-gray-300 text-gray-400'
        }`}
      >
        Drop a file here or click Upload
      </div>

      {docs.length > 0 && (
        <div className="mt-4 space-y-3">
          {docs.map((doc, i) => {
            const fields = parseOcrFields(doc.documentType, doc.extractedText)
            return (
              <div key={doc.id || i} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{(doc.documentType || '').replace(/_/g, ' ')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    doc.ocrStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    doc.ocrStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    OCR: {doc.ocrStatus || 'PENDING'}
                  </span>
                </div>
                {doc.ocrStatus === 'COMPLETED' && fields && (
                  <OcrFieldsGrid docType={doc.documentType} fields={fields} annualIncome={annualIncome} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
