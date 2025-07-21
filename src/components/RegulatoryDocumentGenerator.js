// src/components/RegulatoryDocumentGenerator.js
// Main Document Generation Form and Logic

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { saveDocument, fetchDocuments } from '../services/api'; // <-- update import
import { useBackgroundJobs } from '../hooks/useBackgroundJobs'; // NEW IMPORT
import jsPDF from 'jspdf';
import DocumentViewer from './common/DocumentViewer';

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
  
  // Background processing
  const { startJob, getJob } = useBackgroundJobs('regulatory_document');
  const [backgroundJobId, setBackgroundJobId] = useState(null);
  
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

  // Load parameters from navigation state
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
    
    // Removed auto-population from localStorage
  }, [location.state, disease]);

  // Navigate back to map selection
  const handleBackToMap = () => {
    navigate('/regulatory-documents');
  };
  
  // Main form submit handler - UPDATED FOR BACKGROUND PROCESSING
  const handleSubmit = async () => {
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
      
      if (!disease || disease.trim() === '') {
        throw new Error('Disease/Condition is required');
      }

      // Start background job instead of blocking UI
      const jobId = startJob('regulatory_document', enhancedFormData, apiService.generateIndModule);
      setBackgroundJobId(jobId);
      
      // Show loading state
      setLoading(true);
      
      // Monitor job progress
      const checkJobStatus = () => {
        const job = getJob(jobId);
        if (job) {
          if (job.status === 'completed') {
            setLoading(false);
            setBackgroundJobId(null);
            
            // Process the result
            const response = job.result;
            
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
                cmcSection = content.substring(0, dividerIndex).trim();
                clinicalSection = content.substring(dividerIndex).trim();
              } else {
                // If no clear divider, split roughly in half
                const midPoint = Math.floor(content.length / 2);
                cmcSection = content.substring(0, midPoint).trim();
                clinicalSection = content.substring(midPoint).trim();
              }
              
              setResult({
                cmc_section: cmcSection,
                clinical_section: clinicalSection,
                document_content: content
              });
              // Save regulatory document to backend
              saveDocument({
                type: 'REGULATORY',
                title: `${documentType} for ${disease}`,
                disease,
                country,
                documentType,
                cmcSection: cmcSection,
                clinicalSection: clinicalSection,
                content,
                // add more fields as needed
              });
            } else if (response.cmc_section && response.clinical_section) {
              // For document types that return separate CMC and clinical sections
              setResult(response);
              // Save regulatory document to backend
              saveDocument({
                type: 'REGULATORY',
                title: `${documentType} for ${disease}`,
                disease,
                country,
                documentType,
                cmcSection: response.cmc_section,
                clinicalSection: response.clinical_section,
                content: response.document_content || `CMC SECTION:\n${response.cmc_section}\n\nCLINICAL SECTION:\n${response.clinical_section}`,
                // add more fields as needed
              });
            } else {
              // Fallback: treat the entire response as clinical section
              setResult({
                cmc_section: "",
                clinical_section: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
                document_content: typeof response === 'string' ? response : JSON.stringify(response, null, 2)
              });
              // Save regulatory document to backend
              saveDocument({
                type: 'REGULATORY',
                title: `${documentType} for ${disease}`,
                disease,
                country,
                documentType,
                cmcSection: "",
                clinicalSection: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
                content: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
                // add more fields as needed
              });
            }
            
            // Automatically scroll to results
            setTimeout(() => {
              document.querySelector('.result-container')?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
              });
            }, 100);
            
          } else if (job.status === 'error') {
            setLoading(false);
            setBackgroundJobId(null);
            setError(`Failed to generate regulatory documents: ${job.error || 'Unknown error'}`);
          } else {
            // Job still running, check again in 1 second
            setTimeout(checkJobStatus, 1000);
          }
        } else {
          // Job not found, check again in 1 second
          setTimeout(checkJobStatus, 1000);
        }
      };
      
      // Start monitoring
      checkJobStatus();
      
    } catch (err) {
      setError(`Failed to generate regulatory documents: ${err.message || 'Unknown error'}`);
      setLoading(false);
      setBackgroundJobId(null);
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

  const [showPreviousDocs, setShowPreviousDocs] = useState(false);
  const [previousDocs, setPreviousDocs] = useState([]);
  const [loadingPreviousDocs, setLoadingPreviousDocs] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [docsPerPage] = useState(5);
  const [fetchError, setFetchError] = useState('');

  const handleShowPreviousDocs = async () => {
    setShowPreviousDocs(!showPreviousDocs);
    if (!showPreviousDocs && previousDocs.length === 0) {
      setLoadingPreviousDocs(true);
      setFetchError('');
      try {
        const docs = await fetchDocuments();
        setPreviousDocs(docs.filter(doc => doc.type === 'REGULATORY'));
      } catch (err) {
        setPreviousDocs([]);
        setFetchError('Error fetching previous regulatory documents. Please try again later.');
      } finally {
        setLoadingPreviousDocs(false);
      }
    }
  };

  return (
    <div className="regulatory-document-generator">
      {/* Header with Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Enhanced Regulatory Document Generator</h2>
          <p>Generate comprehensive regulatory documentation with detailed trial design parameters</p>
        </div>
        <button onClick={handleShowPreviousDocs} className="btn btn-outline">
          {showPreviousDocs ? 'Hide Previous Docs' : 'Previous Docs'}
        </button>
      </div>
      {showPreviousDocs && (
        <div style={{ background: '#f7fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Previous Regulatory Documents</h4>
          <input
            type="text"
            className="form-input"
            placeholder="Search by title, disease, or country..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ marginBottom: '0.75rem' }}
          />
          {loadingPreviousDocs ? <p>Loading...</p> : fetchError ? <p style={{ color: 'red' }}>{fetchError}</p> : (
            (() => {
              const filtered = previousDocs.filter(doc =>
                doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.disease?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.country?.toLowerCase().includes(searchTerm.toLowerCase())
              );
              const totalPages = Math.ceil(filtered.length / docsPerPage);
              const startIdx = (currentPage - 1) * docsPerPage;
              const paginated = filtered.slice(startIdx, startIdx + docsPerPage);
              return filtered.length === 0 ? <p>No previous regulatory documents found.</p> : (
                <>
                  <ul style={{ maxHeight: '200px', overflowY: 'auto', margin: 0, padding: 0 }}>
                    {paginated.map(doc => (
                      <li key={doc.id} style={{ marginBottom: '0.5rem', listStyle: 'none', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                        <strong>{doc.title}</strong> <span style={{ color: '#64748b', fontSize: '0.9em' }}>{doc.disease} {doc.country && `| ${doc.country}`}</span>
                        <button style={{ marginLeft: '1rem', padding: '2px 8px', borderRadius: '4px', background: '#64748b', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85em' }} onClick={() => { setViewerDoc(doc); setViewerOpen(true); }}>
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ marginRight: 8, padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#e2e8f0' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                    <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ marginLeft: 8, padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#e2e8f0' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
                  </div>
                </>
              );
            })()
          )}
          <DocumentViewer open={viewerOpen} onClose={() => setViewerOpen(false)} title={viewerDoc?.title} content={viewerDoc?.content} metadata={{ disease: viewerDoc?.disease, country: viewerDoc?.country, documentType: viewerDoc?.documentType }} />
        </div>
      )}

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
              <label htmlFor="disease" className="form-label">Disease/Condition <span className="required">*</span></label>
              <input
                id="disease"
                type="text"
                className="form-input"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                placeholder="e.g., Psoriasis, Eczema, Atopic Dermatitis"
                required
              />
            </div>

            {/* Document Type Selection */}
            {selectedCountryData && (
              <div className="form-group">
                <label htmlFor="documentType" className="form-label">Document Type <span className="required">*</span></label>
                <select
                  id="documentType"
                  className="form-select"
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
                <div className="form-help">
                  {selectedCountryData.availableDocuments.find(doc => doc.name === documentType)?.purpose}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="drug-class" className="form-label">Drug Class</label>
              <input
                id="drug-class"
                type="text"
                className="form-input"
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
            className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
          >
            {loading ? 'Generating...' : `Generate Enhanced ${documentType || 'Regulatory Documents'}`}
          </button>
          <button 
            type="button" 
            onClick={resetForm}
            className="btn btn-secondary"
          >
            Reset Form
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" aria-live="polite">{error}</div>}

      {loading && <div className="loading-indicator">
        <div className="loading-spinner"></div>
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
                alert('Current section copied!');
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
                alert('All sections copied!');
              }}
              className="view-button"
            >
              Copy All
            </button>
            <button
              onClick={() => {
                const content = `CMC SECTION:\n\n${result.cmc_section}\n\nCLINICAL SECTION:\n\n${result.clinical_section}`;
                const doc = new jsPDF();
                doc.setFont('helvetica');
                doc.setFontSize(12);
                const lines = doc.splitTextToSize(content, 180);
                doc.text(lines, 10, 10);
                doc.save(`Enhanced_${country || 'Regulatory'}_Document_${new Date().toISOString().slice(0, 10)}.pdf`);
              }}
              className="view-button"
            >
              Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegulatoryDocumentGenerator;