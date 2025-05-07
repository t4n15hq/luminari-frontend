import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ProtocolGenerator = () => {
  const [disease, setDisease] = useState('');
  const [population, setPopulation] = useState('');
  const [treatment, setTreatment] = useState('');
  const [drugClass, setDrugClass] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [studyDesign, setStudyDesign] = useState(null);
  const [activeTab, setActiveTab] = useState('protocol');
  const [error, setError] = useState('');
  const [showGeneratedInfo, setShowGeneratedInfo] = useState(false);

  // Protocol sections for navigation
  const protocolSections = [
    { id: 'protocol-section-1', title: '1. Protocol Summary / Synopsis' },
    { id: 'protocol-section-2', title: '2. Introduction & Background' },
    { id: 'protocol-section-3', title: '3. Objectives & Endpoints' },
    { id: 'protocol-section-4', title: '4. Study Design & Investigational Plan' },
    { id: 'protocol-section-5', title: '5. Study Population & Eligibility' },
    { id: 'protocol-section-6', title: '6. Interventions / Treatments' },
    { id: 'protocol-section-7', title: '7. Assessments & Procedures' },
    { id: 'protocol-section-8', title: '8. Statistical Considerations & Data Analysis' },
    { id: 'protocol-section-9', title: '9. Outcome Analysis' },
    { id: 'protocol-section-10', title: '10. References & Appendices' }
  ];

  // Study design sections for navigation
  const studyDesignSections = [
    { id: 'cmc-section', title: 'CMC Section' },
    { id: 'clinical-section-1', title: '1. Intro / Background' },
    { id: 'clinical-section-2', title: '2. Objectives / Hypotheses / Endpoints' },
    { id: 'clinical-section-3', title: '3. Study Design & Sample Size' },
    { id: 'clinical-section-4', title: '4. Populations & Baseline' },
    { id: 'clinical-section-5', title: '5. Statistical Methods & Data Handling' },
    { id: 'clinical-section-6', title: '6. Efficacy Analysis' },
    { id: 'clinical-section-7', title: '7. Safety Analysis' },
    { id: 'clinical-section-8', title: '8. Pharmacokinetic / Exploratory' },
    { id: 'clinical-section-9', title: '9. Interim & Other Special Analyses' },
    { id: 'clinical-section-10', title: '10. References & Appendices' }
  ];

  // Get disease from localStorage on mount
  useEffect(() => {
    const detectedDisease = localStorage.getItem('detectedDisease');
    if (detectedDisease) {
      setDisease(detectedDisease);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowGeneratedInfo(false);
    
    try {
      // Generate both protocol and study design in parallel
      const [protocolResponse, studyDesignResponse] = await Promise.all([
        apiService.generateProtocol({
          disease_name: disease,
          additional_parameters: {
            population: population || undefined,
            treatment_duration: treatment || undefined,
            drug_class: drugClass || undefined,
            mechanism: mechanism || undefined,
            clinical_info: clinicalInfo || undefined
          }
        }),
        apiService.generateIndModule({
          disease_name: disease,
          additional_parameters: {
            population: population || undefined,
            treatment_duration: treatment || undefined,
            drug_class: drugClass || undefined,
            mechanism: mechanism || undefined,
            clinical_info: clinicalInfo || undefined
          }
        })
      ]);
      
      setResult(protocolResponse);
      setStudyDesign(studyDesignResponse);
      setShowGeneratedInfo(true);
      
      // Automatically scroll to results
      setTimeout(() => {
        document.querySelector('.result-container')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (err) {
      setError('Failed to generate protocol. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = (content, filename) => {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const generatePDF = async (documentId, filename) => {
    try {
      setLoading(true);
      
      // For this implementation, we'll simply download as text
      // In a production environment, you'd integrate jsPDF and html2canvas
      if (documentId === 'protocol') {
        downloadDocument(result.protocol, `${filename}.txt`);
      } else if (documentId === 'studyDesign') {
        downloadDocument(
          `CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`,
          `${filename}.txt`
        );
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to identify protocol sections and add IDs for navigation
  const renderProtocolSections = (content) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const sectionsMarkup = [];
    
    lines.forEach((line, idx) => {
      // Check if this is a main section header (starts with a number followed by period)
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
      
      if (sectionMatch && parseInt(sectionMatch[1]) >= 1 && parseInt(sectionMatch[1]) <= 10) {
        sectionsMarkup.push(
          <h4 
            key={`section-${idx}`} 
            id={`protocol-section-${sectionMatch[1]}`} 
            className="section-title"
          >
            {line}
          </h4>
        );
      } else if (line.trim()) {
        // For other text content
        if (line.match(/^[A-Z][a-z]/) || line.match(/^\d+\.\d+/)) {
          // Possible subsection title
          sectionsMarkup.push(<h5 key={`subsection-${idx}`} className="subsection-title">{line}</h5>);
        } else {
          // Regular paragraph
          sectionsMarkup.push(<p key={`p-${idx}`}>{line}</p>);
        }
      } else {
        // Empty line
        sectionsMarkup.push(<br key={`br-${idx}`} />);
      }
    });
    
    return sectionsMarkup;
  };

  // Function to identify clinical section sections and add IDs for navigation
  const renderClinicalSections = (content) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const sectionsMarkup = [];
    
    lines.forEach((line, idx) => {
      // Check if this is a main section header (starts with a number followed by period)
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
      
      if (sectionMatch && parseInt(sectionMatch[1]) >= 1 && parseInt(sectionMatch[1]) <= 10) {
        sectionsMarkup.push(
          <h4 
            key={`clinical-section-${idx}`} 
            id={`clinical-section-${sectionMatch[1]}`} 
            className="section-title"
          >
            {line}
          </h4>
        );
      } else if (line.trim()) {
        // For other text content
        if (line.match(/^[A-Z][a-z]/) || line.match(/^\d+\.\d+/)) {
          // Possible subsection title
          sectionsMarkup.push(<h5 key={`clinical-subsection-${idx}`} className="subsection-title">{line}</h5>);
        } else if (line.match(/^[•\-*]/)) {
          // List item
          sectionsMarkup.push(<li key={`li-${idx}`} className="list-item">{line.substring(1).trim()}</li>);
        } else {
          // Regular paragraph
          sectionsMarkup.push(<p key={`p-${idx}`}>{line}</p>);
        }
      } else {
        // Empty line
        sectionsMarkup.push(<br key={`br-${idx}`} />);
      }
    });
    
    return sectionsMarkup;
  };

  return (
    <div className="protocol-generator">
      <h2>Clinical Study Protocol Generator</h2>
      <p>Generate a complete clinical study protocol for dermatological conditions</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="disease">Skin Disease/Condition <span className="required">*</span></label>
            <input
              id="disease"
              type="text"
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              placeholder="e.g., Psoriasis, Eczema, Atopic Dermatitis"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="population">Target Population</label>
            <input
              id="population"
              type="text"
              value={population}
              onChange={(e) => setPopulation(e.target.value)}
              placeholder="e.g., Adults, Pediatric, Elderly"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="treatment">Treatment Duration</label>
            <input
              id="treatment"
              type="text"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="e.g., 12 weeks, 6 months"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="drugClass">Drug Class</label>
            <input
              id="drugClass"
              type="text"
              value={drugClass}
              onChange={(e) => setDrugClass(e.target.value)}
              placeholder="e.g., small molecule JAK inhibitor"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="mechanism">Mechanism of Action</label>
            <input
              id="mechanism"
              type="text"
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              placeholder="e.g., Selectively inhibits JAK1 and JAK2"
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="clinicalInfo">Clinical Study Information</label>
          <textarea
            id="clinicalInfo"
            value={clinicalInfo}
            onChange={(e) => setClinicalInfo(e.target.value)}
            placeholder="e.g., Previous clinical data, specific assessment methods, biomarker strategies, etc."
            rows="3"
            className="clinical-info-textarea"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit"
            disabled={loading || !disease}
            className="submit-btn"
          >
            {loading ? 'Generating...' : 'Generate Document'}
          </button>
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Generating documents. </p>
            </div>
          )}
        </div>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {showGeneratedInfo && (
        <div className="success-message">
          <i className="icon-success"></i>
          <p>Documentation successfully generated!</p>
        </div>
      )}
      
      {(result || studyDesign) && (
        <div className="result-container" id="results-section">
          <div className="document-tabs">
            <button 
              className={`tab-btn ${activeTab === 'protocol' ? 'active' : ''}`}
              onClick={() => setActiveTab('protocol')}
            >
              Protocol
            </button>
            <button 
              className={`tab-btn ${activeTab === 'studyDesign' ? 'active' : ''}`}
              onClick={() => setActiveTab('studyDesign')}
            >
              Study Design
            </button>
          </div>
          
          {activeTab === 'protocol' && result && (
            <div className="document-content" id="protocol-document">
              <div className="document-header">
                <h3>Protocol</h3>
                <div className="document-meta">
                  <span>Protocol ID: {result.protocol_id}</span>
                  <span>Version: 1.0</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="document-navigation">
                <h5>Table of Contents</h5>
                <ul>
                  {protocolSections.map(section => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({behavior: 'smooth'});
                      }}>
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="protocol-content">
                {renderProtocolSections(result.protocol)}
              </div>
              
              <div className="action-buttons">
                <button onClick={() => navigator.clipboard.writeText(result.protocol)}>
                  <i className="icon-copy"></i> Copy to Clipboard
                </button>
                <button onClick={() => downloadDocument(result.protocol, `Protocol_Executive_Summary_${disease.replace(/\s+/g, '_')}_${result.protocol_id}.txt`)}>
                  <i className="icon-download"></i> Download Text
                </button>
                <button onClick={() => generatePDF('protocol', `Protocol_Executive_Summary_${disease.replace(/\s+/g, '_')}_${result.protocol_id}`)}>
                  <i className="icon-pdf"></i> Download PDF
                </button>
                <button onClick={() => window.print()}>
                  <i className="icon-print"></i> Print
                </button>
                <button className="btn-secondary" onClick={() => window.open(`mailto:?subject=Protocol for ${disease}&body=${encodeURIComponent(result.protocol)}`)}>
                  <i className="icon-email"></i> Email
                </button>
              </div>
              
              <div className="protocol-info">
                Document Generated: {new Date().toLocaleString()} | Protocol ID: {result.protocol_id}
              </div>
            </div>
          )}
          
          {activeTab === 'studyDesign' && studyDesign && (
            <div className="document-content" id="studydesign-document">
              <div className="document-header">
                <h3>Study Design (Main Document)</h3>
                <div className="document-meta">
                  <span>Study ID: SD-{result ? result.protocol_id.substring(5) : Date.now()}</span>
                  <span>Version: 1.0</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="document-navigation">
                <h5>Table of Contents</h5>
                <ul>
                  {studyDesignSections.map(section => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({behavior: 'smooth'});
                      }}>
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div id="cmc-section" className="study-design-section">
                <h4 className="main-section-title">CMC SECTION</h4>
                <div className="section-content">
                  {studyDesign.cmc_section.split('\n').map((paragraph, idx) => (
                    paragraph.trim() ? 
                      paragraph.match(/^[A-Z\s]{5,}$/) ? 
                        <h4 key={idx} className="section-title">{paragraph}</h4> :
                      paragraph.match(/^[0-9]+\.[0-9]/) || paragraph.match(/^[A-Z][a-z]/) ?
                        <h5 key={idx} className="subsection-title">{paragraph}</h5> :
                      paragraph.match(/^[•\-*]/) ?
                        <li key={idx} className="list-item">{paragraph.substring(1).trim()}</li> :
                        <p key={idx}>{paragraph}</p>
                    : <br key={idx} />
                  ))}
                </div>
              </div>
              
              <div className="study-design-section clinical-section">
                <div className="section-content">
                  {renderClinicalSections(studyDesign.clinical_section)}
                </div>
              </div>
              
              <div className="action-buttons">
                <button onClick={() => navigator.clipboard.writeText(
                  `CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`
                )}>
                  <i className="icon-copy"></i> Copy to Clipboard
                </button>
                <button onClick={() => downloadDocument(
                  `CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`,
                  `Study_Design_Main_Document_${disease.replace(/\s+/g, '_')}.txt`
                )}>
                  <i className="icon-download"></i> Download Text
                </button>
                <button onClick={() => generatePDF('studyDesign', `Study_Design_Main_Document_${disease.replace(/\s+/g, '_')}`)}>
                  <i className="icon-pdf"></i> Download PDF
                </button>
                <button onClick={() => window.print()}>
                  <i className="icon-print"></i> Print
                </button>
                <button className="btn-secondary" onClick={() => window.open(`mailto:?subject=Study Design for ${disease}&body=${encodeURIComponent(`CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`)}`)}>
                  <i className="icon-email"></i> Email
                </button>
              </div>
              
              <div className="document-footer">
                <p>This document was generated according to ICH E6(R2) Good Clinical Practice guidelines and meets professional industry standards.</p>
                <p>Document Generated: {new Date().toLocaleString()} | Study ID: SD-{result ? result.protocol_id.substring(5) : Date.now()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProtocolGenerator;