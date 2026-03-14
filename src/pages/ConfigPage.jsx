import { useState, useEffect } from 'react'
import { healthCheck } from '../api/helocApi'

const DEFAULT_INTEGRATIONS = [
  { id: 'heloc-app', category: 'Microservices', name: 'HELOC Application Service', port: 9090, path: '/heloc-application-service/1.0', description: 'Core orchestrator for HELOC applications and pipeline.' },
  { id: 'credit-dec', category: 'Microservices', name: 'Credit Decisioning Service', port: 9091, path: '/credit-decisioning-service/1.0', description: 'Credit scoring, DTI, CLTV calculation using Drools rules engine.' },
  { id: 'open-banking', category: 'Microservices', name: 'Open Banking Service', port: 9092, path: '/open-banking-service/1.0', description: 'Plaid integration for bank account verification.' },
  { id: 'underwriting', category: 'Microservices', name: 'Underwriting Service', port: 9093, path: '/underwriting-service/1.0', description: 'Cashflow analysis and risk assessment.' },
  { id: 'lien-recording', category: 'Microservices', name: 'Lien Recording Service', port: 9094, path: '/lien-recording-service/1.0', description: 'Manages property lien recording and county filing.' },
  { id: 'appraisal', category: 'Microservices', name: 'Property Appraisal Service', port: 9095, path: '/property-appraisal-service/1.0', description: 'Automated and manual property valuation.' },
  { id: 'ofac', category: 'Microservices', name: 'OFAC Screening Service', port: 9096, path: '/ofac-screening-service/1.0', description: 'Sanctions and watchlist screening.' },
  { id: 'portfolio', category: 'Microservices', name: 'Portfolio Analytics Service', port: 9097, path: '/heloc-portfolio-analytics-service/1.0', description: 'HELOC portfolio performance metrics.' },
  { id: 'esign', category: 'Microservices', name: 'eSign Service', port: 9098, path: '/heloc-esign-service/1.0', description: 'Electronic signature workflow management.' },
  { id: 'pre-approval', category: 'Microservices', name: 'Pre-Approval Service', port: 9099, path: '/heloc-pre-approval-service/1.0', description: 'Pre-qualification and pre-approval offer management.' },
  { id: 'prove', category: 'External APIs', name: 'Prove Identity', url: 'https://api.prove.com', description: 'Phone-centric identity verification and data prefill.' },
  { id: 'ofac-sdn', category: 'External APIs', name: 'OFAC SDN Database', url: 'https://sanctionslist.ofac.treas.gov', description: 'US Treasury sanctions list for compliance screening.' },
  { id: 'nova-credit', category: 'External APIs', name: 'Nova Credit', url: 'https://api.novacredit.com', description: 'Alternative credit data and cashflow analysis.' },
  { id: 'postgres', category: 'Database', name: 'PostgreSQL', port: 5432, description: 'Database-per-service pattern. Seven databases for HELOC services.' },
  { id: 'email', category: 'Notifications', name: 'Email / SMTP', description: 'Transactional email for application status updates.' },
  { id: 'sms', category: 'Notifications', name: 'SMS / Twilio', description: 'SMS notifications for key application milestones.' },
]

const STORAGE_KEY = 'pilot_heloc_config_state_v2'

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved) return saved
  } catch { /* ignore */ }
  return { integrations: DEFAULT_INTEGRATIONS, role: 'EDITOR' }
}
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export default function ConfigPage() {
  const [state, setState] = useState(loadState)
  const [health, setHealth] = useState(null)
  const [checking, setChecking] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => { saveState(state) }, [state])

  async function checkHealth() {
    setChecking(true)
    const result = await healthCheck()
    setHealth(result)
    setChecking(false)
  }

  const categories = [...new Set(state.integrations.map(i => i.category))]
  const filtered = state.integrations.filter(i =>
    !filter || i.name.toLowerCase().includes(filter.toLowerCase()) || i.category.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-citizens-navy">System Configuration</h1>
          <p className="text-sm text-gray-500">HELOC microservice integrations and external API connections.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={checkHealth} disabled={checking} className="btn-secondary text-sm disabled:opacity-50">
            {checking ? 'Checking\u2026' : 'Health Check'}
          </button>
          {health && (
            <span className={`text-sm font-medium ${health.ok ? 'text-green-600' : 'text-red-600'}`}>
              {health.ok ? 'All services healthy' : `Error: ${health.message}`}
            </span>
          )}
        </div>
      </div>

      <input
        type="text" placeholder="Filter integrations\u2026" value={filter} onChange={e => setFilter(e.target.value)}
        className="form-input w-full mb-6"
      />

      <div className="flex gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${state.role === 'EDITOR' ? 'bg-citizens-green text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setState(s => ({ ...s, role: 'EDITOR' }))}>Editor</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${state.role === 'APPROVER' ? 'bg-citizens-green text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setState(s => ({ ...s, role: 'APPROVER' }))}>Approver</span>
      </div>

      {categories.map(cat => {
        const items = filtered.filter(i => i.category === cat)
        if (items.length === 0) return null
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-lg font-bold text-citizens-navy mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.id}</p>
                    </div>
                    {item.port && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">:{item.port}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                  {item.path && <p className="text-xs text-gray-400 font-mono">{item.path}</p>}
                  {item.url && <p className="text-xs text-gray-400 font-mono">{item.url}</p>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
