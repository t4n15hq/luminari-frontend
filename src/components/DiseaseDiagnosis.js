import React from 'react';
import { Link } from 'react-router-dom';

const DiseaseDiagnosis = () => {
  // List of medical specialties - currently only Dermatology is active
  const specialties = [
    { 
      id: 'dermatology', 
      name: 'Dermatology', 
      isActive: true, 
      icon: '🔍', 
      description: 'Skin disease detection and analysis',
      color: 'var(--color-dermatology)' 
    },
    { 
      id: 'neurology', 
      name: 'Neurology', 
      isActive: false, 
      icon: '🧠', 
      description: 'Coming soon',
      color: 'var(--color-neurology)' 
    },
    { 
      id: 'oncology', 
      name: 'Oncology', 
      isActive: false, 
      icon: '🔬', 
      description: 'Coming soon',
      color: '#E64980' 
    },
    { 
      id: 'raredisease', 
      name: 'Rare Disease', 
      isActive: false, 
      icon: '🧬', 
      description: 'Coming soon',
      color: '#6B46C1' 
    },
    { 
      id: 'respiratory', 
      name: 'Respiratory', 
      isActive: false, 
      icon: '🫁', 
      description: 'Coming soon',
      color: 'var(--color-pulmonology)' 
    },
    { 
      id: 'mentalhealth', 
      name: 'Mental Health Conditions', 
      isActive: false, 
      icon: '🧠', 
      description: 'Coming soon',
      color: '#805AD5' 
    },
    { 
      id: 'digestive', 
      name: 'Digestive Diseases', 
      isActive: false, 
      icon: '胃', 
      description: 'Coming soon',
      color: 'var(--color-gastroenterology)' 
    },
    { 
      id: 'infectious', 
      name: 'Infectious Diseases', 
      isActive: false, 
      icon: '🦠', 
      description: 'Coming soon',
      color: '#F6AD55' 
    },
    { 
      id: 'diabetes', 
      name: 'Diabetes', 
      isActive: false, 
      icon: '💉', 
      description: 'Coming soon',
      color: '#4299E1' 
    },
    { 
      id: 'other', 
      name: 'Other', 
      isActive: false, 
      icon: '➕', 
      description: 'Coming soon',
      color: '#718096' 
    }
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
            style={{ borderLeft: `4px solid ${specialty.color}` }}
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