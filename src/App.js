import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProtocolGenerator from './components/ProtocolGenerator';
import IndModuleGenerator from './components/IndModuleGenerator';
import QueryAssistant from './components/QueryAssistant';
import SkinDiseaseDetector from './components/SkinDiseaseDetector';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Luminari Protocol Generator</h1>
          <p>AI-driven clinical protocol generator</p>
          <nav>
            <ul>
              <li><Link to="/">Protocol Generator</Link></li>
              <li><Link to="/ind-modules">IND Modules</Link></li>
              <li><Link to="/query">Query Assistant</Link></li>
              <li><Link to="/skin-disease-detector">Skin Disease Detector</Link></li>
            </ul>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<ProtocolGenerator />} />
            <Route path="/ind-modules" element={<IndModuleGenerator />} />
            <Route path="/query" element={<QueryAssistant />} />
            <Route path="/skin-disease-detector" element={<SkinDiseaseDetector />} />
          </Routes>
        </main>
        
        <footer>
          <p>&copy; {new Date().getFullYear()} Luminari. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
