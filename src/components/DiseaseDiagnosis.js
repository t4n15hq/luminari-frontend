import React from 'react';
import { Link } from 'react-router-dom';

const DiseaseDiagnosis = () => {
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
      icon: '🔬', 
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
    <div className="disease-diagnosis-container">
      <div className="page-header">
        <h2>Disease Screening</h2>
        <p className="subtitle">Select a medical specialty to access AI-powered diagnosis tools</p>
      </div>
      
      <div className="specialty-grid">
        {specialties.map(specialty => (
          <div 
            key={specialty.id} 
            className={`specialty-card ${specialty.isActive ? 'active' : 'inactive'}`}
            style={{ borderLeft: `4px solid ${specialty.color}` }}
          >
            <div className="specialty-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              {specialty.icon}
            </div>
            
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              {specialty.name}
            </h3>
            
            <p style={{ 
              margin: '0 0 1rem 0', 
              color: 'var(--color-text-light)', 
              fontSize: '0.9rem',
              lineHeight: '1.4'
            }}>
              {specialty.description}
            </p>

            {/* Feature list for active specialties */}
            {specialty.isActive && specialty.features.length > 1 && (
              <div style={{ marginBottom: '1rem' }}>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--color-text-light)'
                }}>
                  {specialty.features.map((feature, index) => (
                    <li key={index} style={{ 
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ 
                        color: specialty.color, 
                        marginRight: '0.5rem',
                        fontWeight: 'bold'
                      }}>
                        •
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {specialty.isActive ? (
              <Link 
                to={specialty.path} 
                className="specialty-button active"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: specialty.color,
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Access Tools
              </Link>
            ) : (
              <span 
                className="specialty-button inactive"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#e5e7eb',
                  color: '#9ca3af',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  width: '100%',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              >
                Coming Soon
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiseaseDiagnosis;