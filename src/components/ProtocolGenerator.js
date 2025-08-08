import React, { useState, useEffect } from 'react';
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

  // Removed auto-population from localStorage

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
      
      // Add protocol sections
      Array.from(selectedProtocolSections).forEach(sectionId => {
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
      
      // Add study design sections
      Array.from(selectedStudyDesignSections).forEach(sectionId => {
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
      
      // Add protocol sections
      Array.from(selectedProtocolSections).forEach(sectionId => {
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
      
      // Add study design sections
      Array.from(selectedStudyDesignSections).forEach(sectionId => {
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
  };

  const saveSectionEdit = (sectionId, content) => {
    setSectionEdits(prev => ({
      ...prev,
      [sectionId]: content
    }));
    setEditingSectionId(null);
  };

  const cancelSectionEdit = () => {
    setEditingSectionId(null);
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

  return (
    <div className="protocol-generator" style={{ position: 'relative' }}>
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
                      {activeTab === 'protocol' ? (
                        Array.from(selectedProtocolSections).map(sectionId => {
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
                        <div>Study Design sections will appear here</div>
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
                <h3>Study Design (Main Document)</h3>
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