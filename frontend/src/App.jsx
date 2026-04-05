import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import CaseListPage from './pages/CaseListPage';
import CaseDetailPage from './pages/CaseDetailPage';
import SearchPage from './pages/SearchPage';
import BailCalculatorPage from './pages/BailCalculatorPage';
import FIRAssistantPage from './pages/FIRAssistantPage';
import RightsPage from './pages/RightsPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/cases" element={<CaseListPage />} />
            <Route path="/case/:id" element={<CaseDetailPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/bail-calculator" element={<BailCalculatorPage />} />
            <Route path="/fir-assistant" element={<FIRAssistantPage />} />
            <Route path="/rights" element={<RightsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
