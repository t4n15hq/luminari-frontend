import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import apiService from '../services/api';

const ClinicalDossierCompiler = () => {
  const [selectedDossierType, setSelectedDossierType] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const dossierTypes = [
    { 
      id: 'impd', 
      name: 'Investigational Medicinal Product Dossier (IMPD)',
      description: 'EU dossier containing quality, production, and control information'
    },
    { 
      id: 'ind', 
      name: 'Investigational New Drug (IND) Application',
      description: 'US FDA submission for investigational new drug trials'
    },
    { 
      id: 'ctd', 
      name: 'Common Technical Document (CTD)',
      description: 'Standardized format for quality, safety, and efficacy information'
    },
    { 
      id: 'ectd', 
      name: 'Electronic Common Technical Document (eCTD)',
      description: 'Electronic version of CTD for digital submission'
    }
  ];

  const documentCategories = [
    { id: 'protocol', name: 'Protocol', required: true },
    { id: 'ib', name: "Investigator's Brochure (IB)", required: true },
    { id: 'quality', name: 'Quality Information', required: true },
    { id: 'nonclinical', name: 'Non-clinical Data', required: true },
    { id: 'clinical', name: 'Clinical Data', required: true },
    { id: 'application', name: 'Application Form', required: true },
    { id: 'other', name: 'Other Documents', required: false }
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    onDrop: acceptedFiles => {
      const newDocuments = acceptedFiles.map(file => ({
        file,
        name: file.name,
        size: file.size,
        category: '',
        id: Date.now() + Math.random()
      }));
      setUploadedDocuments([...uploadedDocuments, ...newDocuments]);
    }
  });

  const handleCategoryChange = (documentId, category) => {
    setUploadedDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId ? { ...doc, category } : doc
      )
    );
  };

  const removeDocument = (documentId) => {
    setUploadedDocuments(docs => docs.filter(doc => doc.id !== documentId));
  };

  const compileDossier = async () => {
    setLoading(true);
    
    try {
      console.log('Starting dossier compilation...');
      console.log('Selected dossier type:', selectedDossierType);
      console.log('Uploaded documents:', uploadedDocuments);
      
      const result = await apiService.compileDossier(selectedDossierType, uploadedDocuments);
      
      console.log('Compilation result:', result);
      
      if (result.success) {
        alert(result.message || `Dossier compiled successfully! Downloaded as: ${result.fileName}`);
        // Optionally reset the form
        setUploadedDocuments([]);
        setSelectedDossierType('');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Failed to compile dossier: ${error.message}`);
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

  return (
    <div className="clinical-dossier-compiler">
      <h2>Clinical Dossier Compiler</h2>
      <p>Compile various clinical trial documents into a single regulatory dossier</p>

      {/* Dossier Type Selection */}
      <div className="dossier-type-selection">
        <h3>Select Dossier Type</h3>
        <div className="dossier-types-grid">
          {dossierTypes.map(type => (
            <div 
              key={type.id}
              className={`dossier-type-card ${selectedDossierType === type.id ? 'selected' : ''}`}
              onClick={() => setSelectedDossierType(type.id)}
            >
              <h4>{type.name}</h4>
              <p>{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedDossierType && (
        <>
          {/* Document Upload Area */}
          <div className="document-upload-section">
            <h3>Upload Documents</h3>
            <div 
              {...getRootProps()} 
              className={`dropzone ${isDragActive ? 'active' : ''}`}
            >
              <input {...getInputProps()} />
              <p>
                {isDragActive
                  ? 'Drop the files here...'
                  : 'Drag and drop documents here, or click to select files'}
              </p>
              <small>Accepted formats: PDF, DOC, DOCX, XLS, XLSX</small>
            </div>
          </div>

          {/* Uploaded Documents List */}
          {uploadedDocuments.length > 0 && (
            <div className="uploaded-documents">
              <h3>Uploaded Documents</h3>
              <div className="documents-list">
                {uploadedDocuments.map(doc => (
                  <div key={doc.id} className="document-item">
                    <div className="document-info">
                      <span className="document-name">{doc.name}</span>
                      <span className="document-size">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <select
                      value={doc.category}
                      onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                      className="category-select"
                    >
                      <option value="">Select Category</option>
                      {documentCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} {cat.required && '*'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Checklist */}
          <div className="document-checklist">
            <h3>Required Documents Checklist</h3>
            <ul>
              {documentCategories.filter(cat => cat.required).map(cat => {
                const hasDocument = uploadedDocuments.some(doc => doc.category === cat.id);
                return (
                  <li key={cat.id} className={hasDocument ? 'completed' : 'pending'}>
                    <span className="checklist-icon">{hasDocument ? '✓' : '○'}</span>
                    {cat.name}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Compile Button */}
          <div className="compile-section">
            <button
              onClick={compileDossier}
              disabled={!isReadyToCompile() || loading}
              className="compile-button"
            >
              {loading ? 'Compiling...' : 'Compile Dossier'}
            </button>
            {!isReadyToCompile() && (
              <p className="warning-message">
                Please upload all required documents and assign categories before compiling.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClinicalDossierCompiler;