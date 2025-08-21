import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import apiService from '../services/api';
import { saveDocument, fetchDocuments } from '../services/api'; // <-- update import
import { useBackgroundJobs } from '../hooks/useBackgroundJobs'; // NEW IMPORT
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import DocumentViewer from './common/DocumentViewer';
import AskLuminaPopup from './common/AskLuminaPopup';
import FloatingButton from './common/FloatingButton';
import RichTextEditor from './common/RichTextEditor';

const ProtocolGenerator = () => {
  const [showAskLumina, setShowAskLumina] = useState(false);
  
  // Basic Information
  const [disease, setDisease] = useState('');
  const [population, setPopulation] = useState('');
  const [treatment, setTreatment] = useState('');
  const [drugClass, setDrugClass] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [clinicalInfo, setClinicalInfo] = useState('');

  // Trial Design & Basics
  const [trialPhase, setTrialPhase] = useState('');
  const [trialType, setTrialType] = useState('');
  const [randomization, setRandomization] = useState('');
  const [blinding, setBlinding] = useState('');
  const [controlGroupType, setControlGroupType] = useState('');

  // Population & Eligibility
  const [sampleSize, setSampleSize] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');
  const [inclusionCriteria, setInclusionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');

  // Intervention & Drug Details
  const [routeOfAdministration, setRouteOfAdministration] = useState('');
  const [dosingFrequency, setDosingFrequency] = useState('');
  const [comparatorDrug, setComparatorDrug] = useState('');

  // Endpoints & Outcome Measures
  const [primaryEndpoints, setPrimaryEndpoints] = useState('');
  const [secondaryEndpoints, setSecondaryEndpoints] = useState('');
  const [outcomeMeasurementTool, setOutcomeMeasurementTool] = useState('');

  // Statistics & Duration
  const [statisticalPower, setStatisticalPower] = useState('80');
  const [significanceLevel, setSignificanceLevel] = useState('0.05');
  const [studyDuration, setStudyDuration] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [studyDesign, setStudyDesign] = useState(null);
  const [activeTab, setActiveTab] = useState('protocol');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showGeneratedInfo, setShowGeneratedInfo] = useState(false);
  const [showPreviousProtocols, setShowPreviousProtocols] = useState(false);
  const [previousProtocols, setPreviousProtocols] = useState([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [protocolsPerPage] = useState(5);
  const [fetchError, setFetchError] = useState('');
  // Add state for previous doc type
  const [previousDocType, setPreviousDocType] = useState('PROTOCOL'); // 'PROTOCOL' or 'STUDY_DESIGN'

  // Individual section editing state
  const [sectionEdits, setSectionEdits] = useState({});
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [aiEnabledSections, setAiEnabledSections] = useState(new Set());
  
  // Reference Protocol Panel State
  const [showReferencePanel, setShowReferencePanel] = useState(false);
  const [selectedReferenceProtocol, setSelectedReferenceProtocol] = useState(null);
  const [referenceProtocolTOC, setReferenceProtocolTOC] = useState([]);
  const [selectedReferenceSection, setSelectedReferenceSection] = useState(null);
  const [selectedReferenceSectionContent, setSelectedReferenceSectionContent] = useState('');
  
  // Section Selection and Editing State
  const [selectedProtocolSections, setSelectedProtocolSections] = useState(new Set());
  const [selectedStudyDesignSections, setSelectedStudyDesignSections] = useState(new Set());
  const [editableSelectedContent, setEditableSelectedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Background processing
  const { startJob, getJob } = useBackgroundJobs('protocol');
  const [backgroundJobId, setBackgroundJobId] = useState(null);

  // Dossier Type Selection and Document Upload State
  const [selectedDossierType, setSelectedDossierType] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState(() => {
    // Load from localStorage on component mount
    try {
      const saved = localStorage.getItem('protocolGenerator_uploadedDocuments');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading uploaded documents from localStorage:', error);
      return [];
    }
  });
  const [validatingDocuments, setValidatingDocuments] = useState(new Set());
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentChecklist, setShowDocumentChecklist] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);

  // Dossier types for protocol generation
  const dossierTypes = [
    { 
      id: 'protocol_impd', 
      name: 'Protocol for IMPD',
      description: 'EU dossier containing quality, production, and control information',
      color: '#4F46E5'
    },
    { 
      id: 'protocol_ind', 
      name: 'Protocol for IND',
      description: 'US FDA submission for investigational new drug trials',
      color: '#059669'
    },
    { 
      id: 'protocol_ctd', 
      name: 'Protocol for CTD',
      description: 'Standardized format for quality, safety, and efficacy information',
      color: '#DC2626'
    },
    { 
      id: 'protocol_ectd', 
      name: 'Protocol for eCTD',
      description: 'Electronic version of CTD for digital submission',
      color: '#7C3AED'
    }
  ];

  // Document categories for protocol generation
  const documentCategories = [
    { id: 'protocol', name: 'Protocol Document', required: true, icon: '📄', maxFiles: 1 },
    { id: 'investigator_brochure', name: "Investigator's Brochure (IB)", required: true, icon: '📖', maxFiles: 1 },
    { id: 'quality_info', name: 'Quality Information', required: true, icon: '⚗️', maxFiles: 3 },
    { id: 'nonclinical_data', name: 'Non-clinical Data', required: true, icon: '🧪', maxFiles: 5 },
    { id: 'clinical_data', name: 'Clinical Data', required: true, icon: '🏥', maxFiles: 10 },
    { id: 'application_form', name: 'Application Form', required: true, icon: '📝', maxFiles: 1 },
    { id: 'other_documents', name: 'Other Documents', required: false, icon: '📎', maxFiles: 5 }
  ];

  // Dropzone configuration with edge case handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024, // 50MB max file size
    multiple: true,
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(file => {
          if (file.errors.some(e => e.code === 'file-too-large')) {
            return `${file.file.name}: File too large (max 50MB)`;
          }
          if (file.errors.some(e => e.code === 'file-invalid-type')) {
            return `${file.file.name}: Invalid file type`;
          }
          return `${file.file.name}: Upload failed`;
        });
        alert(`Upload errors:\n${errors.join('\n')}`);
      }

      // Handle accepted files with duplicate name checking
      const existingNames = uploadedDocuments.map(doc => doc.name);
      const newDocuments = acceptedFiles
        .filter(file => {
          if (existingNames.includes(file.name)) {
            alert(`File "${file.name}" already exists. Please rename or remove the existing file.`);
            return false;
          }
          return true;
        })
        .map(file => ({
          file,
          name: file.name,
          size: file.size,
          category: '',
          id: Date.now() + Math.random(),
          validation: null,
          uploadTime: new Date().toISOString()
        }));

      if (newDocuments.length > 0) {
        setUploadedDocuments(prev => {
          const updated = [...prev, ...newDocuments];
          // Save to localStorage
          try {
            localStorage.setItem('protocolGenerator_uploadedDocuments', JSON.stringify(updated));
          } catch (error) {
            console.error('Error saving uploaded documents to localStorage:', error);
          }
          return updated;
        });
      }
    }
  });

  // Protocol sections for navigation
  const protocolSections = [
    { id: 'protocol-section-1', title: '1. Protocol Summary / Synopsis' },
    { id: 'protocol-section-2', title: '2. Introduction & Background' },
    { id: 'protocol-section-3', title: '3. Objectives & Endpoints' },
    { id: 'protocol-section-4', title: '4. Study Design & Investigational Plan' },
    { id: 'protocol-section-5', title: '5. Study Population & Eligibility' },
    { id: 'protocol-section-6', title: '6. Interventions / Treatments' },
    { id: 'protocol-section-7', title: '7. Assessments & Procedures' },
    { id: 'protocol-section-8', title: '8. Statistical Considerations & Data Analysis' },
    { id: 'protocol-section-9', title: '9. Outcome Analysis' },
    { id: 'protocol-section-10', title: '10. References & Appendices' }
  ];

  // Study design sections for navigation
  const studyDesignSections = [
    { id: 'cmc-section', title: 'CMC Section' },
    { id: 'clinical-section-1', title: '1. Intro / Background' },
    { id: 'clinical-section-2', title: '2. Objectives / Hypotheses / Endpoints' },
    { id: 'clinical-section-3', title: '3. Study Design & Sample Size' },
    { id: 'clinical-section-4', title: '4. Populations & Baseline' },
    { id: 'clinical-section-5', title: '5. Statistical Methods & Data Handling' },
    { id: 'clinical-section-6', title: '6. Efficacy Analysis' },
    { id: 'clinical-section-7', title: '7. Safety Analysis' },
    { id: 'clinical-section-8', title: '8. Pharmacokinetic / Exploratory' },
    { id: 'clinical-section-9', title: '9. Interim & Other Special Analyses' },
    { id: 'clinical-section-10', title: '10. References & Appendices' }
  ];

  // Dropdown options
  const trialPhases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV'];
  const trialTypes = ['Interventional', 'Observational', 'Registry'];
  const blindingOptions = ['Open-label', 'Single-blind', 'Double-blind'];
  const controlGroupTypes = ['Placebo', 'Standard of Care', 'None'];
  const genderOptions = ['All', 'Male', 'Female'];
  const routeOptions = ['Oral', 'Intravenous (IV)', 'Subcutaneous (SC)', 'Intramuscular (IM)', 'Topical', 'Inhalation', 'Transdermal'];
  const dosingFrequencyOptions = ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As needed'];
  const outcomeMeasurementTools = [
    'PASI (Psoriasis Area and Severity Index)',
    'DLQI (Dermatology Life Quality Index)',
    'EASI (Eczema Area and Severity Index)',
    'IGA (Investigator Global Assessment)',
    'VAS (Visual Analog Scale)',
    'HAM-D (Hamilton Depression Rating Scale)',
    'MMSE (Mini-Mental State Examination)',
    'FEV1 (Forced Expiratory Volume)',
    'FVC (Forced Vital Capacity)',
    'WOMAC (Western Ontario and McMaster Universities Arthritis Index)',
    'Custom/Other'
  ];

  // Document handling functions

  const removeDocument = (documentId) => {
    setUploadedDocuments(docs => {
      const updatedDocs = docs.filter(doc => doc.id !== documentId);
      
      // Clean up file object to free memory
      const removedDoc = docs.find(doc => doc.id === documentId);
      if (removedDoc && removedDoc.file) {
        // Revoke object URL if it exists
        if (removedDoc.file.preview) {
          URL.revokeObjectURL(removedDoc.file.preview);
        }
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('protocolGenerator_uploadedDocuments', JSON.stringify(updatedDocs));
      } catch (error) {
        console.error('Error saving uploaded documents to localStorage:', error);
      }
      
      return updatedDocs;
    });
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

  // Function to handle checklist item click (green tick functionality)
  const handleChecklistItemClick = (categoryId) => {
    const status = getCategoryStatus(categoryId);
    const uploadedCount = uploadedDocuments.filter(doc => doc.category === categoryId).length;
    const category = documentCategories.find(cat => cat.id === categoryId);
    
    if (status === 'missing' || status === 'partial') {
      // If category is missing or partial, show a message
      alert(`${category.name} requires ${category.maxFiles} file(s). Currently uploaded: ${uploadedCount}/${category.maxFiles}`);
    } else if (status === 'full') {
      // If category is complete, show success message with animation
      const checklistItem = document.querySelector(`[data-category="${categoryId}"]`);
      if (checklistItem) {
        checklistItem.style.animation = 'successPulse 0.6s ease-in-out';
        setTimeout(() => {
          checklistItem.style.animation = '';
        }, 600);
      }
      alert(`✅ ${category.name} is complete with ${uploadedCount}/${category.maxFiles} files!`);
    }
  };

  // Add success animation when documents are categorized
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

    // Check if this completes the category and show success animation
    setTimeout(() => {
      const newStatus = getCategoryStatus(category);
      if (newStatus === 'full') {
        const checklistItem = document.querySelector(`[data-category="${category}"]`);
        if (checklistItem) {
          checklistItem.style.animation = 'successPulse 0.6s ease-in-out';
          setTimeout(() => {
            checklistItem.style.animation = '';
          }, 600);
        }
      }
    }, 100);
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

  const compileDossier = async () => {
    setLoading(true);
    
    try {
      // Validate that all required documents are present
      const requiredCategories = documentCategories
        .filter(cat => cat.required)
        .map(cat => cat.id);
      
      const uploadedCategories = uploadedDocuments
        .map(doc => doc.category)
        .filter(Boolean);
      
      const missingCategories = requiredCategories.filter(req => !uploadedCategories.includes(req));
      
      if (missingCategories.length > 0) {
        const missingNames = missingCategories.map(id => 
          documentCategories.find(cat => cat.id === id)?.name
        ).filter(Boolean);
        
        alert(`Missing required documents: ${missingNames.join(', ')}`);
        setLoading(false);
        return;
      }

      const result = await apiService.compileDossier(selectedDossierType, uploadedDocuments);
      
      if (result.success) {
        alert(result.message || `Dossier compiled successfully! Downloaded as: ${result.fileName}`);
        
        // Clear all uploaded documents and reset state
        setUploadedDocuments([]);
        setSelectedDossierType('');
        setShowDocumentUpload(false);
        setShowDocumentChecklist(false);
        
        // Clear localStorage backup
        localStorage.removeItem('protocolGenerator_uploadedDocuments');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('network')) {
        alert('Network error: Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        alert('Request timeout: The operation took too long. Please try again.');
      } else {
        alert(`Failed to compile dossier: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowGeneratedInfo(false);
    
    try {
      // Compile all form data
      const formData = {
        disease_name: disease,
        additional_parameters: {
          // Basic information
          population: population || undefined,
          treatment_duration: treatment || undefined,
          drug_class: drugClass || undefined,
          mechanism: mechanism || undefined,
          clinical_info: clinicalInfo || undefined,
          
          // Trial Design & Basics
          trial_phase: trialPhase || undefined,
          trial_type: trialType || undefined,
          randomization: randomization || undefined,
          blinding: blinding || undefined,
          control_group_type: controlGroupType || undefined,
          
          // Population & Eligibility
          sample_size: sampleSize || undefined,
          min_age: minAge || undefined,
          max_age: maxAge || undefined,
          gender: gender || undefined,
          inclusion_criteria: inclusionCriteria || undefined,
          exclusion_criteria: exclusionCriteria || undefined,
          
          // Intervention & Drug Details
          route_of_administration: routeOfAdministration || undefined,
          dosing_frequency: dosingFrequency || undefined,
          comparator_drug: comparatorDrug || undefined,
          
          // Endpoints & Outcome Measures
          primary_endpoints: primaryEndpoints || undefined,
          secondary_endpoints: secondaryEndpoints || undefined,
          outcome_measurement_tool: outcomeMeasurementTool || undefined,
          
          // Statistics & Duration
          statistical_power: statisticalPower || undefined,
          significance_level: significanceLevel || undefined,
          study_duration: studyDuration || undefined
        }
      };

      // Start background jobs for both protocol and study design
      const protocolJobId = startJob('protocol', formData, apiService.generateProtocol);
      const studyDesignJobId = startJob('study_design', formData, apiService.generateIndModule);
      
      setBackgroundJobId(protocolJobId);
      setLoading(true);
      
      // Monitor both jobs
      const checkJobsStatus = () => {
        const protocolJob = getJob(protocolJobId);
        const studyDesignJob = getJob(studyDesignJobId);
        
        if (protocolJob && studyDesignJob) {
          if (protocolJob.status === 'completed' && studyDesignJob.status === 'completed') {
            setLoading(false);
            setBackgroundJobId(null);
            
            setResult(protocolJob.result);
            setStudyDesign(studyDesignJob.result);
            setShowGeneratedInfo(true);

            // Save protocol to backend
            if (protocolJob.result) {
              saveDocument({
                type: 'PROTOCOL',
                title: `Protocol for ${disease}`,
                disease,
                content: protocolJob.result.protocol,
                protocolId: protocolJob.result.protocol_id,
                // add more fields as needed
              });
            }
            // Save study design to backend
            if (studyDesignJob.result) {
              saveDocument({
                type: 'STUDY_DESIGN',
                title: `Study Design for ${disease}`,
                disease,
                cmcSection: studyDesignJob.result.cmc_section,
                clinicalSection: studyDesignJob.result.clinical_section,
                content: `CMC SECTION:\n${studyDesignJob.result.cmc_section}\n\nCLINICAL SECTION:\n${studyDesignJob.result.clinical_section}`,
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
            
          } else if (protocolJob.status === 'error' || studyDesignJob.status === 'error') {
            setLoading(false);
            setBackgroundJobId(null);
            setError('Failed to generate protocol. Please try again.');
          } else {
            // Jobs still running, check again in 1 second
            setTimeout(checkJobsStatus, 1000);
          }
        } else {
          // Jobs not found, check again in 1 second
          setTimeout(checkJobsStatus, 1000);
        }
      };
      
      // Start monitoring
      checkJobsStatus();
      
    } catch (err) {
      setError('Failed to generate protocol. Please try again.');
      console.error(err);
      setLoading(false);
      setBackgroundJobId(null);
    }
  };

  const handleShowPreviousProtocols = async () => {
    setShowPreviousProtocols(!showPreviousProtocols);
    if (!showPreviousProtocols && previousProtocols.length === 0) {
      setLoadingPrevious(true);
      setFetchError('');
      try {
        const docs = await fetchDocuments();
        setPreviousProtocols(docs);
      } catch (err) {
        setPreviousProtocols([]);
        setFetchError('Error fetching previous protocols. Please try again later.');
      } finally {
        setLoadingPrevious(false);
      }
    }
  };

  const downloadDocument = (content, filename) => {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Generate PDF for selected sections with proper alignment
  const generateSelectedSectionsPDF = async () => {
    try {
      setLoading(true);
      
      // Get all selected sections content
      const selectedSections = [];
      
      // Add protocol sections (sorted)
      Array.from(selectedProtocolSections)
        .sort((a, b) => {
          const aNum = parseInt(a.replace('protocol-section-', ''));
          const bNum = parseInt(b.replace('protocol-section-', ''));
          return aNum - bNum;
        })
        .forEach(sectionId => {
        const sectionNumber = sectionId.replace('protocol-section-', '');
        const sectionTitle = protocolSections.find(s => s.id === sectionId)?.title || `Section ${sectionNumber}`;
        const sectionContent = sectionEdits[sectionId] || '';
        
        if (sectionContent) {
          selectedSections.push({
            title: sectionTitle,
            content: sectionContent
          });
        }
      });
      
      // Add study design sections (sorted)
      Array.from(selectedStudyDesignSections)
        .sort((a, b) => {
          // Handle cmc-section (should come first)
          if (a === 'cmc-section') return -1;
          if (b === 'cmc-section') return 1;
          
          // Handle clinical-section-X
          const aNum = parseInt(a.replace('clinical-section-', ''));
          const bNum = parseInt(b.replace('clinical-section-', ''));
          return aNum - bNum;
        })
        .forEach(sectionId => {
        const sectionTitle = sectionId === 'cmc-section' ? 'CMC Section' : `Clinical Section ${sectionId.replace('clinical-section-', '')}`;
        const sectionContent = sectionEdits[sectionId] || '';
        
        if (sectionContent) {
          selectedSections.push({
            title: sectionTitle,
            content: sectionContent
          });
        }
      });
      
      if (selectedSections.length === 0) {
        setError('No sections selected for export');
        return;
      }
      
      // Create PDF document
      const doc = new jsPDF();
      
      // PDF settings
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      const lineHeight = 7;
      const titleLineHeight = 10;
      const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
      
      // Document header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Selected Protocol Sections', pageWidth / 2, margin, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 10, { align: 'center' });
      doc.text(`Disease: ${disease}`, pageWidth / 2, margin + 17, { align: 'center' });
      
      let currentY = margin + 30;
      let currentPage = 1;
      
      // Add each section
      selectedSections.forEach((section, index) => {
        // Check if we need a new page
        if (currentY > pageHeight - margin - 50) {
          doc.addPage();
          currentPage++;
          currentY = margin + 20;
        }
        
        // Section title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(section.title, margin, currentY);
        currentY += titleLineHeight;
        
        // Section content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        
        // Convert HTML content to plain text and handle formatting
        const plainText = section.content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace HTML entities
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');
        
        // Split content into lines that fit the page width
        const lines = doc.splitTextToSize(plainText, maxLineWidth);
        
        // Add lines with proper spacing
        lines.forEach(line => {
          // Check if we need a new page
          if (currentY > pageHeight - margin - 20) {
            doc.addPage();
            currentPage++;
            currentY = margin + 20;
          }
          
          doc.text(line, margin, currentY);
          currentY += lineHeight;
        });
        
        // Add spacing between sections
        currentY += 15;
      });
      
      // Save the PDF
      const filename = `Selected_Sections_${disease.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating selected sections PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const generatePDF = async (documentId, filename) => {
    try {
      setLoading(true);
      let content = '';
      let title = '';
      
      if (documentId === 'protocol') {
        content = result.protocol;
        title = `Enhanced Protocol for ${disease}`;
      } else if (documentId === 'studyDesign') {
        content = `CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`;
        title = `Study Design for ${disease}`;
      }
      
      if (content) {
        const doc = new jsPDF();
        
        // PDF page settings
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const maxLineWidth = pageWidth - (margin * 2);
        const lineHeight = 7;
        const titleLineHeight = 10;
        const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
        
        // Document header with proper alignment
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(title, pageWidth / 2, margin, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 10, { align: 'center' });
        doc.text(`Document ID: ${result.protocol_id}`, pageWidth / 2, margin + 17, { align: 'center' });
        
        let currentY = margin + 30;
        let currentPage = 1;
        
        // Convert HTML content to plain text and handle formatting
        const plainText = content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace HTML entities
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"');
        
        // Split content into lines that fit the page width
        const lines = doc.splitTextToSize(plainText, maxLineWidth);
        
        // Add content with automatic page breaks and proper alignment
        for (let i = 0; i < lines.length; i++) {
          // Check if we need a new page
          if (currentY > pageHeight - margin - 20) {
            doc.addPage();
            currentPage++;
            currentY = margin + 20;
          }
          
          // Add line to current page with proper alignment
          doc.text(lines[i], margin, currentY);
          currentY += lineHeight;
        }
        
        doc.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Word document for selected sections
  const generateSelectedSectionsWord = async () => {
    try {
      setLoading(true);
      
      // Get all selected sections content
      const selectedSections = [];
      
      // Add protocol sections (sorted)
      Array.from(selectedProtocolSections)
        .sort((a, b) => {
          const aNum = parseInt(a.replace('protocol-section-', ''));
          const bNum = parseInt(b.replace('protocol-section-', ''));
          return aNum - bNum;
        })
        .forEach(sectionId => {
        const sectionNumber = sectionId.replace('protocol-section-', '');
        const sectionTitle = protocolSections.find(s => s.id === sectionId)?.title || `Section ${sectionNumber}`;
        const sectionContent = sectionEdits[sectionId] || '';
        
        if (sectionContent) {
          selectedSections.push({
            title: sectionTitle,
            content: sectionContent
          });
        }
      });
      
      // Add study design sections (sorted)
      Array.from(selectedStudyDesignSections)
        .sort((a, b) => {
          // Handle cmc-section (should come first)
          if (a === 'cmc-section') return -1;
          if (b === 'cmc-section') return 1;
          
          // Handle clinical-section-X
          const aNum = parseInt(a.replace('clinical-section-', ''));
          const bNum = parseInt(b.replace('clinical-section-', ''));
          return aNum - bNum;
        })
        .forEach(sectionId => {
        const sectionTitle = sectionId === 'cmc-section' ? 'CMC Section' : `Clinical Section ${sectionId.replace('clinical-section-', '')}`;
        const sectionContent = sectionEdits[sectionId] || '';
        
        if (sectionContent) {
          selectedSections.push({
            title: sectionTitle,
            content: sectionContent
          });
        }
      });
      
      if (selectedSections.length === 0) {
        setError('No sections selected for export');
        return;
      }
      
      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: `Selected Sections - ${disease} Protocol`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
                before: 400
              }
            }),
            
            // Date
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString()}`,
                  size: 20,
                  color: '666666'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 600
              }
            }),
            
            // Separator
            new Paragraph({
              children: [
                new TextRun({
                  text: '─'.repeat(50),
                  size: 20,
                  color: 'CCCCCC'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400
              }
            }),
            
            // Sections
            ...selectedSections.flatMap((section, index) => [
              // Section title
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: {
                  after: 200,
                  before: index > 0 ? 400 : 200
                }
              }),
              
              // Section content (convert HTML to plain text)
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.content.replace(/<[^>]*>/g, ''), // Remove HTML tags
                    size: 24,
                    spacing: {
                      line: 360 // 1.5 line spacing
                    }
                  })
                ],
                spacing: {
                  after: 400
                }
              }),
              
              // Separator between sections
              ...(index < selectedSections.length - 1 ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: '─'.repeat(30),
                      size: 20,
                      color: 'CCCCCC'
                    })
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: {
                    after: 400
                  }
                })
              ] : [])
            ])
          ]
        }]
      });
      
      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Selected_Sections_${disease.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      setError('Error generating Word document');
    } finally {
      setLoading(false);
    }
  };

  // Generate Word document for full protocol
  const generateFullProtocolWord = async () => {
    try {
      setLoading(true);
      
      if (!result || !result.protocol) {
        setError('No protocol content available');
        return;
      }
      
      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: `Clinical Protocol - ${disease}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
                before: 400
              }
            }),
            
            // Date
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString()}`,
                  size: 20,
                  color: '666666'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 600
              }
            }),
            
            // Separator
            new Paragraph({
              children: [
                new TextRun({
                  text: '─'.repeat(50),
                  size: 20,
                  color: 'CCCCCC'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400
              }
            }),
            
            // Protocol content (convert HTML to plain text)
            new Paragraph({
              children: [
                new TextRun({
                  text: result.protocol.replace(/<[^>]*>/g, ''), // Remove HTML tags
                  size: 24,
                  spacing: {
                    line: 360 // 1.5 line spacing
                  }
                })
              ],
              spacing: {
                after: 400
              }
            })
          ]
        }]
      });
      
      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Full_Protocol_${disease.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      setError('Error generating Word document');
    } finally {
      setLoading(false);
    }
  };

  // Generate Word document for full study design
  const generateFullStudyDesignWord = async () => {
    try {
      setLoading(true);
      
      if (!studyDesign) {
        setError('No study design content available');
        return;
      }
      
      const fullContent = `CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`;
      
      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: `Study Design - ${disease}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
                before: 400
              }
            }),
            
            // Date
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on: ${new Date().toLocaleDateString()}`,
                  size: 20,
                  color: '666666'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 600
              }
            }),
            
            // Separator
            new Paragraph({
              children: [
                new TextRun({
                  text: '─'.repeat(50),
                  size: 20,
                  color: 'CCCCCC'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400
              }
            }),
            
            // Study design content (convert HTML to plain text)
            new Paragraph({
              children: [
                new TextRun({
                  text: fullContent.replace(/<[^>]*>/g, ''), // Remove HTML tags
                  size: 24,
                  spacing: {
                    line: 360 // 1.5 line spacing
                  }
                })
              ],
              spacing: {
                after: 400
              }
            })
          ]
        }]
      });
      
      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Full_Study_Design_${disease.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      setError('Error generating Word document');
    } finally {
      setLoading(false);
    }
  };

  // Function to identify protocol sections and add IDs for navigation
  const renderProtocolSections = (content) => {
    if (!content) {
      // Show a test section when no content is available
      return (
        <div style={{ 
          padding: '1rem', 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          backgroundColor: '#f9fafb',
          marginBottom: '1rem'
        }}>
          <h4 style={{ color: '#6b7280', marginBottom: '1rem' }}>Test Section (Generate a protocol to see real sections)</h4>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '10px',
            padding: '8px',
            borderRadius: '6px',
            transition: 'background-color 0.2s'
          }}>
            <button
              onClick={() => handleProtocolSectionToggle('protocol-section-1')}
              style={{
                background: selectedProtocolSections.has('protocol-section-1') ? '#3b82f6' : '#f3f4f6',
                color: selectedProtocolSections.has('protocol-section-1') ? 'white' : '#374151',
                border: '2px solid #d1d5db',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              title={selectedProtocolSections.has('protocol-section-1') ? 'Remove from selection' : 'Add to selection'}
            >
              {selectedProtocolSections.has('protocol-section-1') ? '✓' : '+'}
            </button>
            <h4 style={{ margin: 0, flex: 1 }}>1. Test Section Header</h4>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            This is a test section to demonstrate the "+" button functionality. 
            Generate a protocol to see real sections with "+" buttons.
          </p>
        </div>
      );
    }
    
    const lines = content.split('\n');
    const sectionsMarkup = [];
    
    lines.forEach((line, idx) => {
      // Check if this is a main section header (starts with a number followed by period)
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
      
      if (sectionMatch && parseInt(sectionMatch[1]) >= 1 && parseInt(sectionMatch[1]) <= 10) {
        const sectionId = `protocol-section-${sectionMatch[1]}`;
        const isSelected = selectedProtocolSections.has(sectionId);
        
        sectionsMarkup.push(
          <div key={`section-${idx}`} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '10px',
            padding: '8px',
            borderRadius: '6px',
            transition: 'background-color 0.2s'
          }}>
            <button
              onClick={() => handleProtocolSectionToggle(sectionId)}
              style={{
                background: isSelected ? '#3b82f6' : '#f3f4f6',
                color: isSelected ? 'white' : '#374151',
                border: '2px solid #d1d5db',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              title={isSelected ? 'Remove from selection' : 'Add to selection'}
            >
              {isSelected ? '✓' : '+'}
            </button>
            <h4 
              id={sectionId} 
              style={{ margin: 0, flex: 1 }}
          >
            {line}
          </h4>
          </div>
        );
      } else if (line.trim()) {
        // For other text content
        if (line.match(/^[A-Z][a-z]/) || line.match(/^\d+\.\d+/)) {
          // Possible subsection title
          sectionsMarkup.push(<h5 key={`subsection-${idx}`}>{line}</h5>);
        } else {
          // Regular paragraph
          sectionsMarkup.push(<p key={`p-${idx}`}>{line}</p>);
        }
      } else {
        // Empty line
        sectionsMarkup.push(<br key={`br-${idx}`} />);
      }
    });
    
    return sectionsMarkup;
  };

  // Function to identify clinical section sections and add IDs for navigation
  const renderClinicalSections = (content) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const sectionsMarkup = [];
    
    lines.forEach((line, idx) => {
      // Check if this is a main section header (starts with a number followed by period)
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
      
      if (sectionMatch && parseInt(sectionMatch[1]) >= 1 && parseInt(sectionMatch[1]) <= 10) {
        sectionsMarkup.push(
          <h4 
            key={`clinical-section-${idx}`} 
            id={`clinical-section-${sectionMatch[1]}`} 
            className="section-title"
          >
            {line}
          </h4>
        );
      } else if (line.trim()) {
        // For other text content
        if (line.match(/^[A-Z][a-z]/) || line.match(/^\d+\.\d+/)) {
          // Possible subsection title
          sectionsMarkup.push(<h5 key={`clinical-subsection-${idx}`} className="subsection-title">{line}</h5>);
        } else if (line.match(/^[•\-*]/)) {
          // List item
          sectionsMarkup.push(<li key={`li-${idx}`} className="list-item">{line.substring(1).trim()}</li>);
        } else {
          // Regular paragraph
          sectionsMarkup.push(<p key={`p-${idx}`}>{line}</p>);
        }
      } else {
        // Empty line
        sectionsMarkup.push(<br key={`br-${idx}`} />);
      }
    });
    
    return sectionsMarkup;
  };

  const updateSectionContent = (sectionId, content) => {
    setSectionEdits(prev => ({
      ...prev,
      [sectionId]: content
    }));
  };

  // Reference Protocol Panel Functions
  const handleReferenceProtocolSelect = (protocol) => {
    setSelectedReferenceProtocol(protocol);
    setShowReferencePanel(true);
    
    // Generate TOC for the selected protocol
    if (protocol.content) {
      const lines = protocol.content.split('\n');
      const toc = [];
      
      lines.forEach((line, index) => {
        const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
        if (sectionMatch && parseInt(sectionMatch[1]) >= 1 && parseInt(sectionMatch[1]) <= 10) {
          toc.push({
            id: `ref-section-${sectionMatch[1]}`,
            title: line,
            number: sectionMatch[1]
          });
        }
      });
      
      setReferenceProtocolTOC(toc);
      setSelectedReferenceSection(null);
      setSelectedReferenceSectionContent('');
    }
  };

  const handleReferenceSectionClick = (section) => {
    setSelectedReferenceSection(section);
    
    // Extract content for the selected section
    if (selectedReferenceProtocol && selectedReferenceProtocol.content) {
      const lines = selectedReferenceProtocol.content.split('\n');
      const sectionNumber = section.number;
      let inSection = false;
      let sectionContent = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
        
        if (sectionMatch && parseInt(sectionMatch[1]) === parseInt(sectionNumber)) {
          inSection = true;
          sectionContent.push(line);
        } else if (inSection && sectionMatch && parseInt(sectionMatch[1]) > parseInt(sectionNumber)) {
          break;
        } else if (inSection) {
          sectionContent.push(line);
        }
      }
      
      setSelectedReferenceSectionContent(sectionContent.join('\n'));
    }
  };

  const closeReferencePanel = () => {
    setShowReferencePanel(false);
    setSelectedReferenceProtocol(null);
    setReferenceProtocolTOC([]);
    setSelectedReferenceSection(null);
    setSelectedReferenceSectionContent('');
  };

  // Section Selection Handlers
  const handleProtocolSectionToggle = (sectionId) => {
    const newSelected = new Set(selectedProtocolSections);
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId);
      // Remove section content when deselected
      const newSectionEdits = { ...sectionEdits };
      delete newSectionEdits[sectionId];
      setSectionEdits(newSectionEdits);
    } else {
      newSelected.add(sectionId);
      // Initialize section content when selected
      const sectionContent = extractSectionContent(result?.protocol, sectionId);
      setSectionEdits(prev => ({
        ...prev,
        [sectionId]: sectionContent
      }));
    }
    setSelectedProtocolSections(newSelected);
  };

  const handleStudyDesignSectionToggle = (sectionId) => {
    const newSelected = new Set(selectedStudyDesignSections);
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId);
      // Remove section content when deselected
      const newSectionEdits = { ...sectionEdits };
      delete newSectionEdits[sectionId];
      setSectionEdits(newSectionEdits);
    } else {
      newSelected.add(sectionId);
      // Initialize section content when selected
      const sectionContent = extractStudyDesignSectionContent(studyDesign, sectionId);
      setSectionEdits(prev => ({
        ...prev,
        [sectionId]: sectionContent
      }));
    }
    setSelectedStudyDesignSections(newSelected);
  };

  // Content extraction functions
  const extractSectionContent = (content, sectionId) => {
    if (!content) return '';
    
    const lines = content.split('\n');
    const sectionNumber = sectionId.replace('protocol-section-', '');
    let inSection = false;
    let sectionContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
      
      if (sectionMatch && parseInt(sectionMatch[1]) === parseInt(sectionNumber)) {
        inSection = true;
        // Format the main section header with HTML
        sectionContent.push(`<h3 style="color: #1e40af; margin-bottom: 1rem; font-size: 1.25rem;">${line}</h3>`);
      } else if (inSection && sectionMatch && parseInt(sectionMatch[1]) > parseInt(sectionNumber)) {
        break;
      } else if (inSection) {
        // Check for subsections (like 2.1, 2.2, etc.)
        const subsectionMatch = line.match(/^(\d+)\.(\d+)\s+(.*)/i);
        if (subsectionMatch) {
          sectionContent.push(`<h4 style="color: #374151; margin: 1rem 0 0.5rem 0; font-size: 1.1rem;">${line}</h4>`);
        } else if (line.trim()) {
          // Regular paragraph content
          sectionContent.push(`<p style="margin: 0.5rem 0; line-height: 1.6;">${line}</p>`);
        } else {
          // Empty line
          sectionContent.push('<br>');
        }
      }
    }
    
    return sectionContent.join('');
  };

  const extractStudyDesignSectionContent = (content, sectionId) => {
    if (!content) return '';
    
    if (sectionId === 'cmc-section') {
      const cmcContent = content.cmc_section || '';
      const lines = cmcContent.split('\n');
      const formattedLines = lines.map(line => {
        if (line.match(/^[A-Z\s]{5,}$/)) {
          return `<h4 style="color: #1e40af; margin: 1rem 0 0.5rem 0; font-size: 1.1rem;">${line}</h4>`;
        } else if (line.trim()) {
          return `<p style="margin: 0.5rem 0; line-height: 1.6;">${line}</p>`;
        } else {
          return '<br>';
        }
      });
      return formattedLines.join('');
    }
    
    const lines = content.clinical_section ? content.clinical_section.split('\n') : [];
    const sectionNumber = sectionId.replace('clinical-section-', '');
    let inSection = false;
    let sectionContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sectionMatch = line.match(/^(\d+)\.\s+(.*)/i);
      
      if (sectionMatch && parseInt(sectionMatch[1]) === parseInt(sectionNumber)) {
        inSection = true;
        // Format the main section header with HTML
        sectionContent.push(`<h3 style="color: #1e40af; margin-bottom: 1rem; font-size: 1.25rem;">${line}</h3>`);
      } else if (inSection && sectionMatch && parseInt(sectionMatch[1]) > parseInt(sectionNumber)) {
        break;
      } else if (inSection) {
        // Check for subsections (like 2.1, 2.2, etc.)
        const subsectionMatch = line.match(/^(\d+)\.(\d+)\s+(.*)/i);
        if (subsectionMatch) {
          sectionContent.push(`<h4 style="color: #374151; margin: 1rem 0 0.5rem 0; font-size: 1.1rem;">${line}</h4>`);
        } else if (line.trim()) {
          // Regular paragraph content
          sectionContent.push(`<p style="margin: 0.5rem 0; line-height: 1.6;">${line}</p>`);
        } else {
          // Empty line
          sectionContent.push('<br>');
        }
      }
    }
    
    return sectionContent.join('');
  };

  // Individual section editing functions
  const startEditingSection = (sectionId) => {
    setEditingSectionId(sectionId);
    // Automatically enable AI when editing starts
    setAiEnabledSections(prev => {
      const newSet = new Set(prev);
      newSet.add(sectionId);
      return newSet;
    });
  };

  const saveSectionEdit = (sectionId, content) => {
    setSectionEdits(prev => ({
      ...prev,
      [sectionId]: content
    }));
    setEditingSectionId(null);
    // Keep AI enabled when saving (user can still toggle it)
  };

  const cancelSectionEdit = () => {
    setEditingSectionId(null);
    // Disable AI when editing is cancelled
    setAiEnabledSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(editingSectionId);
      return newSet;
    });
  };

  // Generate PDF for individual section
  const generateSectionPDF = async (sectionId, sectionTitle, sectionContent) => {
    try {
      setLoading(true);
      
      if (!sectionContent || sectionContent.trim() === '') {
        setError('No content to export');
        return;
      }
      
      // Create PDF document
      const doc = new jsPDF();
      
      // PDF settings
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const maxLineWidth = pageWidth - (margin * 2);
      const lineHeight = 7;
      const titleLineHeight = 10;
      
      // Document header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Protocol Section', pageWidth / 2, margin, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 10, { align: 'center' });
      doc.text(`Disease: ${disease}`, pageWidth / 2, margin + 17, { align: 'center' });
      
      let currentY = margin + 30;
      let currentPage = 1;
      
      // Section title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(sectionTitle, margin, currentY);
      currentY += titleLineHeight;
      
      // Section content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Convert HTML content to plain text and handle formatting
      const plainText = sectionContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      
      // Split content into lines that fit the page width
      const lines = doc.splitTextToSize(plainText, maxLineWidth);
      
      // Add lines with proper spacing
      lines.forEach(line => {
        // Check if we need a new page
        if (currentY > pageHeight - margin - 20) {
          doc.addPage();
          currentPage++;
          currentY = margin + 20;
        }
        
        doc.text(line, margin, currentY);
        currentY += lineHeight;
      });
      
      // Save the PDF
      const filename = `${sectionTitle.replace(/\s+/g, '_')}_${disease.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating section PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle AI for a specific section
  const toggleAIForSection = (sectionId) => {
    setAiEnabledSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="protocol-generator" style={{ position: 'relative' }}>
      <style>
        {`
          @keyframes successPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4); }
            100% { transform: scale(1.02); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
          }
        `}
      </style>
      {/* Ask Lumina Popup */}
      <AskLuminaPopup 
        isOpen={showAskLumina}
        onClose={() => setShowAskLumina(false)}
        contextData="Protocol Generation - Clinical Study Design"
      />

      {/* Professional Ask Lumina Floating Button */}
      <FloatingButton
        onClick={() => setShowAskLumina(true)}
        icon="AI"
        label="Ask Lumina™"
        variant="primary"
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Clinical Study Protocol Generator</h2>
          <p>Generate a complete clinical study protocol with enhanced trial design parameters</p>
          
        </div>
        <button onClick={handleShowPreviousProtocols} className="btn btn-outline">
          {showPreviousProtocols ? 'Hide Previous Protocols' : 'Previous Protocols'}
        </button>
      </div>
      {showPreviousProtocols && (
        <div style={{ background: '#f7fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Previous Documents</h4>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
            <button
              className={`btn btn-sm ${previousDocType === 'PROTOCOL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPreviousDocType('PROTOCOL')}
            >
              Protocols
            </button>
            <button
              className={`btn btn-sm ${previousDocType === 'STUDY_DESIGN' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPreviousDocType('STUDY_DESIGN')}
            >
              Study Designs
            </button>
          </div>
          <input
            type="text"
            className="form-input"
            placeholder={`Search by title or disease...`}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ marginBottom: '0.75rem' }}
          />
          {loadingPrevious ? <p>Loading...</p> : fetchError ? <p style={{ color: 'red' }}>{fetchError}</p> : (
            (() => {
              const filtered = previousProtocols.filter(doc =>
                doc.type === previousDocType &&
                (doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 doc.disease?.toLowerCase().includes(searchTerm.toLowerCase()))
              );
              const totalPages = Math.ceil(filtered.length / protocolsPerPage);
              const startIdx = (currentPage - 1) * protocolsPerPage;
              const paginated = filtered.slice(startIdx, startIdx + protocolsPerPage);
              return filtered.length === 0 ? <p>No previous documents found.</p> : (
                <>
                  <ul style={{ maxHeight: '200px', overflowY: 'auto', margin: 0, padding: 0 }}>
                    {paginated.map(doc => (
                      <li key={doc.id} style={{ marginBottom: '0.5rem', listStyle: 'none', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                        <strong>{doc.title}</strong> <span style={{ color: '#64748b', fontSize: '0.9em' }}>{doc.disease}</span>
                        <button style={{ marginLeft: '1rem', padding: '2px 8px', borderRadius: '4px', background: '#64748b', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85em' }} onClick={() => { setViewerDoc(doc); setViewerOpen(true); }}>
                          View
                        </button>
                        <button style={{ marginLeft: '0.5rem', padding: '2px 8px', borderRadius: '4px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.85em' }} onClick={() => handleReferenceProtocolSelect(doc)}>
                          Reference
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
          <DocumentViewer open={viewerOpen} onClose={() => setViewerOpen(false)} title={viewerDoc?.title} content={viewerDoc?.content} metadata={{ disease: viewerDoc?.disease, protocolId: viewerDoc?.protocolId, cmcSection: viewerDoc?.cmcSection, clinicalSection: viewerDoc?.clinicalSection }} />
        </div>
      )}
      
      {/* Reference Protocol Panel */}
      {showReferencePanel && selectedReferenceProtocol && (
        <div style={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '400px',
          maxHeight: '80vh',
          background: '#ffffff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f0f9ff'
          }}>
            <h4 style={{ margin: 0, color: '#1e40af', fontSize: '1rem' }}>
              📋 Reference Protocol
            </h4>
            <button
              onClick={closeReferencePanel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0'
              }}
            >
              ×
            </button>
          </div>
          
          {/* Protocol Info */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
              {selectedReferenceProtocol.title}
            </h5>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
              Disease: {selectedReferenceProtocol.disease}
            </p>
          </div>
          
          {/* Table of Contents */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Table of Contents</h6>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {referenceProtocolTOC.map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleReferenceSectionClick(section)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem',
                      margin: '0.25rem 0',
                      background: selectedReferenceSection?.id === section.id ? '#eff6ff' : 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: selectedReferenceSection?.id === section.id ? '#1e40af' : '#374151'
                    }}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Section Content */}
            {selectedReferenceSection && (
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                  {selectedReferenceSection.title}
                </h6>
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedReferenceSectionContent}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Dossier Type Selection */}
        <div className="form-section">
          <h3>Select Dossier Type</h3>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>
            Choose the type of dossier for which you want to generate a protocol
          </p>
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
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>📋</span>
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

        {/* Document Upload Section - Only show if dossier type is selected */}
        {selectedDossierType && (
          <div className="form-section">
            <h3>📁 Upload Documents</h3>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              Upload the required documents for your selected dossier type
            </p>
            <div 
              {...getRootProps()} 
              className={`dropzone ${isDragActive ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="Document upload area. Drag and drop files here or click to select files."
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.target.click();
                }
              }}
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
                Accepted formats: PDF, DOC, DOCX, XLS, XLSX, TXT
              </small>
            </div>

            {/* Document Categories Checklist */}
            <div className="document-checklist" style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                ✅ Required Documents Checklist
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem'
              }}>
                {documentCategories.map(cat => {
                  const status = getCategoryStatus(cat.id);
                  const uploadedCount = uploadedDocuments.filter(doc => doc.category === cat.id).length;
                  
                  return (
                    <div 
                      key={cat.id} 
                      data-category={cat.id}
                      className={`checklist-item ${status}`} 
                      onClick={() => handleChecklistItemClick(cat.id)}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        border: `2px solid ${status === 'missing' ? '#ef4444' : status === 'full' ? '#10b981' : '#e2e8f0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: status === 'full' ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: status === 'full' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        if (status === 'full') {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (status === 'full') {
                          e.target.style.transform = 'scale(1.02)';
                          e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                        }
                      }}
                    >
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
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  📚 Uploaded Documents ({uploadedDocuments.length})
                </h4>
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
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                          {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </div>
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
            <div className="compile-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                  ⚠️ Please upload all required documents and assign categories before compiling
                </p>
              )}
            </div>
          </div>
        )}

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
            
            <div className="form-group">
              <label htmlFor="population" className="form-label">Target Population</label>
              <input
                id="population"
                type="text"
                className="form-input"
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
                placeholder="e.g., Adults, Pediatric, Elderly"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="drugClass" className="form-label">Drug Class</label>
              <input
                id="drugClass"
                type="text"
                className="form-input"
                value={drugClass}
                onChange={(e) => setDrugClass(e.target.value)}
                placeholder="e.g., small molecule JAK inhibitor"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="mechanism" className="form-label">Mechanism of Action</label>
              <input
                id="mechanism"
                type="text"
                className="form-input"
                value={mechanism}
                onChange={(e) => setMechanism(e.target.value)}
                placeholder="e.g., Selectively inhibits JAK1 and JAK2"
              />
            </div>
          </div>
        </div>

        {/* Trial Design & Basics Section */}
        <div className="form-section">
          <h3>Trial Design & Basics</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="trialPhase" className="form-label">Trial Phase</label>
              <select
                id="trialPhase"
                className="form-select"
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
              <label htmlFor="controlGroupType">Control Group Type</label>
              <select
                id="controlGroupType"
                value={controlGroupType}
                onChange={(e) => setControlGroupType(e.target.value)}
              >
                <option value="">Select Control</option>
                {controlGroupTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Population & Eligibility Section */}
        <div className="form-section">
          <h3>Population & Eligibility</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="sampleSize">Target Sample Size</label>
              <input
                id="sampleSize"
                type="number"
                value={sampleSize}
                onChange={(e) => setSampleSize(e.target.value)}
                placeholder="e.g., 120"
                min="1"
              />
            </div>

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

        {/* Intervention & Drug Details Section */}
        <div className="form-section">
          <h3>Intervention & Drug Details</h3>
          <div className="form-grid">
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
              <label htmlFor="dosingFrequency">Dosing Frequency</label>
              <select
                id="dosingFrequency"
                value={dosingFrequency}
                onChange={(e) => setDosingFrequency(e.target.value)}
              >
                <option value="">Select Frequency</option>
                {dosingFrequencyOptions.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comparatorDrug">Comparator/Control Drug</label>
              <input
                id="comparatorDrug"
                type="text"
                value={comparatorDrug}
                onChange={(e) => setComparatorDrug(e.target.value)}
                placeholder="e.g., Placebo, Standard of care"
              />
            </div>

            <div className="form-group">
              <label htmlFor="treatment">Treatment Duration</label>
              <input
                id="treatment"
                type="text"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="e.g., 12 weeks, 6 months"
              />
            </div>
          </div>
        </div>

        {/* Endpoints & Outcome Measures Section */}
        <div className="form-section">
          <h3>Endpoints & Outcome Measures</h3>
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
              <label htmlFor="outcomeMeasurementTool">Outcome Measurement Tool</label>
              <select
                id="outcomeMeasurementTool"
                value={outcomeMeasurementTool}
                onChange={(e) => setOutcomeMeasurementTool(e.target.value)}
              >
                <option value="">Select Measurement Tool</option>
                {outcomeMeasurementTools.map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Statistics & Duration Section */}
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

            <div className="form-group">
              <label htmlFor="studyDuration">Estimated Study Duration</label>
              <input
                id="studyDuration"
                type="text"
                value={studyDuration}
                onChange={(e) => setStudyDuration(e.target.value)}
                placeholder="e.g., 18 months total (12 weeks treatment + 6 months follow-up)"
              />
            </div>
          </div>
        </div>

        {/* Clinical Study Information */}
        <div className="form-group full-width">
          <label htmlFor="clinicalInfo">Additional Clinical Study Information</label>
          <textarea
            id="clinicalInfo"
            value={clinicalInfo}
            onChange={(e) => setClinicalInfo(e.target.value)}
            placeholder="e.g., Previous clinical data, specific assessment methods, biomarker strategies, special populations, regulatory considerations..."
            rows="4"
            className="clinical-info-textarea"
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit"
            disabled={loading || !disease}
            className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
          >
            {loading ? 'Generating...' : 'Generate Enhanced Protocol'}
          </button>
          
          {loading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <p>Generating comprehensive protocol with all specified parameters...</p>
            </div>
          )}
        </div>
      </form>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {showGeneratedInfo && (
        <div className="success-message">
          <i className="icon-success"></i>
          <p>Enhanced protocol documentation successfully generated with all trial design parameters!</p>
        </div>
      )}
      
      {(result || studyDesign) && (
        <div className="result-container" id="results-section">
          <div className="document-tabs">
            <button 
              className={`tab-btn ${activeTab === 'protocol' ? 'active' : ''}`}
              onClick={() => setActiveTab('protocol')}
            >
              Enhanced Protocol
            </button>
            <button 
              className={`tab-btn ${activeTab === 'studyDesign' ? 'active' : ''}`}
              onClick={() => setActiveTab('studyDesign')}
            >
              Study Design
            </button>
          </div>
          
          {activeTab === 'protocol' && result && (
            <div className="document-content" id="protocol-document">
              <div className="document-header">
                <h3>Enhanced Protocol</h3>
                <div className="document-meta">
                  <span>Protocol ID: {result.protocol_id}</span>
                  <span>Version: 1.0</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="document-navigation">
                <h5>Table of Contents</h5>
                <ul>
                  {protocolSections.map(section => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({behavior: 'smooth'});
                      }}>
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="protocol-content">
                {renderProtocolSections(result.protocol)}
              </div>
              
              {/* Selected Sections Display */}
              {(selectedProtocolSections.size > 0 || selectedStudyDesignSections.size > 0) && (
                <div style={{ 
                  marginTop: '2rem', 
                  padding: '1rem', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '8px', 
                  backgroundColor: '#f0f9ff' 
                }}>
                  {/* Header with Reference Protocol Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '1rem' 
                  }}>
                    <h4 style={{ margin: 0, color: '#1e40af' }}>
                      Individual Editable Sections ({activeTab === 'protocol' ? selectedProtocolSections.size : selectedStudyDesignSections.size})
                    </h4>
                    <button
                      onClick={() => setShowReferencePanel(!showReferencePanel)}
                      style={{
                        background: showReferencePanel ? '#ef4444' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {showReferencePanel ? '✕' : '📋'} 
                      {showReferencePanel ? 'Close Reference' : 'Open Reference Protocol'}
                    </button>
                  </div>
                  
                  {/* Main Content Area with Side-by-Side Layout */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem',
                    alignItems: 'flex-start'
                  }}>
                    {/* Editable Sections */}
                    <div style={{ 
                      flex: showReferencePanel ? '1' : '1',
                      minWidth: showReferencePanel ? '50%' : '100%'
                    }}>
                      {Array.from(selectedProtocolSections)
                        .sort((a, b) => {
                          const aNum = parseInt(a.replace('protocol-section-', ''));
                          const bNum = parseInt(b.replace('protocol-section-', ''));
                          return aNum - bNum;
                        })
                        .map(sectionId => {
                        const sectionNumber = sectionId.replace('protocol-section-', '');
                        const sectionTitle = protocolSections.find(s => s.id === sectionId)?.title || `Section ${sectionNumber}`;
                        const isEditingThis = editingSectionId === sectionId;
                        const sectionContent = sectionEdits[sectionId] || '';
                        
                        return (
                          <div key={sectionId} style={{ 
                            marginBottom: '1.5rem', 
                            padding: '1rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '6px', 
                            backgroundColor: '#ffffff' 
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              marginBottom: '0.5rem' 
                            }}>
                              <h5 style={{ margin: 0, color: '#374151' }}>{sectionTitle}</h5>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {!isEditingThis ? (
                                  <>
                                    <button
                                      onClick={() => startEditingSection(sectionId)}
                                      style={{
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => generateSectionPDF(sectionId, sectionTitle, sectionContent)}
                                      style={{
                                        background: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      PDF
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => saveSectionEdit(sectionId, sectionContent)}
                                      style={{
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelSectionEdit}
                                      style={{
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {isEditingThis ? (
                              <RichTextEditor
                                value={sectionContent}
                                onChange={(content) => updateSectionContent(sectionId, content)}
                                placeholder={`Edit ${sectionTitle} content here...`}
                                style={{
                                  width: '100%',
                                  minHeight: '150px'
                                }}
                                aiEnabled={aiEnabledSections.has(sectionId)}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  minHeight: '100px',
                                  padding: '0.75rem',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  backgroundColor: '#f9fafb',
                                  fontFamily: 'inherit',
                                  fontSize: '14px',
                                  lineHeight: '1.5',
                                  overflowY: 'auto',
                                  whiteSpace: 'pre-wrap'
                                }}
                                dangerouslySetInnerHTML={{ __html: sectionContent }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Reference Protocol Panel */}
                    {showReferencePanel && (
                      <div style={{ 
                        width: '400px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '1rem'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Reference Protocol</h5>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Select a reference protocol from the previous protocols list to view it here.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Download All Selected Sections */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <button 
                      onClick={() => {
                        const allContent = Object.values(sectionEdits).join('\n\n---\n\n');
                        downloadDocument(allContent, `All_Selected_Sections_${disease.replace(/\s+/g, '_')}.txt`);
                      }}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download Text
                    </button>
                    <button 
                      onClick={generateSelectedSectionsWord}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📝 Download Word Document
                    </button>
                    <button 
                      onClick={generateSelectedSectionsPDF}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download PDF Document
                    </button>
                    <button 
                      onClick={() => {
                        const allContent = Object.values(sectionEdits).join('\n\n---\n\n');
                        navigator.clipboard.writeText(allContent);
                      }}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📋 Copy All to Clipboard
                    </button>
                  </div>
                </div>
              )}
              
              <div className="action-buttons">
                <button onClick={() => navigator.clipboard.writeText(result.protocol)}>
                  <i className="icon-copy"></i> Copy to Clipboard
                </button>
                <button onClick={() => downloadDocument(result.protocol, `Enhanced_Protocol_${disease.replace(/\s+/g, '_')}_${result.protocol_id}.txt`)}>
                  <i className="icon-download"></i> Download Text
                </button>
                <button onClick={() => generatePDF('protocol', `Enhanced_Protocol_${disease.replace(/\s+/g, '_')}_${result.protocol_id}`)}>
                  <i className="icon-pdf"></i> Download PDF
                </button>
                <button onClick={() => generateFullProtocolWord()}>
                  <i className="icon-word"></i> Download Word
                </button>
                <button onClick={() => window.print()}>
                  <i className="icon-print"></i> Print
                </button>
                <button className="btn-secondary" onClick={() => window.open(`mailto:?subject=Enhanced Protocol for ${disease}&body=${encodeURIComponent(result.protocol)}`)}>
                  <i className="icon-email"></i> Email
                </button>
              </div>
              
              <div className="protocol-info">
                Document Generated: {new Date().toLocaleString()} | Protocol ID: {result.protocol_id}
              </div>
            </div>
          )}
          
          {activeTab === 'studyDesign' && studyDesign && (
            <div className="document-content" id="studydesign-document">
              <div className="document-header">
                <h3>Enhanced Study Design</h3>
                <div className="document-meta">
                  <span>Study ID: SD-{result ? result.protocol_id.substring(5) : Date.now()}</span>
                  <span>Version: 1.0</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="document-navigation">
                <h5>Table of Contents</h5>
                <ul>
                  {studyDesignSections.map(section => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({behavior: 'smooth'});
                      }}>
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="study-design-content">
                <div id="cmc-section" className="study-design-section">
                  <h4 className="main-section-title">CMC SECTION</h4>
                  <div className="section-content">
                    {studyDesign.cmc_section.split('\n').map((paragraph, idx) => (
                      paragraph.trim() ? 
                        paragraph.match(/^[A-Z\s]{5,}$/) ? 
                          <h4 key={idx} className="section-title">{paragraph}</h4> :
                        paragraph.match(/^[0-9]+\.[0-9]/) || paragraph.match(/^[A-Z][a-z]/) ?
                          <h5 key={idx} className="subsection-title">{paragraph}</h5> :
                        paragraph.match(/^[•\-*]/) ?
                          <li key={idx} className="list-item">{paragraph.substring(1).trim()}</li> :
                          <p key={idx}>{paragraph}</p>
                      : <br key={idx} />
                    ))}
                  </div>
                </div>
                
                <div className="study-design-section clinical-section">
                  <div className="section-content">
                    {renderClinicalSections(studyDesign.clinical_section)}
                  </div>
                </div>
              </div>

              {/* Study Design Section Selection */}
              <div style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                border: '2px solid #3b82f6', 
                borderRadius: '8px', 
                backgroundColor: '#f0f9ff' 
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
                  Select Study Design Sections for Editing
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {studyDesignSections.map(section => (
                    <div key={section.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      marginBottom: '10px',
                      padding: '8px',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s'
                    }}>
                      <button
                        onClick={() => handleStudyDesignSectionToggle(section.id)}
                        style={{
                          background: selectedStudyDesignSections.has(section.id) ? '#3b82f6' : '#f3f4f6',
                          color: selectedStudyDesignSections.has(section.id) ? 'white' : '#374151',
                          border: '2px solid #d1d5db',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease'
                        }}
                        title={selectedStudyDesignSections.has(section.id) ? 'Remove from selection' : 'Add to selection'}
                      >
                        {selectedStudyDesignSections.has(section.id) ? '✓' : '+'}
                      </button>
                      <h4 
                        id={section.id} 
                        style={{ margin: 0, flex: 1 }}
                      >
                        {section.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Editable Study Design Sections */}
              {(selectedStudyDesignSections.size > 0) && (
                <div style={{ 
                  marginTop: '2rem', 
                  padding: '1rem', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '8px', 
                  backgroundColor: '#f0f9ff' 
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
                    Individual Editable Study Design Sections ({selectedStudyDesignSections.size})
                  </h4>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem',
                    alignItems: 'flex-start'
                  }}>
                    {/* Editable Study Design Sections */}
                    <div style={{ 
                      flex: '1',
                      minWidth: '100%'
                    }}>
                      {Array.from(selectedStudyDesignSections)
                        .sort((a, b) => {
                          // Handle cmc-section (should come first)
                          if (a === 'cmc-section') return -1;
                          if (b === 'cmc-section') return 1;
                          
                          // Handle clinical-section-X
                          const aNum = parseInt(a.replace('clinical-section-', ''));
                          const bNum = parseInt(b.replace('clinical-section-', ''));
                          return aNum - bNum;
                        })
                        .map(sectionId => {
                        const sectionNumber = sectionId === 'cmc-section' ? 'CMC' : sectionId.replace('clinical-section-', '');
                        const sectionTitle = studyDesignSections.find(s => s.id === sectionId)?.title || `Study Design Section ${sectionNumber}`;
                        const isEditingThis = editingSectionId === sectionId;
                        const sectionContent = sectionEdits[sectionId] || '';
                        
                        return (
                          <div key={sectionId} style={{ 
                            marginBottom: '1.5rem', 
                            padding: '1rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '6px', 
                            backgroundColor: '#ffffff' 
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              marginBottom: '0.5rem' 
                            }}>
                              <h5 style={{ margin: 0, color: '#374151' }}>{sectionTitle}</h5>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {!isEditingThis ? (
                                  <>
                                    <button
                                      onClick={() => startEditingSection(sectionId)}
                                      style={{
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => generateSectionPDF(sectionId, sectionTitle, sectionContent)}
                                      style={{
                                        background: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      PDF
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => saveSectionEdit(sectionId, sectionContent)}
                                      style={{
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelSectionEdit}
                                      style={{
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {isEditingThis ? (
                              <RichTextEditor
                                value={sectionContent}
                                onChange={(content) => updateSectionContent(sectionId, content)}
                                placeholder={`Edit ${sectionTitle} content here...`}
                                style={{
                                  width: '100%',
                                  minHeight: '150px'
                                }}
                                aiEnabled={aiEnabledSections.has(sectionId)}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  minHeight: '100px',
                                  padding: '0.75rem',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  backgroundColor: '#f9fafb',
                                  fontFamily: 'inherit',
                                  fontSize: '14px',
                                  lineHeight: '1.5',
                                  overflowY: 'auto',
                                  whiteSpace: 'pre-wrap'
                                }}
                                dangerouslySetInnerHTML={{ __html: sectionContent }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Download All Selected Study Design Sections */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <button 
                      onClick={() => {
                        const allContent = Object.values(sectionEdits).join('\n\n---\n\n');
                        downloadDocument(allContent, `All_Selected_Study_Design_Sections_${disease.replace(/\s+/g, '_')}.txt`);
                      }}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download Text
                    </button>
                    <button 
                      onClick={generateSelectedSectionsWord}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📝 Download Word Document
                    </button>
                    <button 
                      onClick={generateSelectedSectionsPDF}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download PDF Document
                    </button>
                    <button 
                      onClick={() => {
                        const allContent = Object.values(sectionEdits).join('\n\n---\n\n');
                        navigator.clipboard.writeText(allContent);
                      }}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📋 Copy All to Clipboard
                    </button>
                  </div>
                </div>
              )}
              
              {/* Selected Sections Display - Enhanced like Protocol (Protocol Tab Only) */}
              {(selectedProtocolSections.size > 0) && activeTab === 'protocol' && (
                <div style={{ 
                  marginTop: '2rem', 
                  padding: '1rem', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '8px', 
                  backgroundColor: '#f0f9ff' 
                }}>
                  {/* Header with Reference Protocol Button */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '1rem' 
                  }}>
                    <h4 style={{ margin: 0, color: '#1e40af' }}>
                      Individual Editable Sections ({activeTab === 'protocol' ? selectedProtocolSections.size : selectedStudyDesignSections.size})
                    </h4>
                    <button
                      onClick={() => setShowReferencePanel(!showReferencePanel)}
                      style={{
                        background: showReferencePanel ? '#ef4444' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {showReferencePanel ? '✕' : '📋'} 
                      {showReferencePanel ? 'Close Reference' : 'Open Reference Protocol'}
                    </button>
                  </div>
                  
                  {/* Main Content Area with Side-by-Side Layout */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '1rem',
                    alignItems: 'flex-start'
                  }}>
                    {/* Editable Sections */}
                    <div style={{ 
                      flex: showReferencePanel ? '1' : '1',
                      minWidth: showReferencePanel ? '50%' : '100%'
                    }}>
                      {activeTab === 'protocol' ? (
                        Array.from(selectedProtocolSections)
                          .sort((a, b) => {
                            const aNum = parseInt(a.replace('protocol-section-', ''));
                            const bNum = parseInt(b.replace('protocol-section-', ''));
                            return aNum - bNum;
                          })
                          .map(sectionId => {
                          const sectionNumber = sectionId.replace('protocol-section-', '');
                          const sectionTitle = protocolSections.find(s => s.id === sectionId)?.title || `Section ${sectionNumber}`;
                          const isEditingThis = editingSectionId === sectionId;
                          const sectionContent = sectionEdits[sectionId] || '';
                          
                          return (
                            <div key={sectionId} style={{ 
                              marginBottom: '1.5rem', 
                              padding: '1rem', 
                              border: '1px solid #d1d5db', 
                              borderRadius: '6px', 
                              backgroundColor: '#ffffff' 
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: '0.5rem' 
                              }}>
                                <h5 style={{ margin: 0, color: '#374151' }}>{sectionTitle}</h5>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {!isEditingThis ? (
                                    <>
                                      <button
                                        onClick={() => startEditingSection(sectionId)}
                                        style={{
                                          background: '#10b981',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => generateSectionPDF(sectionId, sectionTitle, sectionContent)}
                                        style={{
                                          background: '#dc2626',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        PDF
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => saveSectionEdit(sectionId, sectionContent)}
                                        style={{
                                          background: '#3b82f6',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelSectionEdit}
                                        style={{
                                          background: '#6b7280',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {isEditingThis ? (
                                <RichTextEditor
                                  value={sectionContent}
                                  onChange={(content) => updateSectionContent(sectionId, content)}
                                  placeholder={`Edit ${sectionTitle} content here...`}
                                  style={{
                                    width: '100%',
                                    minHeight: '150px'
                                  }}
                                  aiEnabled={aiEnabledSections.has(sectionId)}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '0.75rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    backgroundColor: '#f9fafb',
                                    fontFamily: 'inherit',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap'
                                  }}
                                  dangerouslySetInnerHTML={{ __html: sectionContent }}
                                />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        Array.from(selectedStudyDesignSections)
                          .sort((a, b) => {
                            // Handle cmc-section (should come first)
                            if (a === 'cmc-section') return -1;
                            if (b === 'cmc-section') return 1;
                            
                            // Handle clinical-section-X
                            const aNum = parseInt(a.replace('clinical-section-', ''));
                            const bNum = parseInt(b.replace('clinical-section-', ''));
                            return aNum - bNum;
                          })
                          .map(sectionId => {
                          const sectionNumber = sectionId === 'cmc-section' ? 'CMC' : sectionId.replace('clinical-section-', '');
                          const sectionTitle = studyDesignSections.find(s => s.id === sectionId)?.title || `Study Design Section ${sectionNumber}`;
                          const isEditingThis = editingSectionId === sectionId;
                          const sectionContent = sectionEdits[sectionId] || '';
                          
                          return (
                            <div key={sectionId} style={{ 
                              marginBottom: '1.5rem', 
                              padding: '1rem', 
                              border: '1px solid #d1d5db', 
                              borderRadius: '6px', 
                              backgroundColor: '#ffffff' 
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginBottom: '0.5rem' 
                              }}>
                                <h5 style={{ margin: 0, color: '#374151' }}>{sectionTitle}</h5>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {!isEditingThis ? (
                                    <>
                                      <button
                                        onClick={() => startEditingSection(sectionId)}
                                        style={{
                                          background: '#10b981',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => generateSectionPDF(sectionId, sectionTitle, sectionContent)}
                                        style={{
                                          background: '#dc2626',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        PDF
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => saveSectionEdit(sectionId, sectionContent)}
                                        style={{
                                          background: '#3b82f6',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelSectionEdit}
                                        style={{
                                          background: '#6b7280',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          fontSize: '12px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {isEditingThis ? (
                                <RichTextEditor
                                  value={sectionContent}
                                  onChange={(content) => updateSectionContent(sectionId, content)}
                                  placeholder={`Edit ${sectionTitle} content here...`}
                                  style={{
                                    width: '100%',
                                    minHeight: '150px'
                                  }}
                                  aiEnabled={aiEnabledSections.has(sectionId)}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '0.75rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    backgroundColor: '#f9fafb',
                                    fontFamily: 'inherit',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap'
                                  }}
                                  dangerouslySetInnerHTML={{ __html: sectionContent }}
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Reference Protocol Panel */}
                    {showReferencePanel && (
                      <div style={{ 
                        width: '400px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '1rem'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Reference Protocol</h5>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Select a reference protocol from the previous protocols list to view it here.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Download All Selected Sections */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <button 
                      onClick={() => {
                        const allContent = Object.values(sectionEdits).join('\n\n---\n\n');
                        downloadDocument(allContent, `All_Selected_Sections_${disease.replace(/\s+/g, '_')}.txt`);
                      }}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download Text
                    </button>
                    <button 
                      onClick={generateSelectedSectionsWord}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📝 Download Word Document
                    </button>
                    <button 
                      onClick={generateSelectedSectionsPDF}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download PDF Document
                    </button>
                    <button 
                      onClick={() => {
                        const allContent = Object.values(sectionEdits).join('\n\n---\n\n');
                        navigator.clipboard.writeText(allContent);
                      }}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📋 Copy All to Clipboard
                    </button>
                  </div>
                </div>
              )}
              
              <div className="action-buttons">
                <button onClick={() => navigator.clipboard.writeText(
                  `CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`
                )}>
                  <i className="icon-copy"></i> Copy to Clipboard
                </button>
                <button onClick={() => downloadDocument(
                  `CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`,
                  `Enhanced_Study_Design_${disease.replace(/\s+/g, '_')}.txt`
                )}>
                  <i className="icon-download"></i> Download Text
                </button>
                <button onClick={() => generatePDF('studyDesign', `Enhanced_Study_Design_${disease.replace(/\s+/g, '_')}`)}>
                  <i className="icon-pdf"></i> Download PDF
                </button>
                <button onClick={() => generateFullStudyDesignWord()}>
                  <i className="icon-word"></i> Download Word
                </button>
                <button onClick={() => window.print()}>
                  <i className="icon-print"></i> Print
                </button>
                <button className="btn-secondary" onClick={() => window.open(`mailto:?subject=Enhanced Study Design for ${disease}&body=${encodeURIComponent(`CMC SECTION:\n${studyDesign.cmc_section}\n\nCLINICAL SECTION:\n${studyDesign.clinical_section}`)}`)}>
                  <i className="icon-email"></i> Email
                </button>
              </div>
              
              <div className="document-footer">
                <p>This enhanced document was generated with comprehensive trial design parameters according to ICH E6(R2) Good Clinical Practice guidelines and meets professional industry standards.</p>
                <p>Document Generated: {new Date().toLocaleString()} | Study ID: SD-{result ? result.protocol_id.substring(5) : Date.now()}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProtocolGenerator;