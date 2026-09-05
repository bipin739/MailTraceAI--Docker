import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AnalyzeEmail } from './pages/AnalyzeEmail';
import { Cases } from './pages/Cases';
import { CaseDetail } from './pages/CaseDetail';
import { ThreatIntelligence } from './pages/ThreatIntelligence';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
        {/* Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 pl-64">
          <Navbar />

          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analyze" element={<AnalyzeEmail />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/intelligence" element={<ThreatIntelligence />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
