import React from 'react';
import { Link } from 'react-router-dom';

const RegulatoryDocuments = () => {
  const documentTypes = [
    {
      id: 'ind-modules',
      title: 'IND Module Generator',
      icon: '💊',
      description: 'Generate CMC and Clinical sections for an Investigational New Drug (IND) application',
      path: '/ind-modules',
      color: '#f0fff4',
      borderColor: 'var(--color-success)',
      textColor: '#276749'
    },
    {
      id: 'clinical-dossier',
      title: 'Clinical Dossier Compiler',
      icon: '📄',
      description: 'Compile clinical trial documents into regulatory dossiers',
      path: '/clinical-dossier',
      color: '#e6fffa',
      borderColor: '#38b2ac',
      textColor: '#234e52'
    }
  ];

  return (
    <div className="regulatory-documents">
      <h2>Regulatory Documents</h2>
      <p>Generate regulatory documents for clinical trials and pharmaceutical development</p>
      
      <div className="document-types-grid">
        {documentTypes.map(doc => (
          <Link 
            to={doc.path} 
            key={doc.id} 
            className="document-type-card"
            style={{ 
              backgroundColor: doc.color,
              borderColor: doc.borderColor,
              color: doc.textColor
            }}
          >
            <div className="card-icon">{doc.icon}</div>
            <h3>{doc.title}</h3>
            <p>{doc.description}</p>
            <div className="card-button">
              Access Tool
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RegulatoryDocuments;