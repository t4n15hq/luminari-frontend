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
  const navigate = useNavigate();
  
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

  // Main form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiService.generateIndModule({
        disease_name: disease.trim(),
        additional_parameters: {
          drug_class: drugClass.trim() || undefined,
          mechanism: mechanism.trim() || undefined,
          country: country || undefined,
          document_type: documentType || undefined
        }
      });
      setResult(response);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to generate regulatory documents. Please try again.');
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

  // Render the form view
  const renderForm = () => (
    <div className="ind-module-generator">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Regulatory Document Generator</h2>
          <p className="text-gray-600">Generate regulatory documentation for drug development and approval</p>
        </div>
        
        <button 
          onClick={() => setViewMode('regions')}
          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
        >
          Select Country/Region
        </button>
      </div>

      {/* Show country and document type if they were preselected */}
      {(country || documentType) && (
        <div className="selected-params p-4 mb-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium mb-2">Selected Parameters</h3>
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

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="disease">Disease/Condition <span className="required">*</span></label>
          <input
            id="disease"
            type="text"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            placeholder="e.g., Psoriasis, Eczema, Atopic Dermatitis"
            required
            maxLength="100"
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
              maxLength="50"
            />
            <div className="form-hint">
              Use the "Select Country/Region" button above to browse available regulatory documents by geography
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
            maxLength="100"
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
            maxLength="100"
          />
        </div>

        <div className="button-group">
          <button type="submit" disabled={loading || !disease}>
            {loading ? 'Generating...' : `Generate ${documentType || 'Regulatory Documents'}`}
          </button>
          <button type="button" onClick={resetForm}>
            Reset Form
          </button>
        </div>
      </form>

      {error && <div className="error-message" aria-live="polite">{error}</div>}

      {loading && <div className="loader">⏳ Generating regulatory documentation...</div>}

      {result && (
        <div className="result-container" aria-live="polite">
          <div className="tabs">
            <button
              className={activeTab === 'cmc' ? 'active' : ''}
              onClick={() => setActiveTab('cmc')}
            >
              CMC Section
            </button>
            <button
              className={activeTab === 'clinical' ? 'active' : ''}
              onClick={() => setActiveTab('clinical')}
            >
              Clinical Section
            </button>
          </div>

          {activeTab === 'cmc' && (
            <div className="module-content">
              <h3>Chemistry, Manufacturing, and Controls (CMC)</h3>
              <div className="content-area">
                {(result?.cmc_section || '').split('\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'clinical' && (
            <div className="module-content">
              <h3>Clinical Pharmacology Section</h3>
              <div className="content-area">
                {(result?.clinical_section || '').split('\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={() => {
                const content = activeTab === 'cmc'
                  ? result.cmc_section
                  : result.clinical_section;
                navigator.clipboard.writeText(content);
                alert('✅ Current section copied!');
              }}
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
    <div className="ind-module-generator">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => setViewMode('form')}
          className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <span className="mr-1">←</span> Back to Form
        </button>
        <h2 className="text-2xl font-bold">Select Region</h2>
      </div>
      <p>Choose a geographic region to browse available regulatory documents</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Object.keys(regions).map(region => (
          <div 
            key={region}
            className="p-4 rounded-lg cursor-pointer transition-all bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md"
            onClick={() => {
              setSelectedRegion(region);
              setViewMode('countries');
            }}
          >
            <h4 className="text-lg font-medium mb-2">{region}</h4>
            <p className="text-sm text-gray-600">{regions[region].length} countries</p>
            <button className="mt-3 text-sm text-blue-600 hover:underline">
              View countries
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Render country selection view
  const renderCountrySelection = () => (
    <div className="ind-module-generator">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => setViewMode('regions')}
          className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <span className="mr-1">←</span> Back to Regions
        </button>
        <h2 className="text-2xl font-bold">{selectedRegion}</h2>
      </div>
      <p>Select a country to view available regulatory documents</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {regions[selectedRegion].map(country => (
          <div 
            key={country}
            className="p-4 rounded-lg cursor-pointer transition-all bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md"
            onClick={() => {
              setSelectedCountry(country);
              setViewMode('documents');
            }}
          >
            <h4 className="text-lg font-medium">{country}</h4>
            {regulatoryData[country] && (
              <p className="mt-2 text-sm text-gray-600">{regulatoryData[country].length} document types available</p>
            )}
            <button className="mt-3 text-sm text-blue-600 hover:underline">
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
      <div className="ind-module-generator">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => setViewMode('countries')}
            className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <span className="mr-1">←</span> Back to Countries
          </button>
          <h2 className="text-2xl font-bold">{selectedCountry}</h2>
        </div>
        <p>Select documents to generate for {selectedCountry}</p>
        
        {documents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 mt-6">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all
                    ${selectedDocuments.some(d => d.id === doc.id) 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:border-blue-500'}
                  `}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.some(d => d.id === doc.id)}
                      onChange={() => {}}
                      className="mt-1 mr-3 h-4 w-4"
                    />
                    <div>
                      <h4 className="text-lg font-medium">{doc.name}</h4>
                      <p className="mt-1 text-sm text-gray-600">{doc.purpose}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
              <button 
                onClick={() => setViewMode('form')}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              
              <button 
                onClick={applyDocumentSelections}
                disabled={selectedDocuments.length === 0}
                className={`
                  px-4 py-2 rounded-md text-white
                  ${selectedDocuments.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'}
                `}
              >
                Apply {selectedDocuments.length} Selected Document{selectedDocuments.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-8 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <p className="text-yellow-800">No specific regulatory documents found for {selectedCountry}.</p>
            <p className="mt-2">
              <button 
                onClick={() => {
                  setCountry(selectedCountry);
                  setViewMode('form');
                }}
                className="text-blue-600 hover:underline"
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