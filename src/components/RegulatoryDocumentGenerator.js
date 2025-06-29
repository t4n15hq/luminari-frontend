// src/components/RegulatoryDocumentGenerator.js
// Main Document Generation Form and Logic

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const RegulatoryDocumentGenerator = () => {
  // Basic Information
  const [disease, setDisease] = useState('');
  const [drugClass, setDrugClass] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [country, setCountry] = useState('');
  const [documentType, setDocumentType] = useState('');

  // Trial Characteristics
  const [trialPhase, setTrialPhase] = useState('');
  const [trialType, setTrialType] = useState('');
  const [blinding, setBlinding] = useState('');
  const [randomization, setRandomization] = useState('');

  // Population Details
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');
  const [targetSampleSize, setTargetSampleSize] = useState('');
  const [inclusionCriteria, setInclusionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');

  // Treatment & Control
  const [drugFormulation, setDrugFormulation] = useState('');
  const [routeOfAdministration, setRouteOfAdministration] = useState('');
  const [dosingRegimen, setDosingRegimen] = useState('');
  const [controlGroup, setControlGroup] = useState('');

  // Endpoints & Outcomes
  const [primaryEndpoints, setPrimaryEndpoints] = useState('');
  const [secondaryEndpoints, setSecondaryEndpoints] = useState('');
  const [outcomeMeasureTool, setOutcomeMeasureTool] = useState('');

  // Statistical Considerations
  const [statisticalPower, setStatisticalPower] = useState('80');
  const [significanceLevel, setSignificanceLevel] = useState('0.05');

  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('cmc');
  const [selectedCountryData, setSelectedCountryData] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // For navigation
  const location = useLocation();
  const navigate = useNavigate();
  
  // Dropdown Options
  const trialPhases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV'];
  const trialTypes = ['Interventional', 'Observational', 'Expanded Access'];
  const blindingOptions = ['Open-label', 'Single-blind', 'Double-blind'];
  const genderOptions = ['All', 'Male', 'Female'];
  const drugFormulationOptions = ['Tablet', 'Capsule', 'Injection', 'Topical Cream', 'Topical Gel', 'Patch', 'Inhalation', 'Oral Solution'];
  const routeOptions = ['Oral', 'Intravenous (IV)', 'Subcutaneous (SC)', 'Intramuscular (IM)', 'Topical', 'Inhalation', 'Transdermal'];
  const controlGroupOptions = ['Placebo', 'Standard of Care (SoC)', 'Active Comparator', 'Historical Control', 'None'];
  const outcomeMeasureTools = [
    'PASI (Psoriasis Area and Severity Index)',
    'DLQI (Dermatology Life Quality Index)',
    'EASI (Eczema Area and Severity Index)',
    'IGA (Investigator Global Assessment)',
    'VAS (Visual Analog Scale)',
    'FVC (Forced Vital Capacity)',
    'FEV1 (Forced Expiratory Volume)',
    'HAM-D (Hamilton Depression Rating Scale)',
    'MMSE (Mini-Mental State Examination)',
    'WOMAC (Western Ontario and McMaster Universities Arthritis Index)',
    'Custom/Other'
  ];

  // Load parameters from navigation state or localStorage
  useEffect(() => {
    // Check for navigation state from map selection
    if (location.state) {
      const { 
        selectedCountry, 
        selectedCountryId, 
        selectedRegion, 
        selectedDocuments 
      } = location.state;
      
      if (selectedCountry) {
        setCountry(selectedCountry);
        setSelectedCountryData({
          country: selectedCountry,
          countryId: selectedCountryId,
          region: selectedRegion,
          availableDocuments: selectedDocuments || []
        });
        
        // Pre-select the first available document type
        if (selectedDocuments && selectedDocuments.length > 0) {
          setDocumentType(selectedDocuments[0].name);
        }
      }
    }
    
    // Check localStorage as backup
    const detectedDisease = localStorage.getItem('detectedDisease');
    if (detectedDisease && !disease) {
      setDisease(detectedDisease);
    }
  }, [location.state, disease]);

  // Navigate back to map selection
  const handleBackToMap = () => {
    navigate('/regulatory-documents');
  };

  // Main form submit handler
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Compile all enhanced form data
      const enhancedFormData = {
        disease_name: disease.trim(),
        additional_parameters: {
          // Basic parameters
          drug_class: drugClass.trim() || undefined,
          mechanism: mechanism.trim() || undefined,
          country: country || undefined,
          document_type: documentType || undefined,
          
          // Trial Characteristics
          trial_phase: trialPhase || undefined,
          trial_type: trialType || undefined,
          blinding: blinding || undefined,
          randomization: randomization || undefined,
          
          // Population Details
          min_age: minAge || undefined,
          max_age: maxAge || undefined,
          gender: gender || undefined,
          target_sample_size: targetSampleSize || undefined,
          inclusion_criteria: inclusionCriteria || undefined,
          exclusion_criteria: exclusionCriteria || undefined,
          
          // Treatment & Control
          drug_formulation: drugFormulation || undefined,
          route_of_administration: routeOfAdministration || undefined,
          dosing_regimen: dosingRegimen || undefined,
          control_group: controlGroup || undefined,
          
          // Endpoints & Outcomes
          primary_endpoints: primaryEndpoints || undefined,
          secondary_endpoints: secondaryEndpoints || undefined,
          outcome_measure_tool: outcomeMeasureTool || undefined,
          
          // Statistical Considerations
          statistical_power: statisticalPower || undefined,
          significance_level: significanceLevel || undefined
        }
      };
      
      console.log("Starting enhanced document generation with parameters:", enhancedFormData);
      
      if (!disease || disease.trim() === '') {
        throw new Error('Disease/Condition is required');
      }

      // Call the API with the enhanced parameters
      const response = await apiService.generateIndModule(enhancedFormData);
      
      console.log("Enhanced API response received, response keys:", Object.keys(response));
      
      // Check structure of response to handle both response formats
      if (response.document_content) {
        // For document types that return a single content field
        const content = response.document_content;
        let cmcSection = "";
        let clinicalSection = "";
        
        // Try to find a logical dividing point based on section headers
        const possibleDividers = [
          "CLINICAL OVERVIEW", "CLINICAL SECTION", "CLINICAL STUDY", 
          "NONCLINICAL OVERVIEW", "3. NONCLINICAL", "4. CLINICAL", 
          "CLINICAL TRIAL", "EFFICACY AND SAFETY"
        ];
        
        let dividerIndex = -1;
        
        // Find the earliest occurrence of any divider
        for (const divider of possibleDividers) {
          const index = content.indexOf(divider);
          if (index !== -1 && (dividerIndex === -1 || index < dividerIndex)) {
            dividerIndex = index;
          }
        }
        
        if (dividerIndex !== -1) {
          cmcSection = content.substring(0, dividerIndex);
          clinicalSection = content.substring(dividerIndex);
          
          // If CMC section is very short, use fallback
          if (cmcSection.length < 500) {
            const backupDivider = Math.floor(content.length * 0.4);
            const breakpoint = content.indexOf("\n", backupDivider);
            if (breakpoint !== -1) {
              cmcSection = content.substring(0, breakpoint);
              clinicalSection = content.substring(breakpoint);
            }
          }
        } else {
          // Fallback: split at approximately 40% of the document
          const dividePoint = Math.floor(content.length * 0.4);
          const breakPoint = content.indexOf("\n\n", dividePoint);
          
          if (breakPoint !== -1) {
            cmcSection = content.substring(0, breakPoint);
            clinicalSection = content.substring(breakPoint);
          } else {
            const midpoint = Math.floor(content.length / 2);
            cmcSection = content.substring(0, midpoint);
            clinicalSection = content.substring(midpoint);
          }
        }
        
        setResult({
          cmc_section: cmcSection,
          clinical_section: clinicalSection
        });
      } else if (response.cmc_section || response.clinical_section) {
        // Original format with split sections
        setResult(response);
      } else {
        console.error("Unexpected response format:", response);
        throw new Error('Response format not recognized. Please check the console for details.');
      }
      
      // Scroll to results
      setTimeout(() => {
        document.querySelector('.result-container')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      
    } catch (err) {
      console.error("Enhanced document generation error:", err);
      setError(`Failed to generate regulatory documents: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setDisease('');
    setDrugClass('');
    setMechanism('');
    setDocumentType('');
    
    // Reset all fields
    setTrialPhase('');
    setTrialType('');
    setBlinding('');
    setRandomization('');
    setMinAge('');
    setMaxAge('');
    setGender('');
    setTargetSampleSize('');
    setInclusionCriteria('');
    setExclusionCriteria('');
    setDrugFormulation('');
    setRouteOfAdministration('');
    setDosingRegimen('');
    setControlGroup('');
    setPrimaryEndpoints('');
    setSecondaryEndpoints('');
    setOutcomeMeasureTool('');
    setStatisticalPower('80');
    setSignificanceLevel('0.05');
    
    setResult(null);
    setError('');
  };

  // Improved content rendering
  const renderContent = (content) => {
    if (!content) return <p>No content available.</p>;
    
    const paragraphs = content.split('\n');
    
    return (
      <div className="content-text">
        {paragraphs.map((para, idx) => (
          para.trim() ? 
            <p key={idx} className="content-paragraph">{para}</p> : 
            <br key={idx} />
        ))}
      </div>
    );
  };

  return (
    <div className="regulatory-document-generator">
      {/* Header with Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Enhanced Regulatory Document Generator</h2>
          <p>Generate comprehensive regulatory documentation with detailed trial design parameters</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleBackToMap}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to Map
          </button>

        </div>
      </div>

      {/* Selected Country Info */}
      {selectedCountryData && (
        <div style={{
          backgroundColor: '#f0fff4',
          border: '1px solid #9ae6b4',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#276749' }}>
            📍 Selected: {selectedCountryData.country} ({selectedCountryData.region})
          </h3>
          <p style={{ margin: '0', color: '#22543d' }}>
            Available documents: {selectedCountryData.availableDocuments.map(doc => doc.name).join(', ')}
          </p>
        </div>
      )}

      {/* Help Section */}
      {showHelp && (
        <div className="info-box mb-4">
          <h4>Additional Regulatory Fields You Can Consider Adding:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <h5>Advanced Regulatory Strategy:</h5>
              <ul style={{ fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
                <li>Fast Track designation eligibility</li>
                <li>Breakthrough therapy designation</li>
                <li>Orphan drug designation</li>
                <li>Priority review qualifications</li>
                <li>Pediatric investigation plan (PIP)</li>
              </ul>
            </div>
            <div>
              <h5>Manufacturing & Quality:</h5>
              <ul style={{ fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
                <li>Manufacturing site locations</li>
                <li>GMP certification status</li>
                <li>Release testing specifications</li>
                <li>Stability study designs</li>
                <li>Comparability protocols</li>
              </ul>
            </div>
            <div>
              <h5>Risk Management:</h5>
              <ul style={{ fontSize: '0.9rem', paddingLeft: '1.5rem' }}>
                <li>Risk evaluation strategies (REMS)</li>
                <li>Pharmacovigilance plans</li>
                <li>Safety data collection methods</li>
                <li>Benefit-risk assessment frameworks</li>
                <li>Post-marketing commitments</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="regulatory-form">
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

            {/* Document Type Selection */}
            {selectedCountryData && (
              <div className="form-group">
                <label htmlFor="documentType">Document Type <span className="required">*</span></label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="">Select Document Type</option>
                  {selectedCountryData.availableDocuments.map(doc => (
                    <option key={doc.id} value={doc.name}>
                      {doc.name}
                    </option>
                  ))}
                </select>
                <div className="form-hint">
                  {selectedCountryData.availableDocuments.find(doc => doc.name === documentType)?.purpose}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="drug-class">Drug Class</label>
              <input
                id="drug-class"
                type="text"
                value={drugClass}
                onChange={(e) => setDrugClass(e.target.value)}
                placeholder="e.g., Corticosteroid, Biologics, Small molecule"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mechanism">Mechanism of Action</label>
              <input
                id="mechanism"
                type="text"
                value={mechanism}
                onChange={(e) => setMechanism(e.target.value)}
                placeholder="e.g., PDE4 inhibition, JAK-STAT pathway"
              />
            </div>
          </div>
        </div>

        {/* Trial Characteristics Section */}
        <div className="form-section">
          <h3>Trial Characteristics</h3>
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
          </div>
        </div>

        {/* Population Details Section */}
        <div className="form-section">
          <h3>Population Details</h3>
          <div className="form-grid">
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

            <div className="form-group">
              <label htmlFor="targetSampleSize">Target Sample Size</label>
              <input
                id="targetSampleSize"
                type="number"
                value={targetSampleSize}
                onChange={(e) => setTargetSampleSize(e.target.value)}
                placeholder="e.g., 120"
                min="1"
              />
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

        {/* Treatment & Control Section */}
        <div className="form-section">
          <h3>Treatment & Control</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="drugFormulation">Drug Formulation</label>
              <select
                id="drugFormulation"
                value={drugFormulation}
                onChange={(e) => setDrugFormulation(e.target.value)}
              >
                <option value="">Select Formulation</option>
                {drugFormulationOptions.map(formulation => (
                  <option key={formulation} value={formulation}>{formulation}</option>
                ))}
              </select>
            </div>

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
              <label htmlFor="dosingRegimen">Dosing Regimen</label>
              <input
                id="dosingRegimen"
                type="text"
                value={dosingRegimen}
                onChange={(e) => setDosingRegimen(e.target.value)}
                placeholder="e.g., 50mg once daily for 12 weeks"
              />
            </div>

            <div className="form-group">
              <label htmlFor="controlGroup">Control Group</label>
              <select
                id="controlGroup"
                value={controlGroup}
                onChange={(e) => setControlGroup(e.target.value)}
              >
                <option value="">Select Control</option>
                {controlGroupOptions.map(control => (
                  <option key={control} value={control}>{control}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Endpoints & Outcomes Section */}
        <div className="form-section">
          <h3>Endpoints & Outcomes</h3>
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
              <label htmlFor="outcomeMeasureTool">Outcome Measure Tool</label>
              <select
                id="outcomeMeasureTool"
                value={outcomeMeasureTool}
                onChange={(e) => setOutcomeMeasureTool(e.target.value)}
              >
                <option value="">Select Measurement Tool</option>
                {outcomeMeasureTools.map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistical Considerations Section */}
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
          </div>
        </div>

        <div className="action-buttons">
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading || !disease}
            className="generate-button"
          >
            {loading ? 'Generating...' : `Generate Enhanced ${documentType || 'Regulatory Documents'}`}
          </button>
          <button 
            type="button" 
            onClick={resetForm}
            className="reset-button"
          >
            Reset Form
          </button>
        </div>
      </div>

      {error && <div className="error-message" aria-live="polite">{error}</div>}

      {loading && <div className="loading-indicator">
        <div className="spinner"></div>
        <p>Generating comprehensive regulatory documentation with enhanced trial parameters...</p>
      </div>}

      {result && (
        <div className="result-container" aria-live="polite">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'cmc' ? 'active' : ''}`}
              onClick={() => setActiveTab('cmc')}
            >
              CMC Section
            </button>
            <button
              className={`tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinical')}
            >
              Clinical Section
            </button>
          </div>

          <div className="module-content">
            {activeTab === 'cmc' ? (
              <>
                <h3>Chemistry, Manufacturing, and Controls (CMC)</h3>
                <div className="content-area">
                  {renderContent(result.cmc_section)}
                </div>
              </>
            ) : (
              <>
                <h3>Clinical Section</h3>
                <div className="content-area">
                  {renderContent(result.clinical_section)}
                </div>
              </>
            )}
          </div>

          <div className="action-buttons">
            <button
              onClick={() => {
                const content = activeTab === 'cmc'
                  ? result.cmc_section
                  : result.clinical_section;
                navigator.clipboard.writeText(content);
                alert('✅ Current section copied!');
              }}
              className="view-button"
            >
              Copy Current Section
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `CMC SECTION:\n\n${result.cmc_section}\n\nCLINICAL SECTION:\n\n${result.clinical_section}`
                );
                alert('✅ All sections copied!');
              }}
              className="view-button"
            >
              Copy All
            </button>
            <button
              onClick={() => {
                const content = `CMC SECTION:\n\n${result.cmc_section}\n\nCLINICAL SECTION:\n\n${result.clinical_section}`;
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Enhanced_${country || 'Regulatory'}_Document_${new Date().toISOString().slice(0, 10)}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="view-button"
            >
              Download as Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegulatoryDocumentGenerator;