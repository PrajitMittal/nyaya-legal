import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import CaseListPage from './pages/CaseListPage';
import CaseDetailPage from './pages/CaseDetailPage';
import SearchPage from './pages/SearchPage';
import BailCalculatorPage from './pages/BailCalculatorPage';
import FIRAssistantPage from './pages/FIRAssistantPage';
import RightsPage from './pages/RightsPage';
import CaseExplainerPage from './pages/CaseExplainerPage';
import SectionMapperPage from './pages/SectionMapperPage';
import DocumentDrafterPage from './pages/DocumentDrafterPage';
import DocumentExplainerPage from './pages/DocumentExplainerPage';
import LoginPage from './pages/LoginPage';
import SavedResultsPage from './pages/SavedResultsPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<div className="max-w-7xl mx-auto px-4 py-6"><LoginPage /></div>} />
              <Route path="/upload" element={<div className="max-w-7xl mx-auto px-4 py-6"><UploadPage /></div>} />
              <Route path="/cases" element={<div className="max-w-7xl mx-auto px-4 py-6"><CaseListPage /></div>} />
              <Route path="/case/:id" element={<div className="max-w-7xl mx-auto px-4 py-6"><CaseDetailPage /></div>} />
              <Route path="/search" element={<div className="max-w-7xl mx-auto px-4 py-6"><SearchPage /></div>} />
              <Route path="/bail-calculator" element={<div className="max-w-7xl mx-auto px-4 py-6"><BailCalculatorPage /></div>} />
              <Route path="/fir-assistant" element={<div className="max-w-7xl mx-auto px-4 py-6"><FIRAssistantPage /></div>} />
              <Route path="/rights" element={<div className="max-w-7xl mx-auto px-4 py-6"><RightsPage /></div>} />
              <Route path="/case-explainer" element={<div className="max-w-7xl mx-auto px-4 py-6"><CaseExplainerPage /></div>} />
              <Route path="/section-mapper" element={<div className="max-w-7xl mx-auto px-4 py-6"><SectionMapperPage /></div>} />
              <Route path="/draft" element={<div className="max-w-7xl mx-auto px-4 py-6"><DocumentDrafterPage /></div>} />
              <Route path="/explain-document" element={<div className="max-w-7xl mx-auto px-4 py-6"><DocumentExplainerPage /></div>} />
              <Route path="/saved" element={
                <div className="max-w-7xl mx-auto px-4 py-6">
                  <ProtectedRoute><SavedResultsPage /></ProtectedRoute>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
