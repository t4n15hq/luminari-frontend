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
  const [viewMode, setViewMode] = useState('form');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  
  // For navigation
  const location = useLocation();
  
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
  
  // Regions and countries
  const regions = {
    "North America": ["USA", "Canada", "Mexico"],
    "European Union": ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", 
                     "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", 
                     "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", 
                     "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"],
    "Asia Pacific": ["Japan", "China", "South Korea", "Taiwan", "India", "Singapore", "Australia", "New Zealand", "Malaysia", "Indonesia", "Philippines", "Vietnam", "Thailand"],
    "South America": ["Brazil", "Argentina", "Colombia", "Chile", "Peru", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay"],
    "Middle East & Africa": ["South Africa", "Israel", "Saudi Arabia", "UAE", "Egypt", "Turkey", "Nigeria"]
  };

  // Regulatory document data by country
  const regulatoryData = {
    "USA": [
      { id: "ind", name: "IND (Investigational New Drug)", purpose: "To begin clinical trials (Phases I-III)" },
      { id: "nda", name: "NDA (New Drug Application)", purpose: "To request approval for marketing a new drug" },
      { id: "bla", name: "BLA (Biologics License Application)", purpose: "For biologics approval under the Public Health Service Act" }
    ],
    "European Union": [
      { id: "cta_eu", name: "CTA (Clinical Trial Application)", purpose: "To authorize clinical trials" },
      { id: "maa", name: "MAA (Marketing Authorization Application)", purpose: "To request EU-wide marketing approval" },
      { id: "impd", name: "IMPD (Investigational Medicinal Product Dossier)", purpose: "Quality, manufacturing and control information" }
    ],
    "Japan": [
      { id: "ctn_jp", name: "Clinical Trial Notification (CTN)", purpose: "Submitted to PMDA before clinical trials" },
      { id: "jnda", name: "J-NDA (New Drug Application)", purpose: "Submitted to PMDA/MHLW for approval" }
    ],
    "China": [
      { id: "ind_ch", name: "IND", purpose: "Required before clinical trials (submitted to NMPA)" },
      { id: "nda_ch", name: "NDA", purpose: "Required for marketing approval" }
    ],
    "Australia": [
      { id: "ctn_au", name: "CTN (Clinical Trial Notification)", purpose: "Notification scheme for clinical trials" },
      { id: "aus", name: "AUS (Australian Submission)", purpose: "Part of the submission to TGA for registration on the ARTG" }
    ]
  };
  
  // Get documents for the selected country
  const getDocumentsForCountry = () => {
    if (!selectedCountry) return [];
    
    // If the country has specific documents, use them
    if (regulatoryData[selectedCountry]) {
      return regulatoryData[selectedCountry];
    }
    
    // Otherwise, use region-default documents
    if (selectedRegion === "European Union") {
      return regulatoryData["European Union"];
    }
    
    return [];
  };
  
  // Handler for document selection
  const handleDocumentSelect = (document) => {
    setSelectedDocuments(prev => {
      const exists = prev.some(doc => doc.id === document.id);
      if (exists) {
        return prev.filter(doc => doc.id !== document.id);
      } else {
        return [...prev, document];
      }
    });
  };
  
  // Apply selections from regulatory document flow
  const applyDocumentSelections = () => {
    setCountry(selectedCountry);
    
    if (selectedDocuments.length > 0) {
      const primaryDoc = selectedDocuments[0];
      setDocumentType(primaryDoc.name);
      console.log(`Selected document: ${primaryDoc.name}, Country: ${selectedCountry}`);
    }
    
    setViewMode('form');
  };
  
  // Load parameters from state or localStorage
  useEffect(() => {
    // First check for URL state parameters
    if (location.state) {
      const { selectedCountry: stateCountry, selectedDocuments: stateDocs } = location.state;
      
      if (stateCountry) {
        setSelectedCountry(stateCountry);
        setCountry(stateCountry);
      }
      
      if (stateDocs && stateDocs.length > 0) {
        setSelectedDocuments(stateDocs);
        
        // Find if there's an IND or NDA document
        const indDoc = stateDocs.find(doc => 
          doc.id?.includes('ind') || doc.id?.includes('nda'));
        
        if (indDoc) {
          setDocumentType(indDoc.name);
          
          // If the document has a specific disease associated, use it
          if (indDoc.disease) {
            setDisease(indDoc.disease);
          }
        }
      }
    }
    
    // Check localStorage as backup
    const detectedDisease = localStorage.getItem('detectedDisease');
    if (detectedDisease && !disease) {
      setDisease(detectedDisease);
    }
  }, [location.state, disease]);

  // Main form submit handler - ENHANCED VERSION
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
      
      // Log parameters for debugging
      console.log("Starting enhanced document generation with parameters:", enhancedFormData);
      
      if (!disease || disease.trim() === '') {
        throw new Error('Disease/Condition is required');
      }

      // Call the API with the enhanced parameters
      const response = await apiService.generateIndModule(enhancedFormData);
      
      console.log("Enhanced API response received, response keys:", Object.keys(response));
      
      // Check structure of response to handle both response formats
      if (response.document_content) {
        // For document types that return a single content field (like BLA, NDA, etc.)
        console.log("Response has document_content, handling this format");
        
        // Split document content into CMC and CLINICAL sections for display compatibility
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
        let dividerLength = 0;
        
        // Find the earliest occurrence of any divider
        for (const divider of possibleDividers) {
          const index = content.indexOf(divider);
          if (index !== -1 && (dividerIndex === -1 || index < dividerIndex)) {
            dividerIndex = index;
            dividerLength = divider.length;
          }
        }
        
        if (dividerIndex !== -1) {
          cmcSection = content.substring(0, dividerIndex);
          clinicalSection = content.substring(dividerIndex);
          
          // If CMC section is very short, it might be incorrect - better to have a fallback
          if (cmcSection.length < 500) {
            const backupDivider = Math.floor(content.length * 0.4); // 40% mark
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
            // Just split in the middle if no good breakpoint
            const midpoint = Math.floor(content.length / 2);
            cmcSection = content.substring(0, midpoint);
            clinicalSection = content.substring(midpoint);
          }
        }
        
        console.log(`Split document_content - CMC length: ${cmcSection.length}, Clinical length: ${clinicalSection.length}`);
        
        setResult({
          cmc_section: cmcSection,
          clinical_section: clinicalSection
        });
      } else if (response.cmc_section || response.clinical_section) {
        // Original format with split sections (IndModule, etc.)
        console.log("Response has separate cmc_section and clinical_section");
        console.log(`CMC length: ${response.cmc_section?.length || 0}, Clinical length: ${response.clinical_section?.length || 0}`);
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
    setCountry('');
    setDocumentType('');
    
    // Reset all new fields
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

  // Improved content rendering to handle large texts
  const renderContent = (content) => {
    if (!content) return <p>No content available.</p>;
    
    // Split content into chunks to avoid performance issues with large texts
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

  // Render the enhanced form view
  const renderForm = () => (
    <div className="regulatory-selector">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2>Enhanced Regulatory Document Generator</h2>
          <p>Generate comprehensive regulatory documentation with detailed trial design parameters</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="btn btn-secondary"
          >
            {showHelp ? 'Hide Help' : 'What Other Fields Can Be Added?'}
          </button>
          <button 
            onClick={() => setViewMode('regions')}
            className="view-button"
          >
            Select Document by Region/Country
          </button>
        </div>
      </div>

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

      {/* Show country and document type if they were preselected */}
      {(country || documentType) && (
        <div className="info-box mb-4">
          <h4>Selected Parameters</h4>
          {country && (
            <div className="mb-2">
              <span className="font-medium">Country:</span> {country}
            </div>
          )}
          {documentType && (
            <div className="mb-2">
              <span className="font-medium">Document Type:</span> {documentType}
            </div>
          )}
          <button 
            onClick={() => {
              setCountry('');
              setDocumentType('');
            }}
            className="text-blue-600 text-sm hover:underline"
          >
            Change Selection
          </button>
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

            {!country && (
              <div className="form-group">
                <label htmlFor="country">Country/Region (Optional)</label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., USA, EU, Japan"
                />
                <div className="form-hint">
                  Use the "Select Document by Region/Country" button above to browse available regulatory documents by geography
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
                // Create a blob for download
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

  // Render region selection view
  const renderRegionSelection = () => (
    <div className="regulatory-selector">
      <a href="#" onClick={(e) => {
          e.preventDefault();
          setViewMode('form');
        }}
        className="back-button"
      >
        Back to Form
      </a>
      <h2>Select Region</h2>
      <p>Choose a geographic region to browse available regulatory documents</p>
      
      <div className="region-grid">
        {Object.keys(regions).map(region => (
          <div 
            key={region}
            className="region-card"
            onClick={() => {
              setSelectedRegion(region);
              setViewMode('countries');
            }}
          >
            <h3>{region}</h3>
            <p>{regions[region].length} countries</p>
            <button className="view-button">
              View countries
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Render country selection view
  const renderCountrySelection = () => (
    <div className="regulatory-selector">
      <a 
        href="#" 
        onClick={(e) => {
          e.preventDefault();
          setViewMode('regions');
        }}
        className="back-button"
      >
        Back to Regions
      </a>
      <h2>{selectedRegion}</h2>
      <p>Select a country to view available regulatory documents</p>
      
      <div className="country-grid">
        {regions[selectedRegion].map(country => (
          <div 
            key={country}
            className="country-card"
            onClick={() => {
              setSelectedCountry(country);
              setViewMode('documents');
            }}
          >
            <h3>{country}</h3>
            {regulatoryData[country] && (
              <p>{regulatoryData[country].length} document types available</p>
            )}
            <button className="view-button">
              View documents
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Render document selection view
  const renderDocumentSelection = () => {
    const documents = getDocumentsForCountry();
    
    return (
      <div className="regulatory-selector">
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            setViewMode('countries');
          }}
          className="back-button"
        >
          Back to Countries
        </a>
        <h2>{selectedCountry}</h2>
        <p>Select documents to generate for {selectedCountry}</p>
        
        {documents.length > 0 ? (
          <>
            <div className="document-grid mt-lg">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  className={`document-card ${selectedDocuments.some(d => d.id === doc.id) ? 'selected' : ''}`}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="document-card-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.some(d => d.id === doc.id)}
                      onChange={() => {}}
                      className="form-checkbox h-5 w-5"
                    />
                  </div>
                  <div className="document-card-content">
                    <h4 className="document-card-title">{doc.name}</h4>
                    <p className="document-card-description">{doc.purpose}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={() => setViewMode('form')}
                className="reset-button"
              >
                Cancel
              </button>
              
              <button 
                onClick={applyDocumentSelections}
                disabled={selectedDocuments.length === 0}
                className={`generate-button ${selectedDocuments.length === 0 ? 'disabled' : ''}`}
              >
                Apply {selectedDocuments.length} Selected Document{selectedDocuments.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        ) : (
          <div className="info-box">
            <p>No specific regulatory documents found for {selectedCountry}.</p>
            <p className="mt-2">
              <button 
                onClick={() => {
                  setCountry(selectedCountry);
                  setViewMode('form');
                }}
                className="view-button"
              >
                Continue with {selectedCountry}
              </button>
              {' '}to create general regulatory documents.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Main view switcher
  switch (viewMode) {
    case 'regions':
      return renderRegionSelection();
    case 'countries':
      return renderCountrySelection();
    case 'documents':
      return renderDocumentSelection();
    case 'form':
    default:
      return renderForm();
  }
};

export default RegulatoryDocumentGenerator;