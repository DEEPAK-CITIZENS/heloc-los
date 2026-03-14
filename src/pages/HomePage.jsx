import { Link } from 'react-router-dom'

const FEATURES = [
  { title: 'Quick Pre-Qualification', desc: 'Check your estimated HELOC terms in under 60 seconds with no credit impact.', icon: '\u26A1' },
  { title: 'Automated Decisioning', desc: 'Get real-time credit decisions powered by our automated underwriting pipeline.', icon: '\U0001F916' },
  { title: 'Property Appraisal', desc: 'Streamlined property valuation integrated directly into the application process.', icon: '\U0001F3E0' },
  { title: 'Flexible Draw Terms', desc: 'Choose from 5, 7, or 10-year draw periods with competitive variable rates.', icon: '\U0001F4B0' },
]

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-citizens-navy via-citizens-navy-dark to-citizens-green">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Unlock Your Home\u2019s Equity
          </h1>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Apply for a Home Equity Line of Credit with Citizens Bank. Fast approvals, competitive rates, and flexible terms.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/apply" className="bg-citizens-green hover:bg-citizens-green-dark text-white font-bold px-8 py-3 rounded-lg text-base transition-colors shadow-lg">
              Apply Now \u2192
            </Link>
            <Link to="/pre-qualify" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg text-base transition-colors border border-white/20">
              Pre-Qualify
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-citizens-navy text-center mb-10">Why Choose Citizens HELOC?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 text-center hover:shadow-card-hover transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-citizens-green-pale py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-extrabold text-citizens-green">$2.1B+</p>
            <p className="text-sm text-gray-600 mt-1">HELOCs Originated</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-citizens-green">&lt; 60s</p>
            <p className="text-sm text-gray-600 mt-1">Average Decision Time</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-citizens-green">85%</p>
            <p className="text-sm text-gray-600 mt-1">CLTV Up To</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-6 py-12 text-center">
        <h2 className="text-xl font-bold text-citizens-navy mb-3">Ready to tap into your home equity?</h2>
        <Link to="/apply" className="btn-primary inline-block">Start Your Application \u2192</Link>
      </div>
    </div>
  )
}
