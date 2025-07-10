// src/components/BatchRegulatoryGenerator.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const BatchRegulatoryGenerator = () => {
  const navigate = useNavigate();
  
  // Form data state
  const [formData, setFormData] = useState({
    disease_name: '',
    drug_class: '',
    mechanism: '',
    trial_phase: '',
    trial_type: '',
    blinding: '',
    randomization: '',
    min_age: '',
    max_age: '',
    gender: '',
    target_sample_size: '',
    inclusion_criteria: '',
    exclusion_criteria: '',
    drug_formulation: '',
    route_of_administration: '',
    dosing_regimen: '',
    control_group: '',
    primary_endpoints: '',
    secondary_endpoints: '',
    outcome_measure_tool: '',
    statistical_power: '80',
    significance_level: '0.05'
  });

  // Selected documents for batch processing
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  
  // Batch processing state
  const [batchQueue, setBatchQueue] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [currentProcessing, setCurrentProcessing] = useState(null);
  const [completedDocuments, setCompletedDocuments] = useState([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchError, setBatchError] = useState('');

  // Available regulatory documents by region
  const documentLibrary = {
    'North America': [
      { id: 'us_ind', name: 'IND (Investigational New Drug)', country: 'United States', description: 'US FDA clinical trial authorization' },
      { id: 'us_nda', name: 'NDA (New Drug Application)', country: 'United States', description: 'US FDA marketing authorization' },
      { id: 'us_bla', name: 'BLA (Biologics License Application)', country: 'United States', description: 'US FDA biologics authorization' },
      { id: 'ca_cta', name: 'Clinical Trial Application (Health Canada)', country: 'Canada', description: 'Canadian clinical trial authorization' },
      { id: 'ca_nds', name: 'New Drug Submission (NDS)', country: 'Canada', description: 'Canadian marketing authorization' },
      { id: 'mx_cofepris_cta', name: 'COFEPRIS Clinical Trial Authorization', country: 'Mexico', description: 'Mexican clinical trial approval' }
    ],
    'Europe': [
      { id: 'eu_cta', name: 'CTA (Clinical Trial Application)', country: 'European Union', description: 'EU clinical trial authorization via CTIS' },
      { id: 'eu_maa', name: 'MAA (Marketing Authorization Application)', country: 'European Union', description: 'EU marketing authorization' },
      { id: 'eu_impd', name: 'IMPD (Investigational Medicinal Product Dossier)', country: 'European Union', description: 'EU product dossier' },
      { id: 'uk_cta', name: 'Clinical Trial Authorisation (UK)', country: 'United Kingdom', description: 'MHRA clinical trial authorization' },
      { id: 'uk_ma', name: 'Marketing Authorisation (UK)', country: 'United Kingdom', description: 'MHRA marketing authorization' },
      { id: 'ch_cta', name: 'Clinical Trial Authorisation (Swissmedic)', country: 'Switzerland', description: 'Swiss clinical trial authorization' },
      { id: 'ru_cta', name: 'Clinical Trial Permit (Roszdravnadzor)', country: 'Russia', description: 'Russian clinical trial authorization' }
    ],
    'Asia Pacific': [
      { id: 'jp_ctn', name: 'Clinical Trial Notification (CTN)', country: 'Japan', description: 'PMDA clinical trial notification' },
      { id: 'jp_nda', name: 'J-NDA (New Drug Application)', country: 'Japan', description: 'Japanese marketing authorization' },
      { id: 'cn_ind', name: 'IND (China)', country: 'China', description: 'NMPA clinical trial authorization' },
      { id: 'cn_nda', name: 'NDA (China)', country: 'China', description: 'Chinese marketing authorization' },
      { id: 'kr_ind', name: 'IND (Korea)', country: 'South Korea', description: 'MFDS clinical trial authorization' },
      { id: 'au_ctn', name: 'CTN (Clinical Trial Notification)', country: 'Australia', description: 'TGA clinical trial notification' },
      { id: 'sg_ctc', name: 'Clinical Trial Certificate (HSA)', country: 'Singapore', description: 'Singapore clinical trial authorization' },
      { id: 'in_cta', name: 'Clinical Trial Permission (CDSCO)', country: 'India', description: 'Indian clinical trial authorization' }
    ],
    'Latin America': [
      { id: 'br_anvisa_cta', name: 'ANVISA Clinical Trial Authorization', country: 'Brazil', description: 'Brazilian clinical trial authorization' },
      { id: 'br_anvisa_nda', name: 'ANVISA Registration Dossier', country: 'Brazil', description: 'Brazilian marketing authorization' },
      { id: 'ar_anmat_cta', name: 'ANMAT Clinical Trial Authorization', country: 'Argentina', description: 'Argentine clinical trial authorization' },
      { id: 'co_invima_cta', name: 'INVIMA Clinical Trial Permit', country: 'Colombia', description: 'Colombian clinical trial authorization' }
    ],
    'Africa & Middle East': [
      { id: 'za_sahpra_cta', name: 'SAHPRA Clinical Trial Authorization', country: 'South Africa', description: 'South African clinical trial authorization' },
      { id: 'il_cta', name: 'Israeli MOH Clinical Trial Permit', country: 'Israel', description: 'Israeli clinical trial authorization' },
      { id: 'sa_sfda_cta', name: 'SFDA Clinical Trial Authorization', country: 'Saudi Arabia', description: 'Saudi clinical trial authorization' },
      { id: 'ae_dha_cta', name: 'DHA Clinical Trial Permit', country: 'United Arab Emirates', description: 'UAE clinical trial authorization' }
    ]
  };

  // Load disease from localStorage
  useEffect(() => {
    const detectedDisease = localStorage.getItem('detectedDisease');
    if (detectedDisease) {
      setFormData(prev => ({ ...prev, disease_name: detectedDisease }));
    }
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle document selection
  const handleDocumentSelect = (document, isSelected) => {
    if (isSelected) {
      setSelectedDocuments(prev => [...prev, document]);
    } else {
      setSelectedDocuments(prev => prev.filter(doc => doc.id !== document.id));
    }
  };

  // Select all documents in a region
  const handleSelectRegion = (region) => {
    const regionDocs = documentLibrary[region];
    const newSelections = regionDocs.filter(doc => 
      !selectedDocuments.some(selected => selected.id === doc.id)
    );
    setSelectedDocuments(prev => [...prev, ...newSelections]);
  };

  // Clear all selections
  const handleClearSelections = () => {
    setSelectedDocuments([]);
  };

  // FIXED: Generate document using existing API routing
  const generateDocumentForCountry = async (document, formData) => {
    // Prepare API data using the existing routing system
    const apiData = {
      disease_name: formData.disease_name,
      additional_parameters: {
        ...formData,
        country: document.country,
        document_type: document.name
      }
    };

    console.log(`Generating ${document.name} for ${document.country}`, apiData);

    // Use the existing generateIndModule function which handles all routing
    return await apiService.generateIndModule(apiData);
  };

  // Start batch processing
  const startBatchProcessing = async () => {
    if (selectedDocuments.length === 0) {
      alert('Please select at least one document to generate.');
      return;
    }

    if (!formData.disease_name.trim()) {
      alert('Please enter a disease/condition.');
      return;
    }

    setProcessingStatus('processing');
    setBatchProgress(0);
    setBatchError('');
    setCompletedDocuments([]);

    // Create batch queue
    const queue = selectedDocuments.map(doc => ({
      ...doc,
      status: 'pending',
      result: null,
      error: null,
      startTime: null,
      endTime: null
    }));

    setBatchQueue(queue);

    // Process documents sequentially with delay to avoid overwhelming the API
    for (let i = 0; i < queue.length; i++) {
      const document = queue[i];
      setCurrentProcessing(document);

      try {
        // Update status to processing
        setBatchQueue(prev => prev.map((item, index) => 
          index === i ? { ...item, status: 'processing', startTime: new Date() } : item
        ));

        // Call the unified document generation function
        const result = await generateDocumentForCountry(document, formData);

        // Update status to completed
        setBatchQueue(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            status: 'completed', 
            result: result,
            endTime: new Date()
          } : item
        ));

        setCompletedDocuments(prev => [...prev, { ...document, result }]);

      } catch (error) {
        console.error(`Error generating ${document.name}:`, error);
        
        // Update status to error
        setBatchQueue(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            status: 'error', 
            error: error.message,
            endTime: new Date()
          } : item
        ));
      }

      // Update progress
      setBatchProgress(((i + 1) / queue.length) * 100);

      // Add delay between requests to avoid overwhelming the API
      if (i < queue.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setProcessingStatus('completed');
    setCurrentProcessing(null);
  };

  // Download individual document - FIXED VERSION
  const downloadDocument = (document) => {
    if (!document.result) {
      alert('No document content available to download.');
      return;
    }

    try {
      let content = '';
      let filename = `${document.name.replace(/[^a-zA-Z0-9\s]/g, '_')}_${formData.disease_name.replace(/[^a-zA-Z0-9\s]/g, '_')}.txt`;

      // Handle different result formats
      if (document.result.document_content) {
        content = document.result.document_content;
      } else if (document.result.cmc_section && document.result.clinical_section) {
        content = `CMC SECTION:\n\n${document.result.cmc_section}\n\nCLINICAL SECTION:\n\n${document.result.clinical_section}`;
      } else if (document.result.cmc_section) {
        content = `CMC SECTION:\n\n${document.result.cmc_section}`;
      } else if (document.result.clinical_section) {
        content = `CLINICAL SECTION:\n\n${document.result.clinical_section}`;
      } else {
        content = JSON.stringify(document.result, null, 2);
      }

      // Ensure content is not empty
      if (!content || content.trim() === '') {
        alert('Document content is empty. Cannot download.');
        return;
      }

      // Create download using data URL (most compatible approach)
      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
      const downloadAnchorNode = window.document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      downloadAnchorNode.style.display = "none";
      
      window.document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      window.document.body.removeChild(downloadAnchorNode);
      
      console.log(`Successfully downloaded: ${filename}`);
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message}`);
    }
  };

  // Download all completed documents - FIXED VERSION
  const downloadAllDocuments = async () => {
    const completedDocs = batchQueue.filter(doc => doc.status === 'completed' && doc.result);
    
    if (completedDocs.length === 0) {
      alert('No completed documents to download.');
      return;
    }

    try {
      console.log(`Starting download of ${completedDocs.length} documents...`);
      
      // Download each document separately with a small delay
      for (let i = 0; i < completedDocs.length; i++) {
        const doc = completedDocs[i];
        console.log(`Downloading document ${i + 1}/${completedDocs.length}: ${doc.name}`);
        
        downloadDocument(doc);
        
        // Small delay between downloads to prevent browser issues
        if (i < completedDocs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      alert(`Successfully initiated download of ${completedDocs.length} documents.`);
      
    } catch (error) {
      console.error('Batch download error:', error);
      alert(`Batch download failed: ${error.message}`);
    }
  };

  // Reset batch processing
  const resetBatch = () => {
    setBatchQueue([]);
    setProcessingStatus('idle');
    setCurrentProcessing(null);
    setCompletedDocuments([]);
    setBatchProgress(0);
    setBatchError('');
  };

  // Estimate processing time
  const getEstimatedTime = () => {
    const avgTimePerDoc = 30; // seconds
    const totalTime = selectedDocuments.length * avgTimePerDoc;
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="batch-regulatory-generator" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
          Batch Regulatory Document Generator
        </h1>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
          Generate multiple regulatory documents simultaneously for global submission
        </p>
        <button
          onClick={() => navigate('/regulatory-documents')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back to Single Document Generator
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Panel: Form and Document Selection */}
        <div>
          {/* Basic Information Form */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              Basic Information
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                Disease/Condition *
              </label>
              <input
                type="text"
                value={formData.disease_name}
                onChange={(e) => handleInputChange('disease_name', e.target.value)}
                placeholder="e.g., Psoriasis, Atopic Dermatitis"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Drug Class
                </label>
                <input
                  type="text"
                  value={formData.drug_class}
                  onChange={(e) => handleInputChange('drug_class', e.target.value)}
                  placeholder="e.g., Small molecule"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Trial Phase
                </label>
                <select
                  value={formData.trial_phase}
                  onChange={(e) => handleInputChange('trial_phase', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">Select Phase</option>
                  <option value="Phase I">Phase I</option>
                  <option value="Phase II">Phase II</option>
                  <option value="Phase III">Phase III</option>
                  <option value="Phase IV">Phase IV</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document Selection */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>
                Select Documents ({selectedDocuments.length} selected)
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleClearSelections}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            {Object.entries(documentLibrary).map(([region, documents]) => (
              <div key={region} style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    margin: 0,
                    color: '#374151'
                  }}>
                    {region}
                  </h3>
                  <button
                    onClick={() => handleSelectRegion(region)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Select All
                  </button>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gap: '0.5rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  {documents.map((doc) => {
                    const isSelected = selectedDocuments.some(selected => selected.id === doc.id);
                    return (
                      <label
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          backgroundColor: isSelected ? '#dbeafe' : 'white',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleDocumentSelect(doc, e.target.checked)}
                          style={{ marginRight: '0.75rem' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            {doc.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {doc.country} • {doc.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Batch Processing */}
        <div>
          {/* Processing Controls */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              Batch Processing
            </h2>

            {selectedDocuments.length > 0 && (
              <div style={{ 
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#0c4a6e' }}>
                  <strong>Selected:</strong> {selectedDocuments.length} documents<br />
                  <strong>Estimated time:</strong> {getEstimatedTime()}<br />
                  <strong>Countries:</strong> {[...new Set(selectedDocuments.map(doc => doc.country))].join(', ')}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={startBatchProcessing}
                disabled={processingStatus === 'processing' || selectedDocuments.length === 0 || !formData.disease_name.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: processingStatus === 'processing' || selectedDocuments.length === 0 || !formData.disease_name.trim() 
                    ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: processingStatus === 'processing' || selectedDocuments.length === 0 || !formData.disease_name.trim() 
                    ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                {processingStatus === 'processing' ? 'Processing...' : `Generate ${selectedDocuments.length} Documents`}
              </button>

              {(processingStatus === 'completed' || batchQueue.length > 0) && (
                <button
                  onClick={resetBatch}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {processingStatus === 'processing' && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div 
                    style={{ 
                      width: `${batchProgress}%`, 
                      height: '20px', 
                      backgroundColor: '#3b82f6', 
                      transition: 'width 0.3s ease' 
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                  {batchProgress.toFixed(0)}% Complete
                  {currentProcessing && (
                    <span> • Processing: {currentProcessing.name}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          {batchQueue.length > 0 && (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>
                  Processing Results
                </h2>
                {completedDocuments.length > 0 && (
                  <button
                    onClick={downloadAllDocuments}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Download All ({completedDocuments.length})
                  </button>
                )}
              </div>

              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}>
                {batchQueue.map((doc, index) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '1rem',
                      borderBottom: index < batchQueue.length - 1 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: doc.status === 'processing' ? '#fef3c7' : 
                                    doc.status === 'completed' ? '#f0fdf4' : 
                                    doc.status === 'error' ? '#fef2f2' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#1f2937' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {doc.country}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: doc.status === 'pending' ? '#f3f4f6' :
                                         doc.status === 'processing' ? '#fbbf24' :
                                         doc.status === 'completed' ? '#10b981' :
                                         doc.status === 'error' ? '#ef4444' : '#9ca3af',
                          color: doc.status === 'pending' ? '#374151' : 'white'
                        }}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                        
                        {doc.status === 'completed' && (
                          <button
                            onClick={() => downloadDocument(doc)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            📥 Download
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {doc.error && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#dc2626'
                      }}>
                        Error: {doc.error}
                      </div>
                    )}
                    
                    {doc.endTime && doc.startTime && (
                      <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        Processing time: {Math.round((doc.endTime - doc.startTime) / 1000)}s
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Statistics */}
              {processingStatus === 'completed' && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                      {batchQueue.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                      {batchQueue.filter(doc => doc.status === 'completed').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Completed</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                      {batchQueue.filter(doc => doc.status === 'error').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Failed</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                      {batchQueue.filter(doc => doc.endTime && doc.startTime)
                        .reduce((sum, doc) => sum + Math.round((doc.endTime - doc.startTime) / 1000), 0)}s
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Time</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchRegulatoryGenerator;