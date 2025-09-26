// src/App.js - Updated routing to include batch functionality

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import HomePage from './components/HomePage';
import ProtocolGenerator from './components/ProtocolGenerator';
import RegulatoryDocuments from './components/RegulatoryDocuments';
import RegulatoryDocumentGenerator from './components/RegulatoryDocumentGenerator';
import BatchRegulatoryGenerator from './components/BatchRegulatoryGenerator'; // NEW IMPORT
import UnifiedRegulatoryGenerator from './components/UnifiedRegulatoryGenerator'; // TEST COMPONENT
import EnhancedMedicalAnalysis from './components/EnhancedMedicalAnalysis'; // TIER 1 ENHANCEMENTS
import ExcelAnalysis from './components/ExcelAnalysis'; // EXCEL BIOMARKER ANALYSIS
import ClinicalDossierCompiler from './components/ClinicalDossierCompiler';
import QueryAssistant from './components/QueryAssistant';
import SkinDiseaseDetector from './components/SkinDiseaseDetector';
import LungCancerDetector from './components/LungCancerDetector';
import DiseaseDiagnosis from './components/DiseaseDiagnosis';
import Profile from './components/Profile';
import BackgroundJobs from './components/common/BackgroundJobs'; // NEW IMPORT
import SideNav from './components/common/SideNav'; // NEW IMPORT
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import './components.css';

// Sidebar Navigation component that shows on all pages except login
const SideNavigation = () => {
  const location = useLocation();
  
  // Don't show navigation on the login page
  if (location.pathname === '/login') {
    return null;
  }
  
  return <SideNav />;
};

const AppContent = () => {
  const { isLoading } = useAuth();

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
              <div className="app-layout">
                <SideNavigation />
                <div className="main-content">
                  <header className="App-header">
                    <div className="container">
                      <h1>LumiPath<span className="trademark">™</span></h1>
                      <p className="tagline">AI-driven clinical tools platform</p>
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
                        <Route path="/unified-regulatory" element={<UnifiedRegulatoryGenerator />} />  {/* TEST: NEW UNIFIED COMPONENT */}
                        
                        {/* TIER 1 ENHANCED FEATURES */}
                        <Route path="/enhanced-analysis" element={<EnhancedMedicalAnalysis />} />  {/* NEW: CLAUDE API ENHANCEMENTS */}
                        <Route path="/excel-analysis" element={<ExcelAnalysis />} />  {/* NEW: EXCEL BIOMARKER ANALYSIS */}
                        
                        <Route path="/clinical-dossier" element={<ClinicalDossierCompiler />} />
                        <Route path="/query" element={<QueryAssistant />} />
                        
                        {/* Disease Diagnosis routes */}
                        <Route path="/diagnosis" element={<DiseaseDiagnosis />} />
                        <Route path="/diagnosis/dermatology" element={<SkinDiseaseDetector />} />
                        <Route path="/diagnosis/pulmonology" element={<LungCancerDetector />} />
                        
                        {/* Profile route */}
                        <Route path="/profile" element={<Profile />} />
                        
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
                </div>
              </div>
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