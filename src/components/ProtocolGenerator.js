import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ProtocolGenerator = () => {
  // Basic Information
  const [disease, setDisease] = useState('');
  const [population, setPopulation] = useState('');
  const [treatment, setTreatment] = useState('');
  const [drugClass, setDrugClass] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [clinicalInfo, setClinicalInfo] = useState('');

  // Trial Design & Basics
  const [trialPhase, setTrialPhase] = useState('');
  const [trialType, setTrialType] = useState('');
  const [randomization, setRandomization] = useState('');
  const [blinding, setBlinding] = useState('');
  const [controlGroupType, setControlGroupType] = useState('');

  // Population & Eligibility
  const [sampleSize, setSampleSize] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');
  const [inclusionCriteria, setInclusionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');

  // Intervention & Drug Details
  const [routeOfAdministration, setRouteOfAdministration] = useState('');
  const [dosingFrequency, setDosingFrequency] = useState('');
  const [comparatorDrug, setComparatorDrug] = useState('');

  // Endpoints & Outcome Measures
  const [primaryEndpoints, setPrimaryEndpoints] = useState('');
  const [secondaryEndpoints, setSecondaryEndpoints] = useState('');
  const [outcomeMeasurementTool, setOutcomeMeasurementTool] = useState('');

  // Statistics & Duration
  const [statisticalPower, setStatisticalPower] = useState('80');
  const [significanceLevel, setSignificanceLevel] = useState('0.05');
  const [studyDuration, setStudyDuration] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [studyDesign, setStudyDesign] = useState(null);
  const [activeTab, setActiveTab] = useState('protocol');
  const [error, setError] = useState('');
  const [showGeneratedInfo, setShowGeneratedInfo] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

  // Dropdown options
  const trialPhases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV'];
  const trialTypes = ['Interventional', 'Observational', 'Registry'];
  const blindingOptions = ['Open-label', 'Single-blind', 'Double-blind'];
  const controlGroupTypes = ['Placebo', 'Standard of Care', 'None'];
  const genderOptions = ['All', 'Male', 'Female'];
  const routeOptions = ['Oral', 'Intravenous (IV)', 'Subcutaneous (SC)', 'Intramuscular (IM)', 'Topical', 'Inhalation', 'Transdermal'];
  const dosingFrequencyOptions = ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed'];
  const outcomeMeasurementTools = [
    'PASI (Psoriasis Area and Severity Index)',
    'DLQI (Dermatology Life Quality Index)',
    'EASI (Eczema Area and Severity Index)',
    'IGA (Investigator Global Assessment)',
    'VAS (Visual Analog Scale)',
    'HAM-D (Hamilton Depression Rating Scale)',
    'MMSE (Mini-Mental State Examination)',
    'FEV1 (Forced Expiratory Volume)',
    'FVC (Forced Vital Capacity)',
    'WOMAC (Western Ontario and McMaster Universities Arthritis Index)',
    'Custom/Other'
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
      // Compile all form data
      const formData = {
        disease_name: disease,
        additional_parameters: {
          // Basic information
          population: population || undefined,
          treatment_duration: treatment || undefined,
          drug_class: drugClass || undefined,
          mechanism: mechanism || undefined,
          clinical_info: clinicalInfo || undefined,
          
          // Trial Design & Basics
          trial_phase: trialPhase || undefined,
          trial_type: trialType || undefined,
          randomization: randomization || undefined,
          blinding: blinding || undefined,
          control_group_type: controlGroupType || undefined,
          
          // Population & Eligibility
          sample_size: sampleSize || undefined,
          min_age: minAge || undefined,
          max_age: maxAge || undefined,
          gender: gender || undefined,
          inclusion_criteria: inclusionCriteria || undefined,
          exclusion_criteria: exclusionCriteria || undefined,
          
          // Intervention & Drug Details
          route_of_administration: routeOfAdministration || undefined,
          dosing_frequency: dosingFrequency || undefined,
          comparator_drug: comparatorDrug || undefined,
          
          // Endpoints & Outcome Measures
          primary_endpoints: primaryEndpoints || undefined,
          secondary_endpoints: secondaryEndpoints || undefined,
          outcome_measurement_tool: outcomeMeasurementTool || undefined,
          
          // Statistics & Duration
          statistical_power: statisticalPower || undefined,
          significance_level: significanceLevel || undefined,
          study_duration: studyDuration || undefined
        }
      };

      // Generate both protocol and study design in parallel
      const [protocolResponse, studyDesignResponse] = await Promise.all([
        apiService.generateProtocol(formData),
        apiService.generateIndModule(formData)
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Clinical Study Protocol Generator</h2>
          <p>Generate a complete clinical study protocol with enhanced trial design parameters</p>
        </div>
        
      </div>

      
      
      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="disease">Disease/Condition <span className="required">*</span></label>
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
        </div>

        {/* Trial Design & Basics Section */}
        <div className="form-section">
          <h3>Trial Design & Basics</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="trialPhase">Trial Phase</label>
              <select
                id="trialPhase"
                value={trialPhase}
                onChange={(e) => setTrialPhase(e.target.value)}
              >
                <option value="">Select Phase</option>
                {trialPhases.map(phase => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trialType">Trial Type</label>
              <select
                id="trialType"
                value={trialType}
                onChange={(e) => setTrialType(e.target.value)}
              >
                <option value="">Select Type</option>
                {trialTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Randomization</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="randomization"
                    value="Yes"
                    checked={randomization === 'Yes'}
                    onChange={(e) => setRandomization(e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="randomization"
                    value="No"
                    checked={randomization === 'No'}
                    onChange={(e) => setRandomization(e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  No
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="blinding">Blinding</label>
              <select
                id="blinding"
                value={blinding}
                onChange={(e) => setBlinding(e.target.value)}
              >
                <option value="">Select Blinding</option>
                {blindingOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="controlGroupType">Control Group Type</label>
              <select
                id="controlGroupType"
                value={controlGroupType}
                onChange={(e) => setControlGroupType(e.target.value)}
              >
                <option value="">Select Control</option>
                {controlGroupTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Population & Eligibility Section */}
        <div className="form-section">
          <h3>Population & Eligibility</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="sampleSize">Target Sample Size</label>
              <input
                id="sampleSize"
                type="number"
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)}
                placeholder="e.g., 120"
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="minAge">Minimum Age</label>
              <input
                id="minAge"
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder="e.g., 18"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxAge">Maximum Age</label>
              <input
                id="maxAge"
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                placeholder="e.g., 75"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                {genderOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="inclusionCriteria">Inclusion Criteria</label>
              <textarea
                id="inclusionCriteria"
                value={inclusionCriteria}
                onChange={(e) => setInclusionCriteria(e.target.value)}
                placeholder="e.g., Adults aged 18-75 years, Confirmed diagnosis of moderate-to-severe condition..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="exclusionCriteria">Exclusion Criteria</label>
              <textarea
                id="exclusionCriteria"
                value={exclusionCriteria}
                onChange={(e) => setExclusionCriteria(e.target.value)}
                placeholder="e.g., Pregnancy, Active infection, Immunocompromised state..."
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Intervention & Drug Details Section */}
        <div className="form-section">
          <h3>Intervention & Drug Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="routeOfAdministration">Route of Administration</label>
              <select
                id="routeOfAdministration"
                value={routeOfAdministration}
                onChange={(e) => setRouteOfAdministration(e.target.value)}
              >
                <option value="">Select Route</option>
                {routeOptions.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dosingFrequency">Dosing Frequency</label>
              <select
                id="dosingFrequency"
                value={dosingFrequency}
                onChange={(e) => setDosingFrequency(e.target.value)}
              >
                <option value="">Select Frequency</option>
                {dosingFrequencyOptions.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comparatorDrug">Comparator/Control Drug</label>
              <input
                id="comparatorDrug"
                type="text"
                value={comparatorDrug}
                onChange={(e) => setComparatorDrug(e.target.value)}
                placeholder="e.g., Placebo, Standard of care"
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
          </div>
        </div>

        {/* Endpoints & Outcome Measures Section */}
        <div className="form-section">
          <h3>Endpoints & Outcome Measures</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="primaryEndpoints">Primary Endpoint(s)</label>
              <textarea
                id="primaryEndpoints"
                value={primaryEndpoints}
                onChange={(e) => setPrimaryEndpoints(e.target.value)}
                placeholder="e.g., Proportion of patients achieving PASI 75 at Week 16"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="secondaryEndpoints">Secondary Endpoint(s)</label>
              <textarea
                id="secondaryEndpoints"
                value={secondaryEndpoints}
                onChange={(e) => setSecondaryEndpoints(e.target.value)}
                placeholder="e.g., PASI 90 response, sPGA score, Quality of life measures"
                rows="3"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="outcomeMeasurementTool">Outcome Measurement Tool</label>
              <select
                id="outcomeMeasurementTool"
                value={outcomeMeasurementTool}
                onChange={(e) => setOutcomeMeasurementTool(e.target.value)}
              >
                <option value="">Select Measurement Tool</option>
                {outcomeMeasurementTools.map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics & Duration Section */}
        <div className="form-section">
          <h3>Statistical Considerations</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="statisticalPower">Statistical Power (%)</label>
              <input
                id="statisticalPower"
                type="number"
                value={statisticalPower}
                onChange={(e) => setStatisticalPower(e.target.value)}
                placeholder="80"
                min="1"
                max="99"
              />
            </div>

            <div className="form-group">
              <label htmlFor="significanceLevel">Significance Level (α)</label>
              <input
                id="significanceLevel"
                type="number"
                value={significanceLevel}
                onChange={(e) => setSignificanceLevel(e.target.value)}
                placeholder="0.05"
                step="0.01"
                min="0.01"
                max="0.2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="studyDuration">Estimated Study Duration</label>
              <input
                id="studyDuration"
                type="text"
                value={studyDuration}
                onChange={(e) => setStudyDuration(e.target.value)}
                placeholder="e.g., 18 months total (12 weeks treatment + 6 months follow-up)"
              />
            </div>
          </div>
        </div>

        {/* Clinical Study Information */}
        <div className="form-group full-width">
          <label htmlFor="clinicalInfo">Additional Clinical Study Information</label>
          <textarea
            id="clinicalInfo"
            value={clinicalInfo}
            onChange={(e) => setClinicalInfo(e.target.value)}
            placeholder="e.g., Previous clinical data, specific assessment methods, biomarker strategies, special populations, regulatory considerations..."
            rows="4"
            className="clinical-info-textarea"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit"
            disabled={loading || !disease}
            className="submit-btn"
          >
            {loading ? 'Generating...' : 'Generate Enhanced Protocol'}
          </button>
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Generating comprehensive protocol with all specified parameters...</p>
            </div>
          )}
        </div>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {showGeneratedInfo && (
        <div className="success-message">
          <i className="icon-success"></i>
          <p>Enhanced protocol documentation successfully generated with all trial design parameters!</p>
        </div>
      )}
      
      {(result || studyDesign) && (
        <div className="result-container" id="results-section">
          <div className="document-tabs">
            <button 
              className={`tab-btn ${activeTab === 'protocol' ? 'active' : ''}`}
              onClick={() => setActiveTab('protocol')}
            >
              Enhanced Protocol
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
                <h3>Enhanced Protocol</h3>
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
                <button onClick={() => downloadDocument(result.protocol, `Enhanced_Protocol_${disease.replace(/\s+/g, '_')}_${result.protocol_id}.txt`)}>
                  <i className="icon-download"></i> Download Text
                </button>
                <button onClick={() => generatePDF('protocol', `Enhanced_Protocol_${disease.replace(/\s+/g, '_')}_${result.protocol_id}`)}>
                  <i className="icon-pdf"></i> Download PDF
                </button>
                <button onClick={() => window.print()}>
                  <i className="icon-print"></i> Print
                </button>
                <button className="btn-secondary" onClick={() => window.open(`mailto:?subject=Enhanced Protocol for ${disease}&body=${encodeURIComponent(result.protocol)}`)}>
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
                  `Enhanced_Study_Design_${disease.replace(/\s+/g, '_')}.txt`
                )}>
                  <i className="icon-download"></i> Download Text
                </button>
                <button onClick={() => generatePDF('studyDesign', `Enhanced_Study_Design_${disease.replace(/\s+/g, '_')}`)}>
                  <i className="icon-pdf"></i> Download PDF
                </button>
                <button onClick={() => window.print()}>
                  <i className="icon-print"></i> Print
                </button>
                <button className="btn-secondary" onClick={() => window.open(`mailto:?subject=Enhanced Study Design for ${disease}&body=${encodeURIComponent(`CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`)}`)}>
                  <i className="icon-email"></i> Email
                </button>
              </div>
              
              <div className="document-footer">
                <p>This enhanced document was generated with comprehensive trial design parameters according to ICH E6(R2) Good Clinical Practice guidelines and meets professional industry standards.</p>
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