
// src/App.js - Updated routing to include batch functionality

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';

import HomePage from './components/HomePage';
import ProtocolGenerator from './components/ProtocolGenerator';
import RegulatoryDocuments from './components/RegulatoryDocuments';
import RegulatoryDocumentGenerator from './components/RegulatoryDocumentGenerator';
import BatchRegulatoryGenerator from './components/BatchRegulatoryGenerator'; // NEW IMPORT
import ClinicalDossierCompiler from './components/ClinicalDossierCompiler';
import QueryAssistant from './components/QueryAssistant';
import SkinDiseaseDetector from './components/SkinDiseaseDetector';
import LungCancerDetector from './components/LungCancerDetector';
import DiseaseDiagnosis from './components/DiseaseDiagnosis';
import BackgroundJobs from './components/common/BackgroundJobs'; // NEW IMPORT
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import './components.css';

// Navigation component that only shows on non-landing pages
const Navigation = () => {
  const location = useLocation();
  const { logout } = useAuth();
  
  // Don't show navigation on the landing page
  if (location.pathname === '/') {
    return null;
  }
  
  return (
    <nav>
      <ul>
        <li><Link to="/" className="home-link">Home</Link></li>
        <li><Link to="/protocol" className={location.pathname === '/protocol' ? 'active' : ''}>Protocol & Study Design Generator</Link></li>
        <li><Link to="/regulatory-documents" className={location.pathname === '/regulatory-documents' || location.pathname === '/ind-modules' ? 'active' : ''}>Regulatory Document Generator</Link></li>
        <li><Link to="/batch-regulatory" className={location.pathname === '/batch-regulatory' ? 'active' : ''}>Batch Regulatory Generator</Link></li>
        <li><Link to="/clinical-dossier" className={location.pathname === '/clinical-dossier' ? 'active' : ''}>Clinical Dossier Compiler</Link></li>
        <li><Link to="/query" className={location.pathname === '/query' ? 'active' : ''}>Ask Lumina<span className="trademark">™</span></Link></li>
        <li><Link to="/diagnosis" className={location.pathname.includes('/diagnosis') ? 'active' : ''}>Disease Screening</Link></li>
        <li><button onClick={logout} className="logout-button">Logout</button></li>
      </ul>
    </nav>
  );
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <header className="App-header">
                <div className="container">
                  <h1>LumiPath<span className="trademark">™</span></h1>
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
                    
                    {/* REGULATORY DOCUMENT ROUTES - ENHANCED WITH BATCH */}
                    <Route path="/regulatory-documents" element={<RegulatoryDocuments />} /> {/* MAP INTERFACE */}
                    <Route path="/ind-modules" element={<RegulatoryDocumentGenerator />} />   {/* SINGLE FORM & LOGIC */}
                    <Route path="/batch-regulatory" element={<BatchRegulatoryGenerator />} />  {/* NEW BATCH INTERFACE */}
                    
                    <Route path="/clinical-dossier" element={<ClinicalDossierCompiler />} />
                    <Route path="/query" element={<QueryAssistant />} />
                    
                    {/* Disease Diagnosis routes */}
                    <Route path="/diagnosis" element={<DiseaseDiagnosis />} />
                    <Route path="/diagnosis/dermatology" element={<SkinDiseaseDetector />} />
                    <Route path="/diagnosis/pulmonology" element={<LungCancerDetector />} />
                    
                    {/* Legacy routes with redirects */}
                    <Route path="/skin-disease-detector" element={<Navigate to="/diagnosis/dermatology" replace />} />
                    <Route path="/upload" element={<Navigate to="/diagnosis/dermatology" replace />} />
                  </Routes>
                </div>
              </main>
              <BackgroundJobs />
              <footer>
                <div className="container">
                  <p><span className="copyright">©</span> {new Date().getFullYear()} Luminari. All rights reserved.</p>
                </div>
              </footer>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
