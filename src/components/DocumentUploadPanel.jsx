import { useState, useEffect, useRef } from 'react'
import { uploadDocument, getDocuments } from '../api/helocApi'

const DOC_TYPES = {
  PAY_STUB:              'Pay Stub / Income Proof',
  GOVERNMENT_ID:         'Government ID',
  BANK_STATEMENT:        'Bank Statement',
  MORTGAGE_STATEMENT:    'Mortgage Statement',
  PROPERTY_TAX:          'Property Tax Bill',
  HOMEOWNERS_INSURANCE:  'Homeowners Insurance Declaration',
  PROPERTY_DEED:         'Property Deed / Title',
}

const FIELD_DEFS = {
  PAY_STUB: [
    { key: 'employer',    label: 'Employer',       pattern: /employer[:\s]+(.+)/i },
    { key: 'employee',    label: 'Employee',       pattern: /employee[:\s]+(.+)/i },
    { key: 'grossPay',    label: 'Gross Pay',      pattern: /gross\s*pay[:\s]+\$?([\d,.]+)/i },
    { key: 'payPeriod',   label: 'Pay Period',     pattern: /pay\s*period[:\s]+(.+)/i },
    { key: 'ytd',         label: 'YTD Earnings',   pattern: /ytd[:\s]+\$?([\d,.]+)/i },
  ],
  GOVERNMENT_ID: [
    { key: 'name',        label: 'Name',           pattern: /(?:name|full\s*name)[:\s]+(.+)/i },
    { key: 'dob',         label: 'Date of Birth',  pattern: /(?:dob|date\s*of\s*birth|birth)[:\s]+(.+)/i },
    { key: 'idNumber',    label: 'ID Number',      pattern: /(?:id|license|dl)\s*(?:no|number|#)?[:\s]+(.+)/i },
    { key: 'address',     label: 'Address',        pattern: /address[:\s]+(.+)/i },
    { key: 'expiration',  label: 'Expiration',     pattern: /exp(?:iration|iry)?[:\s]+(.+)/i },
  ],
  BANK_STATEMENT: [
    { key: 'holder',      label: 'Account Holder', pattern: /(?:account\s*holder|name)[:\s]+(.+)/i },
    { key: 'account',     label: 'Account #',      pattern: /account\s*(?:no|number|#)?[:\s]+(.+)/i },
    { key: 'balance',     label: 'Balance',        pattern: /balance[:\s]+\$?([\d,.]+)/i },
    { key: 'stmtDate',    label: 'Statement Date', pattern: /(?:statement|stmt)\s*date[:\s]+(.+)/i },
  ],
  MORTGAGE_STATEMENT: [
    { key: 'lender',      label: 'Lender',         pattern: /(?:lender|servicer)[:\s]+(.+)/i },
    { key: 'loanNumber',  label: 'Loan Number',    pattern: /(?:loan|mortgage)\s*(?:no|number|#)?[:\s]+(.+)/i },
    { key: 'balance',     label: 'Remaining Balance', pattern: /(?:principal|remaining)\s*balance[:\s]+\$?([\d,.]+)/i },
    { key: 'payment',     label: 'Monthly Payment', pattern: /monthly\s*payment[:\s]+\$?([\d,.]+)/i },
    { key: 'rate',        label: 'Interest Rate',  pattern: /(?:interest\s*)?rate[:\s]+([\d.]+%?)/i },
  ],
  PROPERTY_TAX: [
    { key: 'parcel',      label: 'Parcel Number',  pattern: /parcel\s*(?:no|number|id|#)?[:\s]+(.+)/i },
    { key: 'assessed',    label: 'Assessed Value',  pattern: /assessed\s*value[:\s]+\$?([\d,.]+)/i },
    { key: 'taxAmount',   label: 'Annual Tax',     pattern: /(?:tax\s*amount|annual\s*tax)[:\s]+\$?([\d,.]+)/i },
    { key: 'taxYear',     label: 'Tax Year',       pattern: /(?:tax\s*)?year[:\s]+(\d{4})/i },
  ],
  HOMEOWNERS_INSURANCE: [
    { key: 'carrier',     label: 'Insurance Carrier', pattern: /(?:carrier|insurer|company)[:\s]+(.+)/i },
    { key: 'policy',      label: 'Policy Number',  pattern: /policy\s*(?:no|number|#)?[:\s]+(.+)/i },
    { key: 'coverage',    label: 'Coverage Amount', pattern: /(?:coverage|dwelling)\s*(?:amount)?[:\s]+\$?([\d,.]+)/i },
    { key: 'premium',     label: 'Annual Premium',  pattern: /(?:annual\s*)?premium[:\s]+\$?([\d,.]+)/i },
  ],
  PROPERTY_DEED: [
    { key: 'owner',       label: 'Owner',          pattern: /(?:owner|grantor|grantee)[:\s]+(.+)/i },
    { key: 'legal',       label: 'Legal Description', pattern: /legal\s*desc(?:ription)?[:\s]+(.+)/i },
    { key: 'parcel',      label: 'Parcel Number',  pattern: /parcel\s*(?:no|number|id|#)?[:\s]+(.+)/i },
    { key: 'recorded',    label: 'Date Recorded',  pattern: /(?:date\s*)?recorded[:\s]+(.+)/i },
  ],
}

function parseOcrFields(docType, text) {
  const defs = FIELD_DEFS[docType]
  if (!defs || !text) return null
  const result = {}
  let found = 0
  defs.forEach(({ key, pattern }) => {
    const m = text.match(pattern)
    if (m) { result[key] = m[1].trim(); found++ }
  })
  return found > 0 ? result : null
}

function incomeMatchLabel(ocrValue, annualIncome) {
  if (!ocrValue || !annualIncome) return null
  const extracted = parseFloat(ocrValue.replace(/[,$]/g, ''))
  if (isNaN(extracted)) return null
  const annual = parseFloat(annualIncome)
  const biweeklyEstimate = extracted * 26
  const diff = Math.abs(biweeklyEstimate - annual) / annual
  if (diff < 0.10) return { label: 'Match', cls: 'text-green-600 bg-green-50' }
  if (diff < 0.25) return { label: 'Close', cls: 'text-yellow-600 bg-yellow-50' }
  return { label: 'Differs', cls: 'text-red-600 bg-red-50' }
}

function OcrFieldsGrid({ docType, fields, annualIncome }) {
  const defs = FIELD_DEFS[docType]
  if (!defs || !fields) return null
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
      {defs.map(({ key, label }) => {
        const val = fields[key]
        if (!val) return null
        const match = docType === 'PAY_STUB' && key === 'grossPay'
          ? incomeMatchLabel(val, annualIncome)
          : null
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
            <span className="text-sm font-medium text-gray-700 truncate">{val}</span>
            {match && (
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${match.cls}`}>
                {match.label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function DocumentUploadPanel({ appId, applicant }) {
  const [docType, setDocType]     = useState('PAY_STUB')
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState(null)
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [dragOver, setDragOver]   = useState(false)
  const fileRef = useRef(null)

  async function loadDocs() {
    setLoadingDocs(true)
    try {
      const data = await getDocuments(appId)
      setDocuments(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    finally { setLoadingDocs(false) }
  }

  useEffect(() => { loadDocs() }, [appId])

  async function handleUpload(file) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      await uploadDocument(appId, docType, file)
      await loadDocs()
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div className="my-4 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Document Upload
      </h3>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={docType}
          onChange={e => setDocType(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-citizens-green"
        >
          {Object.entries(DOC_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Select File'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={e => handleUpload(e.target.files?.[0])}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center text-sm transition-colors
          ${dragOver ? 'border-citizens-green bg-citizens-green-light' : 'border-gray-200 text-gray-400'}`}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-citizens-green border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          'Drag & drop a file here, or click "Select File" above'
        )}
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
      )}

      {/* Uploaded documents */}
      {loadingDocs ? (
        <p className="text-sm text-gray-400 mt-4">Loading documents...</p>
      ) : documents.length > 0 ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Uploaded Documents ({documents.length})
          </p>
          {documents.map((doc, i) => {
            const fields = parseOcrFields(doc.documentType, doc.extractedText)
            return (
              <div key={doc.id ?? i} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {DOC_TYPES[doc.documentType] ?? doc.documentType}
                    </span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
                      ${doc.ocrStatus === 'COMPLETED' ? 'bg-green-100 text-green-700'
                        : doc.ocrStatus === 'FAILED' ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'}`}>
                      OCR: {doc.ocrStatus ?? 'N/A'}
                    </span>
                  </div>
                  {doc.storagePath && (
                    <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">{doc.storagePath.split('/').pop()}</span>
                  )}
                </div>

                {doc.ocrStatus === 'COMPLETED' && doc.extractedText && (
                  <>
                    {fields ? (
                      <OcrFieldsGrid
                        docType={doc.documentType}
                        fields={fields}
                        annualIncome={applicant?.annualIncome}
                      />
                    ) : (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                          View extracted text
                        </summary>
                        <pre className="mt-1 text-xs text-gray-500 whitespace-pre-wrap max-h-32 overflow-y-auto bg-white rounded p-2">
                          {doc.extractedText}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mt-4">No documents uploaded yet.</p>
      )}
    </div>
  )
}
