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
      
      {/* Information sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        
        {/* Currently Available Tools */}
        <div className="info-box">
          <h4 style={{ color: 'var(--color-success)', marginBottom: '1rem', fontSize: '1.2rem' }}>
            🟢 Currently Available
          </h4>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)', fontSize: '1rem' }}>
              Dermatology Tools
            </h5>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <li>Image-based skin disease detection</li>
              <li>Clinical symptom analysis</li>
              <li>AI-powered diagnosis suggestions</li>
              <li>Integration with protocol generation</li>
            </ul>
          </div>

          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)', fontSize: '1rem' }}>
              Pulmonology Tools
            </h5>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <li>Lung cancer risk assessment</li>
              <li>Clinical biomarker analysis</li>
              <li>Text-based medical record analysis</li>
              <li>Patient history evaluation</li>
            </ul>
          </div>
        </div>

        {/* About Diagnosis Tools */}
        <div className="info-box">
          <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
            About Disease Diagnosis Tools
          </h4>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            LumiPath's AI-driven diagnosis tools help clinicians identify potential conditions based on
            patient symptoms, images, and other clinical data. These tools are designed to support
            clinical decision-making, not replace professional medical judgment.
          </p>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            Our platform combines machine learning models, natural language processing, and computer vision
            to provide comprehensive diagnostic support across multiple medical specialties.
          </p>
          <p style={{ margin: 0, lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
            <strong>Note:</strong> All diagnostic suggestions should be validated by qualified healthcare professionals
            before making treatment decisions.
          </p>
        </div>

        {/* Coming Soon Features */}
        <div className="info-box">
          <h4 style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '1.2rem' }}>
            🔵 Coming Soon
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <li><strong>Neurology:</strong> Cognitive assessment and neurological condition screening</li>
            <li><strong>Cardiology:</strong> ECG analysis and cardiovascular risk prediction</li>
            <li><strong>Oncology:</strong> Multi-cancer detection and treatment monitoring</li>
            <li><strong>Rare Diseases:</strong> Genetic analysis and orphan disease identification</li>
            <li><strong>Mental Health:</strong> Psychological screening and cognitive evaluation</li>
            <li><strong>Additional specialties</strong> based on user feedback and clinical needs</li>
          </ul>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        marginTop: '3rem', 
        padding: '2rem', 
        backgroundColor: 'var(--color-background)', 
        borderRadius: '1rem',
        textAlign: 'center',
        border: '1px solid var(--color-border)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text)' }}>
          Ready to Get Started?
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--color-text-light)', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Choose from our available diagnostic tools above, or explore our other AI-powered clinical tools
          for protocol generation and regulatory documentation.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/protocol" 
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500'
            }}
          >
            Generate Protocol
          </Link>
          <Link 
            to="/ind-modules" 
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-success)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500'
            }}
          >
            Regulatory Documents
          </Link>
          <Link 
            to="/query" 
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#805AD5',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500'
            }}
          >
            Ask Clinical Question
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDiagnosis;