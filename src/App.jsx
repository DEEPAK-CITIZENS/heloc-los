import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import NewApplicationPage from './pages/NewApplicationPage'
import ApplicationListPage from './pages/ApplicationListPage'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ThankYouPage from './pages/ThankYouPage'
import DashboardPage from './pages/DashboardPage'
import PreQualPage from './pages/PreQualPage'
import PortfolioPage from './pages/PortfolioPage'
import PreApprovalsPage from './pages/PreApprovalsPage'
import ConfigPage from './pages/ConfigPage'
import CreditDecisioningPage from './pages/CreditDecisioningPage'
import PropertyAppraisalPage from './pages/PropertyAppraisalPage'
import UnderwritingPage from './pages/UnderwritingPage'
import HelocBookingPage from './pages/HelocBookingPage'
import LienRecordingServicePage from './pages/LienRecordingServicePage'
import OfacScreeningPage from './pages/OfacScreeningPage'
import ESignServicePage from './pages/ESignServicePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-citizens-gray-light">
        <Header />
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/apply" element={<NewApplicationPage />} />
            <Route path="/pre-qualify" element={<PreQualPage />} />
            <Route path="/applications" element={<ApplicationListPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/applications/:id/confirmation" element={<ThankYouPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/pre-approvals" element={<PreApprovalsPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/services/credit-decisioning" element={<CreditDecisioningPage />} />
            <Route path="/services/property-appraisal" element={<PropertyAppraisalPage />} />
            <Route path="/services/underwriting" element={<UnderwritingPage />} />
            <Route path="/services/heloc-booking" element={<HelocBookingPage />} />
            <Route path="/services/lien-recording" element={<LienRecordingServicePage />} />
            <Route path="/services/ofac-screening" element={<OfacScreeningPage />} />
            <Route path="/services/esign" element={<ESignServicePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
