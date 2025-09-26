import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import apiService from '../services/api';

const ClinicalDossierCompiler = () => {
  const [selectedDossierType, setSelectedDossierType] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validatingDocuments, setValidatingDocuments] = useState(new Set());
  const [primaryIndication, setPrimaryIndication] = useState('');
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  const dossierTypes = [
    { 
      id: 'impd', 
      name: 'Investigational Medicinal Product Dossier (IMPD)',
      description: 'EU dossier containing quality, production, and control information',
      icon: '', // removed emoji
      color: '#4F46E5'
    },
    { 
      id: 'ind', 
      name: 'Investigational New Drug (IND) Application',
      description: 'US FDA submission for investigational new drug trials',
      icon: '', // removed emoji
      color: '#059669'
    },
    { 
      id: 'ctd', 
      name: 'Common Technical Document (CTD)',
      description: 'Standardized format for quality, safety, and efficacy information',
      icon: '', // removed emoji
      color: '#DC2626'
    },
    { 
      id: 'ectd', 
      name: 'Electronic Common Technical Document (eCTD)',
      description: 'Electronic version of CTD for digital submission',
      icon: '', // removed emoji
      color: '#7C3AED'
    }
  ];

  const documentCategories = [
    { id: 'protocol', name: 'Protocol', required: true, icon: '', maxFiles: 1 },                                                                              
    { id: 'ib', name: "Investigator's Brochure (IB)", required: true, icon: '', maxFiles: 1 },                                                                
    { id: 'quality', name: 'Quality Information', required: true, icon: '', maxFiles: 3 },                                                                     
    { id: 'nonclinical', name: 'Non-clinical Data', required: true, icon: '', maxFiles: 5 },                                                                  
    { id: 'clinical', name: 'Clinical Data', required: true, icon: '', maxFiles: 10 },                                                                        
    { id: 'application', name: 'Application Form', required: true, icon: '', maxFiles: 1 },                                                                   
    { id: 'other', name: 'Other Documents', required: false, icon: '', maxFiles: 5 }                                                                          
  ];

  // Country-specific regulatory requirements
  const countryRegulatoryData = {
    'US': {
      name: 'United States',
      regulator: 'FDA',
      submissionRoute: 'IND',
      documents: ['Protocol', 'IB', 'ICF', 'FDA Forms 1571/1572', 'CMC', 'Preclinical Data', 'IRB Approval', 'Financial Disclosures', 'Insurance']
    },
    'EU': {
      name: 'European Union',
      regulator: 'EMA/NCAS',
      submissionRoute: 'IMPD/CTA (CTD/eCTD)',
      documents: ['Protocol', 'IB', 'ICF (translated)', 'IMPD Modules (Quality/Nonclinical/Clinical)', 'GMP', 'EC Opinion', 'Insurance']
    },
    'JP': {
      name: 'Japan',
      regulator: 'PMDA/MHI',
      submissionRoute: 'CTN',
      documents: ['Protocol', 'IB', 'ICF (Japanese)', 'CTA Form', 'Preclinical', 'CMC', 'IRB Approval', 'HGRAC (if applicable)']
    },
    'CN': {
      name: 'China',
      regulator: 'NMPA',
      submissionRoute: 'IND',
      documents: ['Protocol', 'IB', 'ICF (Mandarin)', 'CTA Form', 'Preclinical', 'CMC', 'IRB Approval', 'HGRAC (if applicable)']
    },
    'IN': {
      name: 'India',
      regulator: 'CDSCO',
      submissionRoute: 'CTA/IND',
      documents: ['Protocol', 'IB', 'ICF (English + Local)', 'Form 44', 'Schedule Y', 'EC Approval', 'Insurance', 'PI CV']
    },
    'CA': {
      name: 'Canada',
      regulator: 'Health Canada',
      submissionRoute: 'CTA (CTD/eCTD)',
      documents: ['Protocol', 'IB', 'ICF (English/French)', 'CTA Form', 'Preclinical', 'CMC', 'REB Approval', 'Insurance']
    },
    'GB': {
      name: 'United Kingdom',
      regulator: 'MHRA',
      submissionRoute: 'CTA (CTD/eCTD)',
      documents: ['Protocol', 'IB', 'ICF', 'CTA Form', 'Preclinical', 'CMC', 'REC Approval', 'Insurance']
    },
    'CH': {
      name: 'Switzerland',
      regulator: 'Swissmedic',
      submissionRoute: 'CTA (CTD/eCTD)',
      documents: ['Protocol', 'IB', 'ICF (German/French/Italian)', 'CTA Form', 'Preclinical', 'CMC', 'EC Approval', 'Insurance']
    },
    'AU': {
      name: 'Australia',
      regulator: 'TGA',
      submissionRoute: 'CTN',
      documents: ['Protocol', 'IB', 'ICF', 'CTN Form', 'Preclinical', 'CMC', 'HREC Approval', 'Insurance']
    },
    'BR': {
      name: 'Brazil',
      regulator: 'ANVISA',
      submissionRoute: 'CTA (research protocol author)',
      documents: ['Protocol', 'IB', 'ICF (Portuguese)', 'CTA Form', 'Preclinical', 'CMC', 'CEP Approval', 'Insurance']
    },
    'MX': {
      name: 'Mexico',
      regulator: 'COFEPRIS',
      submissionRoute: 'CTA',
      documents: ['Clinical Study Protocol', "Investigator's Brochure (IB)", 'Informed Consent Form (ICF)', 'Ethics/IRB Approval', 'COFEPRIS Application (CTA)', 'Insurance/C']
    },
    'ZA': {
      name: 'South Africa',
      regulator: 'SAHPRA',
      submissionRoute: 'SAHPRA Clinical Trial Application',
      documents: ['Clinical Study Protocol', 'IB', 'ICF', 'EC/REC Approval', 'SAHPRA Forms', 'Import of IMP (if unregistered)', 'Safety Reporting Plan', 'Insurance']
    },
    'KE': {
      name: 'Kenya',
      regulator: 'PPB',
      submissionRoute: 'PPB Clinical Trial Application',
      documents: ['Clinical Study Protocol', 'IB', 'ICF', 'EC Approval', 'PPB Application', 'Investigator CVs', 'Insurance']
    },
    'NG': {
      name: 'Nigeria',
      regulator: 'NAFDAC',
      submissionRoute: 'NAFDAC Clinical Trial Application',
      documents: ['Clinical Study Protocol', 'IB', 'ICF', 'EC Approval', 'NAFDAC CTA Forms & Fees', 'GCP Certificates', 'Insurance']
    },
    'IL': {
      name: 'Israel',
      regulator: 'Ministry of Health',
      submissionRoute: 'MoH Clinical Trials Dept approval',
      documents: ['Clinical Study Protocol', "Investigator's Brochure", 'IMPD/Quality Info (if applicable)', 'ICF', 'EC/IRB Approval', 'MoH Application Forms']
    },
    'SG': {
      name: 'Singapore',
      regulator: 'HSA',
      submissionRoute: 'CTA/CTN/CTC (risk-based) + IRE',
      documents: ['Clinical Study Protocol', 'IB', 'ICF', 'IRB Approval', 'CTA/CTN/CTC Application', 'IMP/CMC Info', 'Safety Reporting Plan']
    },
    'MY': {
      name: 'Malaysia',
      regulator: 'NPRA',
      submissionRoute: 'CTIL/CTX (for unregistered IMP)',
      documents: ['Clinical Study Protocol', 'IB', 'ICF', 'EC Approval', 'CTIL/CTX Application', 'IMP/CMC Info', 'Insurance']
    },
    'PH': {
      name: 'Philippines',
      regulator: 'FDA (CDRR)',
      submissionRoute: 'FDA Authorization (per Circular)',
      documents: ['Clinical Study Protocol', 'IB', 'ICF', 'ERC Approval', 'FDA Application', 'IMP Import Permit', 'Safety Reporting Plan']
    },
    'ID': {
      name: 'Indonesia',
      regulator: 'BPOM',
      submissionRoute: 'BPOM approval (per BPOM 8/)',
      documents: ['Clinical Study Protocol', 'IB', 'ICF', 'IRB Approval', 'BPOM Application', 'IMP/CMC Info', 'Trial Registration (INA-CRR)']
    }
  };

  // Extract text from file for validation
  const extractTextFromFile = async (file) => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll use a simplified approach
        // In production, you'd want to use a proper PDF text extraction library
        resolve(`PDF document: ${file.name} - Content extraction requires PDF parsing library`);
      } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      } else {
        // For other document types, return basic info
        resolve(`Document: ${file.name} - Binary file content`);
      }
    });
  };

  // Validate document content
  const validateDocument = async (document) => {
    if (!document.category || !primaryIndication.trim()) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Category or primary indication not specified',
        recommendation: 'Please assign a category and specify primary indication'
      };
    }

    setValidatingDocuments(prev => new Set(prev).add(document.id));

    try {
      // Extract text content from file
      const documentText = await extractTextFromFile(document.file);
      
      const categoryInfo = documentCategories.find(cat => cat.id === document.category);
      
      const validationData = {
        documentText,
        fileName: document.name,
        expectedCategory: document.category,
        categoryDescription: categoryInfo?.name || document.category,
        primaryIndication: primaryIndication.trim(),
        dossierType: selectedDossierType,
        fileType: document.file.type,
        fileSize: document.file.size,
        language: 'english' // Could be detected or user-specified
      };

      const validationResult = await apiService.validateDocumentContent(validationData);
      
      // Update document with validation result
      setUploadedDocuments(docs => 
        docs.map(doc => 
          doc.id === document.id 
            ? { ...doc, validation: validationResult }
            : doc
        )
      );

      return validationResult;
    } catch (error) {
      console.error('Validation error:', error);
      const errorResult = {
        isValid: false,
        confidence: 0,
        reason: 'Validation service error',
        recommendation: 'Try validation again or contact support'
      };
      
      setUploadedDocuments(docs => 
        docs.map(doc => 
          doc.id === document.id 
            ? { ...doc, validation: errorResult }
            : doc
        )
      );
      
      return errorResult;
    } finally {
      setValidatingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    onDrop: acceptedFiles => {
      const newDocuments = acceptedFiles.map(file => ({
        file,
        name: file.name,
        size: file.size,
        category: '',
        id: Date.now() + Math.random(),
        validation: null
      }));
      setUploadedDocuments([...uploadedDocuments, ...newDocuments]);
    }
  });

  const handleCategoryChange = async (documentId, category) => {
    const categoryCount = uploadedDocuments.filter(doc => doc.category === category).length;
    const maxFiles = documentCategories.find(cat => cat.id === category)?.maxFiles || 10;
    
    if (categoryCount >= maxFiles) {
      alert(`Maximum ${maxFiles} file(s) allowed for ${category}`);
      return;
    }
    
    // Update category
    setUploadedDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId ? { ...doc, category, validation: null } : doc
      )
    );

    // Auto-validate if primary indication is set
    if (primaryIndication.trim()) {
      const document = uploadedDocuments.find(doc => doc.id === documentId);
      if (document) {
        const updatedDocument = { ...document, category };
        setTimeout(() => validateDocument(updatedDocument), 100);
      }
    }
  };

  const removeDocument = (documentId) => {
    setUploadedDocuments(docs => docs.filter(doc => doc.id !== documentId));
  };

  const manualValidateDocument = async (documentId) => {
    const document = uploadedDocuments.find(doc => doc.id === documentId);
    if (document) {
      await validateDocument(document);
    }
  };

  const validateAllDocuments = async () => {
    if (!primaryIndication.trim()) {
      // TODO: Replace with user-friendly notification system
      // alert('Please specify the primary indication before validating documents.');
      return;
    }

    const documentsToValidate = uploadedDocuments.filter(doc => doc.category);
    
    for (const document of documentsToValidate) {
      await validateDocument(document);
    }
  };

  const compileDossier = async () => {
    setLoading(true);
    
    try {
      // console.log('Starting dossier compilation...');
      // console.log('Selected dossier type:', selectedDossierType);
      // console.log('Uploaded documents:', uploadedDocuments);
      
      const result = await apiService.compileDossier(selectedDossierType, uploadedDocuments);
      
      // console.log('Compilation result:', result);
      
      if (result.success) {
        // TODO: Replace with user-friendly notification system
        // alert(result.message || `Dossier compiled successfully! Downloaded as: ${result.fileName}`);
        // Optionally reset the form
        setUploadedDocuments([]);
        setSelectedDossierType('');
        setPrimaryIndication('');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      // alert(`Failed to compile dossier: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isReadyToCompile = () => {
    if (!selectedDossierType) return false;
    
    const requiredCategories = documentCategories
      .filter(cat => cat.required)
      .map(cat => cat.id);
    
    const uploadedCategories = uploadedDocuments
      .map(doc => doc.category)
      .filter(Boolean);
    
    return requiredCategories.every(req => uploadedCategories.includes(req));
  };

  const getCategoryStatus = (categoryId) => {
    const uploaded = uploadedDocuments.filter(doc => doc.category === categoryId).length;
    const category = documentCategories.find(cat => cat.id === categoryId);
    const required = category?.required;
    const maxFiles = category?.maxFiles || 10;
    
    if (required && uploaded === 0) return 'missing';
    if (uploaded >= maxFiles) return 'full';
    if (uploaded > 0) return 'partial';
    return 'empty';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'missing': return 'Missing';
      case 'full': return 'Complete';
      case 'partial': return '🟡';
      default: return '⚪';
    }
  };

  const getValidationIcon = (validation) => {
    if (!validation) return '⚪';
    if (validation.confidence >= 0.8) return 'Valid';
    if (validation.confidence >= 0.6) return '🟡';
    return 'Invalid';
  };

  const getValidationColor = (validation) => {
    if (!validation) return '#94a3b8';
    if (validation.confidence >= 0.8) return '#10b981';
    if (validation.confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getValidationSummary = () => {
    const validatedDocs = uploadedDocuments.filter(doc => doc.validation);
    const validDocs = validatedDocs.filter(doc => doc.validation.isValid);
    const highConfidence = validatedDocs.filter(doc => doc.validation.confidence >= 0.8);
    
    return {
      total: uploadedDocuments.length,
      validated: validatedDocs.length,
      valid: validDocs.length,
      highConfidence: highConfidence.length
    };
  };

  const summary = getValidationSummary();

  return (
    <div className="clinical-dossier-compiler" style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Main Content Area */}
      <div style={{ flex: 1, maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
        Clinical Dossier Compiler
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Compile various clinical trial documents into a single regulatory dossier with AI-powered document validation
      </p>

      {/* Primary Indication Input */}
      <div style={{ marginBottom: '2rem', backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>                    
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>                                                         
          Primary Indication
        </h2>
        <input
          type="text"
          value={primaryIndication}
          onChange={(e) => setPrimaryIndication(e.target.value)}
          placeholder="Enter the primary disease/condition (e.g., Type 2 Diabetes, Alzheimer's Disease)"                                                        
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '1rem'
          }}
        />
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>                                                                               
          This helps validate that uploaded documents are relevant to your clinical indication                                                                  
        </p>
      </div>

      {/* Country Selection */}
      <div style={{ marginBottom: '2rem', backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>                    
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>                                                         
          Target Country/Region
        </h2>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '1rem',
            backgroundColor: 'white'
          }}
        >
          <option value="">Select a country/region...</option>
          {Object.entries(countryRegulatoryData).map(([code, data]) => (
            <option key={code} value={code}>
              {data.name} ({data.regulator})
            </option>
          ))}
        </select>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>                                                                               
          Select the target country/region for regulatory submission                                                                  
        </p>
      </div>

      {/* Dossier Type Selection */}
      <div className="dossier-type-selection" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
           Select Dossier Type
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {dossierTypes.map(type => (
            <div 
              key={type.id}
              className={`dossier-type-card ${selectedDossierType === type.id ? 'selected' : ''}`}
              onClick={() => setSelectedDossierType(type.id)}
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: selectedDossierType === type.id ? `3px solid ${type.color}` : '2px solid #e2e8f0',
                backgroundColor: selectedDossierType === type.id ? `${type.color}10` : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedDossierType === type.id ? `0 8px 25px ${type.color}20` : '0 2px 4px rgba(0,0,0,0.1)',
                transform: selectedDossierType === type.id ? 'translateY(-2px)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>{type.icon}</span>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '600', 
                  margin: 0,
                  color: selectedDossierType === type.id ? type.color : '#1e293b'
                }}>
                  {type.name}
                </h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {selectedDossierType && (
        <>
          {/* Document Upload Area */}
          <div className="document-upload-section" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              📁 Upload Documents
            </h2>
            <div 
              {...getRootProps()} 
              className={`dropzone ${isDragActive ? 'active' : ''}`}
              style={{
                border: isDragActive ? '3px dashed #3b82f6' : '2px dashed #94a3b8',
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center',
                backgroundColor: isDragActive ? '#eff6ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {isDragActive ? 'Drop files here' : 'Click to upload'}
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1e293b' }}>
                {isDragActive
                  ? 'Drop the files here...'
                  : 'Drag and drop documents here, or click to select files'}
              </p>
              <small style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Accepted formats: PDF, DOC, DOCX, XLS, XLSX, TXT
              </small>
            </div>
          </div>

          {/* Validation Summary */}
          {uploadedDocuments.length > 0 && (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#1e293b' }}>
                  🔍 Document Validation Summary
                </h2>
                <button
                  onClick={validateAllDocuments}
                  disabled={!primaryIndication.trim() || validatingDocuments.size > 0}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: primaryIndication.trim() ? 'var(--color-primary)' : 'var(--color-gray-400)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: primaryIndication.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem'
                  }}
                >
                  {validatingDocuments.size > 0 ? 'Validating...' : 'Validate All Documents'}
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{summary.total}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Documents</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{summary.validated}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Validated</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{summary.valid}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Valid Documents</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>{summary.highConfidence}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>High Confidence</div>
                </div>
              </div>
            </div>
          )}

          {/* Document Categories Checklist */}
          <div className="document-checklist" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              Required Documents Checklist
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem'
            }}>
              {documentCategories.map(cat => {
                const status = getCategoryStatus(cat.id);
                const uploadedCount = uploadedDocuments.filter(doc => doc.category === cat.id).length;
                
                return (
                  <div key={cat.id} className={`checklist-item ${status}`} style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    border: `2px solid ${status === 'missing' ? '#ef4444' : status === 'full' ? '#10b981' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>{cat.icon}</span>
                      <div>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                          {cat.name} {cat.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {uploadedCount}/{cat.maxFiles} files
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(status)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uploaded Documents List */}
          {uploadedDocuments.length > 0 && (
            <div className="uploaded-documents" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                📚 Uploaded Documents ({uploadedDocuments.length})
              </h2>
              <div className="documents-list" style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '1rem',
                border: '1px solid #e2e8f0'
              }}>
                {uploadedDocuments.map(doc => (
                  <div key={doc.id} className="document-item" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderBottom: '1px solid #f1f5f9',
                    borderRadius: '8px'
                  }}>
                    <div className="document-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span className="document-name" style={{ fontWeight: '500', marginRight: '0.5rem' }}>
                          {doc.name}
                        </span>
                        <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>
                          {getValidationIcon(doc.validation)}
                        </span>
                        {validatingDocuments.has(doc.id) && (
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>Validating...</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {doc.validation && (
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                          <div style={{ 
                            color: getValidationColor(doc.validation), 
                            fontWeight: '500',
                            marginBottom: '0.25rem'
                          }}>
                            Confidence: {(doc.validation.confidence * 100).toFixed(1)}% - {doc.validation.reason}
                          </div>
                          {doc.validation.recommendation && (
                            <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                              Recommendation: {doc.validation.recommendation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <select
                        value={doc.category}
                        onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                        className="category-select"
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          minWidth: '180px'
                        }}
                      >
                        <option value="">Select Category</option>
                        {documentCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name} {cat.required && '*'}
                          </option>
                        ))}
                      </select>
                      {doc.category && primaryIndication.trim() && (
                        <button
                          onClick={() => manualValidateDocument(doc.id)}
                          disabled={validatingDocuments.has(doc.id)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          {validatingDocuments.has(doc.id) ? '⏳' : '🔍'}
                        </button>
                      )}
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="remove-button"
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--color-error)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compile Button */}
          <div className="compile-section" style={{ textAlign: 'center' }}>
            <button
              onClick={compileDossier}
              disabled={!isReadyToCompile() || loading}
              className="compile-button"
              style={{
                padding: '1rem 3rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isReadyToCompile() && !loading ? 'var(--color-success)' : 'var(--color-gray-400)',
                color: 'white',
                cursor: isReadyToCompile() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: isReadyToCompile() && !loading ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              {loading ? 'Compiling Dossier...' : 'Compile Dossier'}
            </button>
            {!isReadyToCompile() && !loading && (
              <p className="warning-message" style={{ 
                marginTop: '1rem', 
                color: '#ef4444', 
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Warning: Please upload all required documents and assign categories before compiling
              </p>
            )}
            {primaryIndication.trim() && uploadedDocuments.some(doc => doc.validation && !doc.validation.isValid) && (
              <p style={{ 
                marginTop: '1rem', 
                color: '#f59e0b', 
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                ! Some documents have validation issues. Review and address them before compiling.
              </p>
            )}
          </div>
        </>
      )}
      </div>

      {/* Country-Specific Compiler Sidebar */}
      <div style={{ 
        width: '350px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '12px', 
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '1rem', 
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          Country Compiler
        </h3>

        {selectedCountry ? (
          <div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem'
            }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '0.5rem', 
                color: '#1e293b' 
              }}>
                {countryRegulatoryData[selectedCountry].name}
              </h4>
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#64748b', 
                marginBottom: '0.5rem' 
              }}>
                <strong>Regulator:</strong> {countryRegulatoryData[selectedCountry].regulator}
              </p>
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#64748b', 
                marginBottom: '0' 
              }}>
                <strong>Submission Route:</strong> {countryRegulatoryData[selectedCountry].submissionRoute}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                marginBottom: '0.75rem', 
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Required Documents
              </h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {countryRegulatoryData[selectedCountry].documents.map((doc, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: index < countryRegulatoryData[selectedCountry].documents.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: '#10b981',
                      marginRight: '0.5rem',
                      fontWeight: '500'
                    }}>
                      •
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      color: '#374151'
                    }}>
                      {doc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => {
                  // Generate country-specific dossier
                  console.log(`Compiling dossier for ${countryRegulatoryData[selectedCountry].name}`);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Compile for {countryRegulatoryData[selectedCountry].name}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem 1rem',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></div>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#64748b', 
              margin: 0 
            }}>
              Select a country/region to view specific regulatory requirements and compile a targeted dossier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalDossierCompiler;