import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegulatoryDocuments = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
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

  // Go back to region selection
  const backToRegions = () => {
    setSelectedRegion(null);
    setSelectedCountry(null);
    setSelectedDocuments([]);
  };

  // Go back to country selection
  const backToCountries = () => {
    setSelectedCountry(null);
    setSelectedDocuments([]);
  };

  // Handle document selection
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

  // Continue to IND module generator
  const continueToGenerator = () => {
    navigate('/ind-modules', {
      state: {
        selectedCountry,
        selectedRegion,
        selectedDocuments
      }
    });
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

  // Render region selection view
  const renderRegionSelection = () => (
    <>
      <div className="flex items-center mb-4">
        <Link to="/" className="mr-4 flex items-center text-blue-600 hover:text-blue-800">
          <span className="mr-1">←</span> Back to Documents
        </Link>
        <h2 className="text-2xl font-bold">Global Regulatory Document Map</h2>
      </div>
      <p>Select a region or country to view and generate regulatory documents for drug approval</p>
      
      <h3 className="text-xl font-medium mt-8 mb-4">Select a Region</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(regions).map(region => (
          <div 
            key={region}
            className="p-4 rounded-lg cursor-pointer transition-all bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md"
            onClick={() => setSelectedRegion(region)}
          >
            <h4 className="text-lg font-medium mb-2">{region}</h4>
            <p className="text-sm text-gray-600">{regions[region].length} countries</p>
            <button className="mt-3 text-sm text-blue-600 hover:underline">
              View regulatory documents
            </button>
          </div>
        ))}
      </div>
    </>
  );

  // Render country selection view
  const renderCountrySelection = () => (
    <>
      <div className="flex items-center mb-4">
        <button 
          onClick={backToRegions}
          className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <span className="mr-1">←</span> Back to Regions
        </button>
        <h2 className="text-2xl font-bold">{selectedRegion}</h2>
      </div>
      <p>Select a country to view available regulatory documents</p>
      
      <h3 className="text-xl font-medium mt-8 mb-4">Countries in {selectedRegion}</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {regions[selectedRegion].map(country => (
          <div 
            key={country}
            className="p-4 rounded-lg cursor-pointer transition-all bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md"
            onClick={() => setSelectedCountry(country)}
          >
            <h4 className="text-lg font-medium">{country}</h4>
            {regulatoryData[country] && (
              <p className="mt-2 text-sm text-gray-600">{regulatoryData[country].length} document types available</p>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // Render document selection view
  const renderDocumentSelection = () => {
    const documents = getDocumentsForCountry();
    
    return (
      <>
        <div className="flex items-center mb-4">
          <button 
            onClick={backToCountries}
            className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <span className="mr-1">←</span> Back to Countries
          </button>
          <h2 className="text-2xl font-bold">{selectedCountry}</h2>
        </div>
        <p>Select documents to generate for {selectedCountry}</p>
        
        {documents.length > 0 ? (
          <>
            <h3 className="text-xl font-medium mt-8 mb-4">Available Document Types</h3>
            
            <div className="grid grid-cols-1 gap-3">
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
                onClick={backToRegions}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              
              <button 
                onClick={continueToGenerator}
                disabled={selectedDocuments.length === 0}
                className={`
                  px-4 py-2 rounded-md text-white
                  ${selectedDocuments.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'}
                `}
              >
                Continue with {selectedDocuments.length} Document{selectedDocuments.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        ) : (
          <div className="mt-8 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <p className="text-yellow-800">No specific regulatory documents found for {selectedCountry}.</p>
            <p className="mt-2">
              <button 
                onClick={() => navigate('/ind-modules')}
                className="text-blue-600 hover:underline"
              >
                Continue to IND Module Generator
              </button>
              {' '}to create general regulatory documents.
            </p>
          </div>
        )}
      </>
    );
  };
  
  // Main render
  return (
    <div className="regulatory-documents max-w-4xl mx-auto py-8 px-4">
      {!selectedRegion && renderRegionSelection()}
      {selectedRegion && !selectedCountry && renderCountrySelection()}
      {selectedRegion && selectedCountry && renderDocumentSelection()}
    </div>
  );
};

export default RegulatoryDocuments;