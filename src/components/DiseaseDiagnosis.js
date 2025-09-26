import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AskLuminaPopup from './common/AskLuminaPopup';
import FloatingButton from './common/FloatingButton';

const DiseaseDiagnosis = () => {
  const [showAskLumina, setShowAskLumina] = useState(false);

  // List of medical specialties - Dermatology and Pulmonology are now active
  const specialties = [
    { 
      id: 'dermatology', 
      name: 'Dermatology', 
      isActive: true, 
      icon: '🔍', 
      description: 'Skin disease detection and analysis using image recognition',
      color: 'var(--color-dermatology)',
      features: [],
      path: '/diagnosis/dermatology'
    },
    { 
      id: 'pulmonology', 
      name: 'Pulmonology', 
      isActive: true, 
      icon: '🫁', 
      description: 'Lung cancer risk assessment using clinical data and text analysis',
      color: 'var(--color-pulmonology)',
      features: [],
      path: '/diagnosis/pulmonology'
    },
    { 
      id: 'neurology',
      name: 'Neurology', 
      isActive: false, 
      icon: '🧠', 
      description: 'Neurological condition assessment and cognitive analysis',
      color: 'var(--color-neurology)',
      features: ['Coming soon'],
      path: '/diagnosis/neurology'
    },
    { 
      id: 'oncology', 
      name: 'Oncology', 
      isActive: false, 
      icon: '', 
      description: 'Cancer detection and treatment response monitoring',
      color: '#E64980',
      features: ['Coming soon'],
      path: '/diagnosis/oncology'
    },
    { 
      id: 'raredisease', 
      name: 'Rare Disease', 
      isActive: false, 
      icon: '🧬', 
      description: 'Rare disease identification and genetic analysis',
      color: '#6B46C1',
      features: ['Coming soon'],
      path: '/diagnosis/raredisease'
    },
    { 
      id: 'cardiology', 
      name: 'Cardiology', 
      isActive: false, 
      icon: '❤️', 
      description: 'Cardiovascular risk assessment and ECG analysis',
      color: 'var(--color-cardiology)',
      features: ['Coming soon'],
      path: '/diagnosis/cardiology'
    },
    { 
      id: 'mentalhealth', 
      name: 'Mental Health', 
      isActive: false, 
      icon: '🧠', 
      description: 'Mental health screening and cognitive assessment',
      color: '#805AD5',
      features: ['Coming soon'],
      path: '/diagnosis/mentalhealth'
    },
    { 
      id: 'digestive', 
      name: 'Gastroenterology', 
      isActive: false, 
      icon: '🍎', 
      description: 'Digestive system disorders and endoscopy analysis',
      color: 'var(--color-gastroenterology)',
      features: ['Coming soon'],
      path: '/diagnosis/digestive'
    },
    { 
      id: 'infectious', 
      name: 'Infectious Diseases', 
      isActive: false, 
      icon: '🦠', 
      description: 'Pathogen identification and outbreak analysis',
      color: '#F6AD55',
      features: ['Coming soon'],
      path: '/diagnosis/infectious'
    },
    { 
      id: 'endocrinology', 
      name: 'Endocrinology', 
      isActive: false, 
      icon: '💉', 
      description: 'Hormone disorders and diabetes management',
      color: '#4299E1',
      features: ['Coming soon'],
      path: '/diagnosis/endocrinology'
    },
    { 
      id: 'rheumatology', 
      name: 'Rheumatology', 
      isActive: false, 
      icon: '🦴', 
      description: 'Autoimmune and joint disorder assessment',
      color: '#9F7AEA',
      features: ['Coming soon'],
      path: '/diagnosis/rheumatology'
    },
    { 
      id: 'other', 
      name: 'General Medicine', 
      isActive: false, 
      icon: '🩺', 
      description: 'General medical assessment and triage',
      color: '#718096',
      features: ['Coming soon'],
      path: '/diagnosis/other'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', position: 'relative' }}>
      {/* Ask Lumina Popup */}
      <AskLuminaPopup 
        isOpen={showAskLumina}
        onClose={() => setShowAskLumina(false)}
        contextData="Disease Screening - Medical Specialty Selection"
      />

      {/* Professional Ask Lumina Floating Button */}
      <FloatingButton
        onClick={() => setShowAskLumina(true)}
        icon="AI"
        label="Ask Lumina™"
        variant="primary"
      />

      {/* Simple Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b', textAlign: 'left' }}>
         Disease Screening
        </h1>
        <p style={{ color: '#64748b' }}>
          Select a medical specialty to access AI-powered diagnosis tools
        </p>

      </div>
      
      {/* Simple Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {specialties.map(specialty => (
          <div 
            key={specialty.id} 
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.2s ease',
              ...(specialty.isActive ? {} : { opacity: 0.6 })
            }}
            onMouseEnter={(e) => {
              if (specialty.isActive) {
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Simple Icon */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '1rem' 
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem'
              }}>
{typeof specialty.icon === 'string' ? (
                  <span style={{ fontSize: '24px' }}>{specialty.icon}</span>
                ) : (
                  <specialty.icon size={24} style={{ color: specialty.color }} />
                )}
              </div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.125rem', 
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {specialty.name}
              </h3>
            </div>
            
            {/* Simple Description */}
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#64748b', 
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              {specialty.description}
            </p>
            
            {/* Simple Button */}
            {specialty.isActive ? (
              <Link 
                to={specialty.path} 
                className="btn btn-primary"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                 Access Tools
              </Link>
            ) : (
              <button 
                disabled
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  cursor: 'not-allowed',
                  opacity: 0.6
                }}
              >
                 Coming Soon
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiseaseDiagnosis;