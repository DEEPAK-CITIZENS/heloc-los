import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="text-center py-16">
        <span className="inline-block bg-citizens-green-light text-citizens-green text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Citizens Home Equity
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          Unlock your home&rsquo;s equity.
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Apply online in minutes. Get a real-time credit decision and have your HELOC opened &mdash;
          all through Citizens&rsquo; fully automated origination pipeline.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/apply" className="btn-primary text-base px-8 py-3">
            Apply Now
          </Link>
          <Link to="/pre-qualify" className="btn-secondary text-base px-8 py-3">
            Check Your Rate
          </Link>
        </div>
      </div>

      {/* Trust bullets */}
      <div className="flex justify-center gap-8 mb-14 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-citizens-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          No hard pull to check your rate
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-citizens-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Decisions in under 60 seconds
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-citizens-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Draw funds anytime during your draw period
        </span>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Simple 3-Step Application"
          desc="Provide your personal info, property details, and HELOC preferences in minutes."
        />
        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="Real-Time Credit Decision"
          desc="Get an instant credit decision powered by our automated underwriting engine."
        />
        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          title="Secure & Fully Automated"
          desc="Bank-grade security with property appraisal, underwriting, and instant HELOC activation."
        />
        <FeatureCard
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Flexible Draw Period"
          desc="Access your credit line anytime during the draw period with interest-only payments."
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard value="60s" label="Average Decision Time" />
        <StatCard value="100%" label="Automated Pipeline" />
        <StatCard value="5-Star" label="Security Rating" />
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card p-6 text-center hover:shadow-md transition-shadow">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-citizens-green-light text-citizens-green mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="card p-6 text-center border-t-4 border-t-citizens-green">
      <p className="text-3xl font-extrabold text-citizens-navy mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
