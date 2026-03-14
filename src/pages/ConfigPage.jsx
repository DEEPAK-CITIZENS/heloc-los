import { useState, useEffect } from 'react'

const DEFAULT_INTEGRATIONS = [
  // ── Microservices ──
  {
    id: 'heloc-application',
    category: 'Microservice',
    name: 'HELOC Application Service',
    description: 'Core orchestrator for HELOC application lifecycle and pipeline management.',
    port: 9090,
    contextPath: '/heloc-application-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_application',
    status: 'ACTIVE',
  },
  {
    id: 'credit-decisioning',
    category: 'Microservice',
    name: 'Credit Decisioning Service',
    description: 'Real-time credit scoring and decision engine using Drools rules.',
    port: 9091,
    contextPath: '/credit-decisioning-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_credit',
    status: 'ACTIVE',
  },
  {
    id: 'property-appraisal',
    category: 'Microservice',
    name: 'Property Appraisal Service',
    description: 'Automated property valuation and appraisal management.',
    port: 9092,
    contextPath: '/property-appraisal-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_appraisal',
    status: 'ACTIVE',
  },
  {
    id: 'underwriting',
    category: 'Microservice',
    name: 'Underwriting Service',
    description: 'Risk assessment and cashflow analysis via Nova Credit integration.',
    port: 9093,
    contextPath: '/underwriting-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_underwriting',
    status: 'ACTIVE',
  },
  {
    id: 'heloc-booking',
    category: 'Microservice',
    name: 'HELOC Booking Service',
    description: 'HELOC account creation, amortization, and activation.',
    port: 9094,
    contextPath: '/heloc-booking-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_booking',
    status: 'ACTIVE',
  },
  {
    id: 'lien-recording',
    category: 'Microservice',
    name: 'Lien Recording Service',
    description: 'Property lien filing with county recorder and title search.',
    port: 9095,
    contextPath: '/lien-recording-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_lien',
    status: 'ACTIVE',
  },
  {
    id: 'ofac-screening',
    category: 'Microservice',
    name: 'OFAC Screening Service',
    description: 'Sanctions screening against OFAC SDN and other watchlists.',
    port: 9096,
    contextPath: '/ofac-screening-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_ofac',
    status: 'ACTIVE',
  },
  {
    id: 'portfolio-analytics',
    category: 'Microservice',
    name: 'HELOC Portfolio Analytics Service',
    description: 'Aggregated portfolio metrics, KPIs, and performance analytics.',
    port: 9097,
    contextPath: '/heloc-portfolio-analytics-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_portfolio',
    status: 'ACTIVE',
  },
  {
    id: 'esign',
    category: 'Microservice',
    name: 'eSign Service',
    description: 'Electronic signature workflow for HELOC closing documents.',
    port: 9098,
    contextPath: '/heloc-esign-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_esign',
    status: 'ACTIVE',
  },
  {
    id: 'pre-approval',
    category: 'Microservice',
    name: 'HELOC Pre-Approval Service',
    description: 'Pre-qualification offers and pre-approval letter generation.',
    port: 9099,
    contextPath: '/heloc-pre-approval-service/1.0',
    healthEndpoint: '/actuator/health',
    database: 'heloc_preapproval',
    status: 'ACTIVE',
  },

  // ── External APIs ──
  {
    id: 'property-valuation',
    category: 'External API',
    name: 'Property Valuation API',
    description: 'Automated property valuation model (AVM) for home value estimates and comparable sales.',
    baseUrl: 'https://api.propertyvaluation.example.com',
    authType: 'API_KEY',
    status: 'ACTIVE',
  },
  {
    id: 'prove-identity',
    category: 'External API',
    name: 'Prove Identity',
    description: 'Phone-centric identity verification and KYC for applicant data prefill.',
    baseUrl: 'https://api.prove.com',
    authType: 'OAUTH2',
    status: 'ACTIVE',
  },
  {
    id: 'county-recorder',
    category: 'External API',
    name: 'County Recorder / Title Company API',
    description: 'Integration with county recorder offices for lien filing and title search.',
    baseUrl: 'https://api.countyrecorder.example.com',
    authType: 'API_KEY',
    status: 'ACTIVE',
  },
  {
    id: 'nova-credit',
    category: 'External API',
    name: 'Nova Credit',
    description: 'Cashflow intelligence and alternative credit data for underwriting.',
    baseUrl: 'https://api.novacredit.com',
    authType: 'OAUTH2',
    status: 'ACTIVE',
  },
  {
    id: 'ofac-sdn',
    category: 'External API',
    name: 'OFAC SDN Database',
    description: 'US Treasury OFAC Specially Designated Nationals list for sanctions screening.',
    baseUrl: 'https://sanctionslistservice.ofac.treas.gov',
    authType: 'NONE',
    status: 'ACTIVE',
  },

  // ── Database ──
  {
    id: 'postgresql',
    category: 'Database',
    name: 'PostgreSQL',
    description: 'Database-per-service pattern with separate databases for each HELOC microservice.',
    host: 'localhost',
    port: 5432,
    databases: 'heloc_application, heloc_credit, heloc_appraisal, heloc_underwriting, heloc_booking, heloc_lien, heloc_ofac, heloc_portfolio, heloc_esign, heloc_preapproval',
    status: 'ACTIVE',
  },

  // ── Notifications ──
  {
    id: 'email-smtp',
    category: 'Notification',
    name: 'Email / SMTP',
    description: 'Transactional email notifications for application status updates and closing disclosures.',
    host: 'smtp.citizensbank.com',
    port: 587,
    status: 'ACTIVE',
  },
  {
    id: 'sms-twilio',
    category: 'Notification',
    name: 'SMS / Twilio',
    description: 'SMS notifications for application milestones and document requests.',
    baseUrl: 'https://api.twilio.com/2010-04-01',
    authType: 'BASIC',
    status: 'ACTIVE',
  },
]

const STORAGE_KEY = 'pilot_heloc_config_state_v2'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

function buildInitial() {
  return DEFAULT_INTEGRATIONS.map(i => ({
    ...i,
    overrides: {},
    versions: [],
    currentVersion: 0,
  }))
}

function StatusDot({ status }) {
  const colors = {
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-gray-400',
    ERROR: 'bg-red-500',
    DEGRADED: 'bg-yellow-500',
  }
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-gray-300'}`} title={status} />
  )
}

function CategoryBadge({ category }) {
  const colors = {
    Microservice: 'bg-citizens-green-light text-citizens-green',
    'External API': 'bg-citizens-navy-light text-citizens-navy',
    Database: 'bg-purple-100 text-purple-700',
    Notification: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[category] || 'bg-gray-100 text-gray-600'}`}>
      {category}
    </span>
  )
}

export default function ConfigPage() {
  const [integrations, setIntegrations] = useState(() => {
    const saved = loadState()
    return saved?.integrations ?? buildInitial()
  })
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    saveState({ integrations })
  }, [integrations])

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleStatus(id) {
    setIntegrations(prev =>
      prev.map(i => i.id === id ? { ...i, status: i.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : i)
    )
  }

  function resetAll() {
    setIntegrations(buildInitial())
    localStorage.removeItem(STORAGE_KEY)
  }

  const categories = ['All', ...new Set(DEFAULT_INTEGRATIONS.map(i => i.category))]
  const filtered = filter === 'All' ? integrations : integrations.filter(i => i.category === filter)

  const activeCount = integrations.filter(i => i.status === 'ACTIVE').length
  const totalCount = integrations.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-label mb-1">Citizens HELOC</p>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {activeCount}/{totalCount} active
          </span>
          <button onClick={resetAll} className="btn-secondary text-xs px-3 py-1">
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors
              ${filter === cat
                ? 'bg-citizens-green text-white border-citizens-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-citizens-green'}`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1 opacity-60">
                ({integrations.filter(i => i.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Integration cards */}
      <div className="space-y-3">
        {filtered.map(integration => {
          const isOpen = !!expanded[integration.id]
          return (
            <div key={integration.id} className="card overflow-hidden">
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition"
                onClick={() => toggleExpand(integration.id)}
              >
                <StatusDot status={integration.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">{integration.name}</span>
                    <CategoryBadge category={integration.category} />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{integration.description}</p>
                </div>
                {integration.port && (
                  <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    :{integration.port}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); toggleStatus(integration.id) }}
                  className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors
                    ${integration.status === 'ACTIVE'
                      ? 'border-green-300 text-green-700 hover:bg-green-50'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                >
                  {integration.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
                <span className="text-gray-300 text-sm">{isOpen ? '\u25b2' : '\u25bc'}</span>
              </div>

              {isOpen && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {integration.contextPath && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Context Path</p>
                        <p className="font-mono text-gray-700">{integration.contextPath}</p>
                      </div>
                    )}
                    {integration.healthEndpoint && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Health</p>
                        <p className="font-mono text-gray-700">http://localhost:{integration.port}{integration.healthEndpoint}</p>
                      </div>
                    )}
                    {integration.database && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Database</p>
                        <p className="font-mono text-gray-700">{integration.database}</p>
                      </div>
                    )}
                    {integration.baseUrl && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Base URL</p>
                        <p className="font-mono text-gray-700 truncate">{integration.baseUrl}</p>
                      </div>
                    )}
                    {integration.authType && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Auth Type</p>
                        <p className="text-gray-700">{integration.authType}</p>
                      </div>
                    )}
                    {integration.host && (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Host</p>
                        <p className="font-mono text-gray-700">{integration.host}:{integration.port}</p>
                      </div>
                    )}
                    {integration.databases && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Databases</p>
                        <p className="font-mono text-gray-700 text-xs">{integration.databases}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
