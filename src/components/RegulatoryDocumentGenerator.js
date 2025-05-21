import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const RegulatoryDocumentGenerator = () => {
  // Original IND Module Generator state
  const [disease, setDisease] = useState('');
  const [drugClass, setDrugClass] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [country, setCountry] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('cmc');
  
  // Regulatory documents integration
  const [viewMode, setViewMode] = useState('form'); // 'form', 'regions', 'countries', 'documents'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  
  // For navigation
  const location = useLocation();
  //const navigate = useNavigate();
  
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

  // Main form submit handler - IMPROVED VERSION
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Log parameters for debugging
      console.log("Starting document generation with parameters:", {
        disease: disease,
        drugClass: drugClass,
        mechanism: mechanism,
        country: country,
        documentType: documentType
      });
      
      if (!disease || disease.trim() === '') {
        throw new Error('Disease/Condition is required');
      }

      // Call the API with the correct parameters
      const response = await apiService.generateIndModule({
        disease_name: disease.trim(),
        additional_parameters: {
          drug_class: drugClass.trim() || undefined,
          mechanism: mechanism.trim() || undefined,
          country: country || undefined,
          document_type: documentType || undefined
        }
      });
      
      console.log("API response received, response keys:", Object.keys(response));
      
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
      console.error("Document generation error:", err);
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

  // Render the form view
  const renderForm = () => (
    <div className="regulatory-selector">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2>Regulatory Document Generator</h2>
          <p>Generate regulatory documentation for drug development and approval</p>
        </div>
        
        <button 
          onClick={() => setViewMode('regions')}
          className="view-button"
        >
          Select Document by Region/Country
        </button>
      </div>

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
          <label htmlFor="drug-class">Drug Class (Optional)</label>
          <input
            id="drug-class"
            type="text"
            value={drugClass}
            onChange={(e) => setDrugClass(e.target.value)}
            placeholder="e.g., Corticosteroid, Biologics, Small molecule"
          />
        </div>

        <div className="form-group">
          <label htmlFor="mechanism">Mechanism of Action (Optional)</label>
          <input
            id="mechanism"
            type="text"
            value={mechanism}
            onChange={(e) => setMechanism(e.target.value)}
            placeholder="e.g., PDE4 inhibition, JAK-STAT pathway"
          />
        </div>

        <div className="action-buttons">
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading || !disease}
            className="generate-button"
          >
            {loading ? 'Generating...' : `Generate ${documentType || 'Regulatory Documents'}`}
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
        <p>Generating regulatory documentation...</p>
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
                a.download = `${country || 'Regulatory'}_Document_${new Date().toISOString().slice(0, 10)}.txt`;
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