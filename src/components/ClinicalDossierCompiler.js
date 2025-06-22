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
      description: 'EU dossier containing quality, production, and control information',
      icon: '🇪🇺',
      color: '#4F46E5'
    },
    { 
      id: 'ind', 
      name: 'Investigational New Drug (IND) Application',
      description: 'US FDA submission for investigational new drug trials',
      icon: '🇺🇸',
      color: '#059669'
    },
    { 
      id: 'ctd', 
      name: 'Common Technical Document (CTD)',
      description: 'Standardized format for quality, safety, and efficacy information',
      icon: '📋',
      color: '#DC2626'
    },
    { 
      id: 'ectd', 
      name: 'Electronic Common Technical Document (eCTD)',
      description: 'Electronic version of CTD for digital submission',
      icon: '💻',
      color: '#7C3AED'
    }
  ];

  const documentCategories = [
    { id: 'protocol', name: 'Protocol', required: true, icon: '📄', maxFiles: 1 },
    { id: 'ib', name: "Investigator's Brochure (IB)", required: true, icon: '📖', maxFiles: 1 },
    { id: 'quality', name: 'Quality Information', required: true, icon: '⚗️', maxFiles: 3 },
    { id: 'nonclinical', name: 'Non-clinical Data', required: true, icon: '🧪', maxFiles: 5 },
    { id: 'clinical', name: 'Clinical Data', required: true, icon: '🏥', maxFiles: 10 },
    { id: 'application', name: 'Application Form', required: true, icon: '📝', maxFiles: 1 },
    { id: 'other', name: 'Other Documents', required: false, icon: '📎', maxFiles: 5 }
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
    const categoryCount = uploadedDocuments.filter(doc => doc.category === category).length;
    const maxFiles = documentCategories.find(cat => cat.id === category)?.maxFiles || 10;
    
    if (categoryCount >= maxFiles) {
      alert(`Maximum ${maxFiles} file(s) allowed for ${category}`);
      return;
    }
    
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
      case 'missing': return '❌';
      case 'full': return '✅';
      case 'partial': return '🟡';
      default: return '⚪';
    }
  };

  return (
    <div className="clinical-dossier-compiler">
     <h2>Clinical Dossier Compiler</h2>
      <p>Compile various clinical trial documents into a single regulatory dossier</p>

      {/* Dossier Type Selection */}
      <div className="dossier-type-selection">
        <h2>📋 Select Dossier Type</h2>
        <div className="dossier-types-grid">
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
                transform: selectedDossierType === type.id ? 'translateY(-2px)' : 'none',
                marginBottom: '1rem'
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
          <div className="document-upload-section">
            <h2>📁 Upload Documents</h2>
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
                transition: 'all 0.2s ease',
                marginBottom: '2rem'
              }}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {isDragActive ? '📂' : '📄'}
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1e293b' }}>
                {isDragActive
                  ? 'Drop the files here...'
                  : 'Drag and drop documents here, or click to select files'}
              </p>
              <small style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Accepted formats: PDF, DOC, DOCX, XLS, XLSX
              </small>
            </div>
          </div>

          {/* Document Categories Checklist */}
          <div className="document-checklist">
            <h2>✅ Required Documents Checklist</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem',
              marginBottom: '2rem'
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
            <div className="uploaded-documents">
              <h2>📚 Uploaded Documents ({uploadedDocuments.length})</h2>
              <div className="documents-list" style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                padding: '1rem',
                border: '1px solid #e2e8f0',
                marginBottom: '2rem'
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
                      <span className="document-name" style={{ fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>
                        {doc.name}
                      </span>
                      <span className="document-size" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <select
                      value={doc.category}
                      onChange={(e) => handleCategoryChange(doc.id, e.target.value)}
                      className="category-select"
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        marginRight: '1rem',
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
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="remove-button"
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ef4444',
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
                backgroundColor: isReadyToCompile() && !loading ? '#10b981' : '#94a3b8',
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
                ⚠️ Please upload all required documents and assign categories before compiling
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClinicalDossierCompiler;