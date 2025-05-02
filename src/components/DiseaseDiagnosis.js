import React from 'react';
import { Link } from 'react-router-dom';

const DiseaseDiagnosis = () => {
  // List of medical specialties - currently only Dermatology is active
  const specialties = [
    { id: 'dermatology', name: 'Dermatology', isActive: true, icon: '🔍', description: 'Skin disease detection and analysis' },
    { id: 'neurology', name: 'Neurology', isActive: false, icon: '🧠', description: 'Coming soon' },
    { id: 'cardiology', name: 'Cardiology', isActive: false, icon: '❤️', description: 'Coming soon' },
    { id: 'pulmonology', name: 'Pulmonology', isActive: false, icon: '🫁', description: 'Coming soon' },
    { id: 'gastroenterology', name: 'Gastroenterology', isActive: false, icon: '胃', description: 'Coming soon' }
  ];

  return (
    <div className="disease-diagnosis-container">
      <h2>Disease Diagnosis</h2>
      <p className="subtitle">Select a medical specialty to access diagnosis tools</p>
      
      <div className="specialty-grid">
        {specialties.map(specialty => (
          <div 
            key={specialty.id} 
            className={`specialty-card ${specialty.isActive ? 'active' : 'inactive'}`}
          >
            <div className="specialty-icon">{specialty.icon}</div>
            <h3>{specialty.name}</h3>
            <p>{specialty.description}</p>
            
            {specialty.isActive ? (
              <Link to={`/diagnosis/${specialty.id}`} className="specialty-button active">
                Access Tools
              </Link>
            ) : (
              <span className="specialty-button inactive">Coming Soon</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="info-box">
        <h4>About Disease Diagnosis Tools</h4>
        <p>
          Luminari's AI-driven diagnosis tools help clinicians identify potential conditions based on
          patient symptoms, images, and other clinical data. These tools are designed to support
          clinical decision-making, not replace professional medical judgment.
        </p>
        <p>
          Currently, our Dermatology tools are available for testing. Additional medical specialties 
          will be added in future updates.
        </p>
      </div>
    </div>
  );
};

export default DiseaseDiagnosis;