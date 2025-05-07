import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const featureCards = [
    {
      id: 'protocol',
      title: 'Protocol & Study Design Generator',
      icon: '📝',
      description: 'Generate comprehensive clinical protocols for various diseases and conditions',
      path: '/protocol',
      color: '#ebf8ff',
      borderColor: 'var(--color-info)',
      textColor: '#2b6cb0'
    },
    {
      id: 'ind-modules',
      title: 'Regulatory Documents',
      icon: '📋',
      description: 'Create regulatory documents and IND modules for pharmaceutical development',
      path: '/ind-modules',
      color: '#f0fff4',
      borderColor: 'var(--color-success)',
      textColor: '#276749'
    },
    {
      id: 'diagnosis',
      title: 'Disease Diagnosis',
      icon: '🔍',
      description: 'AI-powered tools for diagnosing conditions across multiple medical specialties',
      path: '/diagnosis',
      color: '#ebf4ff',
      borderColor: 'var(--color-primary)',
      textColor: 'var(--color-primary-dark)'
    },
    {
      id: 'query',
      title: 'ASK LUMINA ©',
      icon: '❓',
      description: 'Get expert answers to complex questions about clinical trials and protocols',
      path: '/query',
      color: '#faf5ff',
      borderColor: '#9f7aea',
      textColor: '#553c9a'
    }
  ];

  return (
    <div className="home-page">
      <div className="hero-section fade-in">
        <h1>LumiPath©</h1>
        <p>
          Advanced AI tools for clinical protocol development, regulatory documentation, 
          and disease diagnosis
        </p>
      </div>

      <div className="feature-grid">
        {featureCards.map(card => (
          <Link 
            to={card.path} 
            key={card.id} 
            className="feature-card"
            style={{ 
              backgroundColor: card.color,
              borderColor: card.borderColor,
              color: card.textColor
            }}
          >
            <div className="card-icon">{card.icon}</div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <div className="card-button">
              Access Tool
            </div>
          </Link>
        ))}
      </div>

      <div className="info-section">
        <h2>How It Works</h2>
        <div className="workflow-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Select a Tool</h3>
              <p>Choose from our suite of AI-powered clinical tools</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Input Parameters</h3>
              <p>Provide disease information, patient data, or research requirements</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Generate Results</h3>
              <p>Receive AI-generated protocols, documentation, or diagnoses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>About Luminari</h2>
        <p>
          Luminari is an AI platform designed to streamline clinical research and 
          pharmaceutical development. Our tools leverage artificial intelligence 
          to generate high-quality, regulatory-compliant documentation and assist with 
          medical diagnoses across multiple specialties.
        </p>
        <p>
          Our mission is to accelerate medical innovation and improve patient outcomes by
          reducing the time and complexity involved in clinical research documentation.
        </p>
      </div>
    </div>
  );
};

export default HomePage;