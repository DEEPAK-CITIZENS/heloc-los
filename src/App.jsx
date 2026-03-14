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

export default function App() {
  return (
    <BrowserRouter>
      <Header />
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
      </Routes>
    </BrowserRouter>
  )
}
