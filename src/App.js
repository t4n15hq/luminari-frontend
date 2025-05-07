import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';

import HomePage from './components/HomePage';
import ProtocolGenerator from './components/ProtocolGenerator';
import IndModuleGenerator from './components/IndModuleGenerator';
import QueryAssistant from './components/QueryAssistant';
import SkinDiseaseDetector from './components/SkinDiseaseDetector';
import DiseaseDiagnosis from './components/DiseaseDiagnosis';
import './App.css';

// Navigation component that only shows on non-landing pages
const Navigation = () => {
  const location = useLocation();
  
  // Don't show navigation on the landing page
  if (location.pathname === '/') {
    return null;
  }
  
  return (
    <nav>
      <ul>
        <li><Link to="/" className="home-link">Home</Link></li>
        <li><Link to="/protocol" className={location.pathname === '/protocol' ? 'active' : ''}>Protocol & Study Design Generator</Link></li>
        <li><Link to="/ind-modules" className={location.pathname === '/ind-modules' ? 'active' : ''}>Regulatory Document Generator</Link></li>
        <li><Link to="/query" className={location.pathname === '/query' ? 'active' : ''}>ASK LUMINA©</Link></li>
        <li><Link to="/diagnosis" className={location.pathname.includes('/diagnosis') ? 'active' : ''}>Disease Diagnosis</Link></li>
      </ul>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="container">
            <h1>LumiPath ©</h1>
            <p className="tagline">AI-driven clinical tools platform</p>
            <Navigation />
          </div>
        </header>

        <main>
          <div className="container">
            <Routes>
              {/* Home Page as default landing page */}
              <Route path="/" element={<HomePage />} />
              
              {/* Main tool routes */}
              <Route path="/protocol" element={<ProtocolGenerator />} />
              <Route path="/ind-modules" element={<IndModuleGenerator />} />
              <Route path="/query" element={<QueryAssistant />} />
              
              {/* Disease Diagnosis routes */}
              <Route path="/diagnosis" element={<DiseaseDiagnosis />} />
              <Route path="/diagnosis/dermatology" element={<SkinDiseaseDetector />} />
              
              {/* Legacy routes with redirects */}
              <Route path="/skin-disease-detector" element={<Navigate to="/diagnosis/dermatology" replace />} />
              <Route path="/upload" element={<Navigate to="/diagnosis/dermatology" replace />} />
            </Routes>
          </div>
        </main>
        
        <footer>
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Luminari. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;