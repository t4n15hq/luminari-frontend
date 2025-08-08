// src/components/UnifiedRegulatoryGenerator.js
// NEW UNIFIED REGULATORY DOCUMENT GENERATOR - TEST VERSION

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import apiService from '../services/api';
import { saveDocument, fetchDocuments } from '../services/api';
import { useBackgroundJobs } from '../hooks/useBackgroundJobs';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import './UnifiedRegulatoryGenerator.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const UnifiedRegulatoryGenerator = () => {
  // Mode Management
  const [mode, setMode] = useState('single'); // 'single' or 'batch'

  // Interactive Map Data and State
  const regionCountryMap = {
    'north-america': ["United States", "Canada", "Mexico"],
    'europe': ["United Kingdom", "France", "Germany", "Italy", "Spain", "Switzerland", "Russia", "European Union"],
    'asia-pacific': ["Japan", "China", "South Korea", "Australia", "Singapore", "India", "Taiwan"],
    'latin-america': ["Brazil", "Argentina", "Colombia", "Chile", "Peru", "Mexico"],
    'africa-middle-east': ["South Africa", "Israel", "Saudi Arabia", "United Arab Emirates", "Egypt", "Nigeria"]
  };

  const regionColors = {
    'north-america': '#4299e1',
    'europe': '#48bb78',
    'asia-pacific': '#ed8936',
    'latin-america': '#9f7aea',
    'africa-middle-east': '#e53e3e'
  };

  const regionNameMap = {
    'north-america': 'North America',
    'europe': 'Europe',
    'asia-pacific': 'Asia Pacific',
    'latin-america': 'Latin America',
    'africa-middle-east': 'Africa & Middle East'
  };

  const regionCentroids = {
    'north-america': [-100, 45],
    'europe': [15, 50],
    'asia-pacific': [110, 20],
    'latin-america': [-60, -15],
    'africa-middle-east': [30, 10]
  };

  // Comprehensive regulatory regions data
  const regions = {
    "north-america": {
      name: "North America",
      countries: [
        { 
          id: "usa", 
          name: "United States", 
          documents: [
            { id: "ind", name: "IND (Investigational New Drug)", purpose: "To begin clinical trials (Phases I-III)" },
            { id: "nda", name: "NDA (New Drug Application)", purpose: "To request approval for marketing a new drug" },
            { id: "bla", name: "BLA (Biologics License Application)", purpose: "For biologics approval under the Public Health Service Act" }
          ], 
          coords: { x: 150, y: 100 } 
        },
        { 
          id: "canada", 
          name: "Canada", 
          documents: [
            { id: "cta_ca", name: "Clinical Trial Application (Health Canada)", purpose: "To authorize clinical trials in Canada" },
            { id: "nds", name: "New Drug Submission (NDS)", purpose: "For drug approval in Canada" },
            { id: "noc", name: "Notice of Compliance (NOC)", purpose: "Canadian marketing authorization" }
          ], 
          coords: { x: 200, y: 80 } 
        },
        { 
          id: "mexico", 
          name: "Mexico", 
          documents: [
            { id: "cofepris_cta", name: "COFEPRIS Clinical Trial Authorization", purpose: "Mexican clinical trial approval" },
            { id: "cofepris_nda", name: "COFEPRIS New Drug Registration", purpose: "Mexican marketing authorization" }
          ], 
          coords: { x: 120, y: 140 } 
        }
      ],
      color: "#4299e1",
      coords: { x: 180, y: 120 }
    },
    "europe": {
      name: "Europe", 
      countries: [
        { 
          id: "eu", 
          name: "European Union", 
          documents: [
            { id: "cta_eu", name: "CTA (Clinical Trial Application)", purpose: "To authorize clinical trials via CTIS" },
            { id: "maa", name: "MAA (Marketing Authorization Application)", purpose: "To request EU-wide marketing approval" },
            { id: "impd", name: "IMPD (Investigational Medicinal Product Dossier)", purpose: "Quality, manufacturing and control information" }
          ], 
          coords: { x: 480, y: 110 } 
        },
        { 
          id: "uk", 
          name: "United Kingdom", 
          documents: [
            { id: "cta_uk", name: "Clinical Trial Authorisation (UK)", purpose: "MHRA clinical trial approval post-Brexit" },
            { id: "ma_uk", name: "Marketing Authorisation (UK)", purpose: "MHRA marketing approval" },
            { id: "vie", name: "Voluntary Scheme for Branded Medicines Pricing", purpose: "UK pricing and access" }
          ], 
          coords: { x: 440, y: 95 } 
        },
        { 
          id: "switzerland", 
          name: "Switzerland", 
          documents: [
            { id: "cta_ch", name: "Clinical Trial Authorisation (Swissmedic)", purpose: "Swiss clinical trial approval" },
            { id: "ma_ch", name: "Marketing Authorisation (Switzerland)", purpose: "Swissmedic drug approval" }
          ], 
          coords: { x: 485, y: 105 } 
        },
        { 
          id: "russia", 
          name: "Russia", 
          documents: [
            { id: "cta_ru", name: "Clinical Trial Permit (Roszdravnadzor)", purpose: "Russian clinical trial authorization" },
            { id: "rd_ru", name: "Registration Dossier (Russia)", purpose: "Russian drug registration with Roszdravnadzor" },
            { id: "gmp_ru", name: "Russian GMP Certificate", purpose: "Manufacturing authorization in Russia" }
          ], 
          coords: { x: 580, y: 90 } 
        }
      ],
      color: "#48bb78",
      coords: { x: 500, y: 110 }
    },
    "asia-pacific": {
      name: "Asia Pacific",
      countries: [
        { 
          id: "japan", 
          name: "Japan", 
          documents: [
            { id: "ctn_jp", name: "Clinical Trial Notification (CTN)", purpose: "Submitted to PMDA before clinical trials" },
            { id: "jnda", name: "J-NDA (New Drug Application)", purpose: "Submitted to PMDA/MHLW for approval" },
            { id: "pmda_consultation", name: "PMDA Scientific Advice", purpose: "Regulatory guidance consultation" }
          ], 
          coords: { x: 720, y: 110 } 
        },
        { 
          id: "china", 
          name: "China", 
          documents: [
            { id: "ind_ch", name: "IND (China)", purpose: "Required before clinical trials (submitted to NMPA)" },
            { id: "nda_ch", name: "NDA (China)", purpose: "New Drug Application submitted to NMPA" },
            { id: "drug_license_ch", name: "Drug Registration Certificate", purpose: "Chinese marketing authorization" }
          ], 
          coords: { x: 650, y: 120 } 
        },
        { 
          id: "south-korea", 
          name: "South Korea", 
          documents: [
            { id: "ind_kr", name: "IND (Korea)", purpose: "Korean clinical trial application to MFDS" },
            { id: "nda_kr", name: "NDA (Korea)", purpose: "Korean marketing authorization application" },
            { id: "kgmp", name: "Korean GMP Certificate", purpose: "Manufacturing authorization in Korea" }
          ], 
          coords: { x: 700, y: 115 } 
        },
        { 
          id: "australia", 
          name: "Australia", 
          documents: [
            { id: "ctn_au", name: "CTN (Clinical Trial Notification)", purpose: "Australian clinical trial notification to TGA" },
            { id: "aus", name: "AUS (Australian Submission)", purpose: "TGA marketing authorization" },
            { id: "tga_gmp", name: "TGA GMP Certificate", purpose: "Australian manufacturing authorization" }
          ], 
          coords: { x: 750, y: 200 } 
        },
        { 
          id: "singapore", 
          name: "Singapore", 
          documents: [
            { id: "cta_sg", name: "Clinical Trial Certificate (HSA)", purpose: "Singapore clinical trial approval" },
            { id: "product_license_sg", name: "Product License (Singapore)", purpose: "HSA marketing authorization" }
          ], 
          coords: { x: 680, y: 160 } 
        },
        { 
          id: "india", 
          name: "India", 
          documents: [
            { id: "cta_in", name: "Clinical Trial Permission (CDSCO)", purpose: "Indian clinical trial approval" },
            { id: "nda_in", name: "New Drug Application (India)", purpose: "CDSCO marketing authorization" },
            { id: "import_license_in", name: "Import License", purpose: "Import authorization for clinical trials" }
          ], 
          coords: { x: 620, y: 140 } 
        },
        { 
          id: "taiwan", 
          name: "Taiwan", 
          documents: [
            { id: "ind_tw", name: "IND (Taiwan)", purpose: "Taiwan clinical trial application to TFDA" },
            { id: "nda_tw", name: "NDA (Taiwan)", purpose: "Taiwan marketing authorization" }
          ], 
          coords: { x: 705, y: 130 } 
        }
      ],
      color: "#ed8936",
      coords: { x: 680, y: 150 }
    },
    "latin-america": {
      name: "Latin America",
      countries: [
        { 
          id: "brazil", 
          name: "Brazil", 
          documents: [
            { id: "anvisa_cta", name: "ANVISA Clinical Trial Authorization", purpose: "Brazilian clinical trial approval" },
            { id: "anvisa_nda", name: "ANVISA Registration Dossier", purpose: "Brazilian drug registration" },
            { id: "anvisa_gmp", name: "ANVISA GMP Certificate", purpose: "Brazilian manufacturing authorization" }
          ], 
          coords: { x: 280, y: 190 } 
        },
        { 
          id: "argentina", 
          name: "Argentina", 
          documents: [
            { id: "anmat_cta", name: "ANMAT Clinical Trial Authorization", purpose: "Argentine clinical trial approval" },
            { id: "anmat_nda", name: "ANMAT Drug Registration", purpose: "Argentine marketing authorization" }
          ], 
          coords: { x: 260, y: 240 } 
        },
        { 
          id: "colombia", 
          name: "Colombia", 
          documents: [
            { id: "invima_cta", name: "INVIMA Clinical Trial Permit", purpose: "Colombian clinical trial authorization" },
            { id: "invima_nda", name: "INVIMA Drug Registration", purpose: "Colombian marketing approval" }
          ], 
          coords: { x: 220, y: 170 } 
        },
        { 
          id: "chile", 
          name: "Chile", 
          documents: [
            { id: "isp_cta", name: "ISP Clinical Trial Authorization", purpose: "Chilean clinical trial approval" },
            { id: "isp_nda", name: "ISP Drug Registration", purpose: "Chilean marketing authorization" }
          ], 
          coords: { x: 240, y: 250 } 
        }
      ],
      color: "#9f7aea",
      coords: { x: 250, y: 200 }
    },
    "africa-middle-east": {
      name: "Africa & Middle East",
      countries: [
        { 
          id: "south-africa", 
          name: "South Africa", 
          documents: [
            { id: "sahpra_cta", name: "SAHPRA Clinical Trial Authorization", purpose: "South African clinical trial approval" },
            { id: "sahpra_nda", name: "SAHPRA Medicine Registration", purpose: "South African marketing authorization" }
          ], 
          coords: { x: 520, y: 230 } 
        },
        { 
          id: "israel", 
          name: "Israel", 
          documents: [
            { id: "moh_israel_cta", name: "Israeli MOH Clinical Trial Permit", purpose: "Israeli clinical trial approval" },
            { id: "moh_israel_nda", name: "Israeli Drug Registration", purpose: "Israeli marketing authorization" }
          ], 
          coords: { x: 510, y: 140 } 
        },
        { 
          id: "saudi-arabia", 
          name: "Saudi Arabia", 
          documents: [
            { id: "sfda_cta", name: "SFDA Clinical Trial Authorization", purpose: "Saudi clinical trial approval" },
            { id: "sfda_nda", name: "SFDA Drug Registration", purpose: "Saudi marketing authorization" }
          ], 
          coords: { x: 540, y: 150 } 
        },
        { 
          id: "uae", 
          name: "United Arab Emirates", 
          documents: [
            { id: "dha_cta", name: "DHA Clinical Trial Permit", purpose: "UAE clinical trial approval" },
            { id: "moh_uae_nda", name: "UAE Drug Registration", purpose: "UAE marketing authorization" }
          ], 
          coords: { x: 560, y: 155 } 
        }
      ],
      color: "#e53e3e",
      coords: { x: 530, y: 170 }
    }
  };

  // Interactive Map State
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  
  // Single Document State - Comprehensive Form Fields
  const [disease, setDisease] = useState('');
  const [drugClass, setDrugClass] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [country, setCountry] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [studyName, setStudyName] = useState('');
  const [compoundName, setCompoundName] = useState('');
  
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
  
  // Batch Processing State
  const [csvData, setCsvData] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [batchProgress, setBatchProgress] = useState({});
  const [batchResults, setBatchResults] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('cmc');
  const [selectedCountryData, setSelectedCountryData] = useState(null);
  
  // Interactive Map State
  const [showMap, setShowMap] = useState(false);
  
  // Background processing
  const { startJob, getJob } = useBackgroundJobs('regulatory_document');
  const [backgroundJobId, setBackgroundJobId] = useState(null);
  
  // Navigation
  const location = useLocation();
  
  // File input ref
  const fileInputRef = useRef(null);
  
  // Previous Documents State
  const [showPreviousDocs, setShowPreviousDocs] = useState(false);
  const [previousDocs, setPreviousDocs] = useState([]);
  const [loadingPreviousDocs, setLoadingPreviousDocs] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Dropdown Options
  const trialPhases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV'];
  const trialTypes = ['Interventional', 'Observational', 'Expanded Access'];
  const blindingOptions = ['Open-label', 'Single-blind', 'Double-blind'];
  const randomizationOptions = ['Yes', 'No'];
  const genderOptions = ['All', 'Male', 'Female'];
  const formulationOptions = ['Tablet', 'Capsule', 'Injection', 'Topical', 'Oral Solution', 'IV Infusion', 'Subcutaneous'];
  const routeOptions = ['Oral', 'Intravenous', 'Subcutaneous', 'Intramuscular', 'Topical', 'Inhalation'];
  const controlOptions = ['Placebo', 'Active Comparator', 'Historical Control', 'No Control'];
  const measurementTools = ['PASI', 'EASI', 'sPGA', 'DLQI', 'HAM-D', 'MADRS', 'ACR20/50/70', 'DAS28', 'CDAI'];

  // Load parameters from navigation state (map selection)
  useEffect(() => {
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
        
        if (selectedDocuments && selectedDocuments.length > 0) {
          setDocumentType(selectedDocuments[0].name);
        }
      }
    }
  }, [location.state]);

  // CSV Template Headers - Complete field set matching single form
  const csvTemplate = [
    // Basic Information
    'study_name',
    'disease_condition',
    'drug_class',
    'mechanism_of_action',
    'compound_name',
    
    // Trial Characteristics
    'trial_phase',
    'trial_type',
    'blinding',
    'randomization',
    
    // Population Details
    'min_age',
    'max_age',
    'gender',
    'target_sample_size',
    'inclusion_criteria',
    'exclusion_criteria',
    
    // Treatment & Control
    'drug_formulation',
    'route_of_administration',
    'dosing_regimen',
    'control_group',
    
    // Endpoints & Outcomes
    'primary_endpoints',
    'secondary_endpoints',
    'outcome_measure_tool',
    
    // Statistical Considerations
    'statistical_power',
    'significance_level',
    
    // Regulatory Submission
    'country',
    'document_type'
  ];

  // Helper function to get region by country name
  const getRegionByCountry = (countryName) => {
    for (const [region, countries] of Object.entries(regionCountryMap)) {
      if (countries.includes(countryName)) return region;
    }
    return null;
  };

  // Handle map country selection
  const handleMapCountrySelect = (country, region) => {
    setCountry(country.name);
    setSelectedCountryData({
      country: country.name,
      countryId: country.id,
      region: regions[region].name,
      availableDocuments: country.documents
    });
    
    if (country.documents && country.documents.length > 0) {
      setDocumentType(country.documents[0].name);
    }
  };

  // Generate CSV Template
  const generateCsvTemplate = () => {
    const headers = csvTemplate.join(',');
    const sampleData = [
      // Complete sample row with all fields
      'PSORA-301,Moderate to Severe Psoriasis,Biologics,IL-17A inhibition,LUM-2024,Phase III,Interventional,Double-blind,Yes,18,75,All,300,"Adults aged 18-75 years with moderate-to-severe plaque psoriasis","Pregnancy or breastfeeding; active infections",Injection,Subcutaneous,150mg at Week 0 and 4 then every 12 weeks,Placebo,"PASI-75 response at Week 16","PASI-90 response; sPGA 0/1; DLQI improvement",PASI,80,0.05,United States,IND',
      
      'ECZEMA-201,Atopic Dermatitis,Small molecule,JAK1/JAK3 inhibition,LUM-2025,Phase II,Interventional,Double-blind,Yes,12,65,All,150,"Moderate-to-severe atopic dermatitis; inadequate response to topical treatments","Immunocompromised patients; active malignancy",Tablet,Oral,10mg once daily for 16 weeks,Placebo,"EASI-75 response at Week 12","Itch NRS improvement; sleep quality; QoL measures",EASI,80,0.05,European Union,CTA',
      
      'ARTHRO-302,Rheumatoid Arthritis,Biologics,TNF-alpha inhibition,LUM-2026,Phase III,Interventional,Double-blind,Yes,18,80,All,400,"Active RA despite MTX; DAS28 > 5.1","Previous anti-TNF therapy; serious infections",IV Infusion,Intravenous,5mg/kg at Week 0-2-6 then every 8 weeks,Active Comparator,"ACR20 response at Week 24","ACR50/70 response; DAS28 remission; radiographic progression",DAS28,90,0.01,Canada,CTA'
    ];
    
    const csvContent = [headers, ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research_pipeline_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle CSV File Upload
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          row.id = index;
          row.status = 'pending';
          return row;
        });

        setCsvData(data);
        setCsvPreview(data.slice(0, 5)); // Show first 5 rows
        setShowCsvPreview(true);
        setError('');
      } catch (err) {
        setError('Error parsing CSV file. Please check the format.');
        console.error('CSV parsing error:', err);
      }
    };

    reader.readAsText(file);
  };

  // Single Document Generation
  const handleSingleGeneration = async () => {
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const enhancedFormData = {
        disease_name: disease.trim(),
        additional_parameters: {
          study_name: studyName.trim() || undefined,
          compound_name: compoundName.trim() || undefined,
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
          inclusion_criteria: inclusionCriteria.trim() || undefined,
          exclusion_criteria: exclusionCriteria.trim() || undefined,
          
          // Treatment & Control
          drug_formulation: drugFormulation || undefined,
          route_of_administration: routeOfAdministration || undefined,
          dosing_regimen: dosingRegimen.trim() || undefined,
          control_group: controlGroup || undefined,
          
          // Endpoints & Outcomes
          primary_endpoints: primaryEndpoints.trim() || undefined,
          secondary_endpoints: secondaryEndpoints.trim() || undefined,
          outcome_measure_tool: outcomeMeasureTool || undefined,
          
          // Statistical Considerations
          statistical_power: statisticalPower || undefined,
          significance_level: significanceLevel || undefined,
        }
      };

      if (!disease || disease.trim() === '') {
        throw new Error('Disease/Condition is required');
      }

      const jobId = startJob('regulatory_document', enhancedFormData, apiService.generateIndModule);
      setBackgroundJobId(jobId);
      
      monitorJob(jobId);
      
    } catch (err) {
      console.error('Single document generation error:', err);
      setError(`Failed to start document generation: ${err.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  // Batch Document Generation
  const handleBatchGeneration = async () => {
    if (!csvData || csvData.length === 0) {
      setError('Please upload a CSV file with study data.');
      return;
    }

    setLoading(true);
    setError('');
    setBatchResults([]);
    
    const progress = {};
    csvData.forEach(row => {
      progress[row.id] = { status: 'pending', progress: 0 };
    });
    setBatchProgress(progress);

    try {
      // Process each row sequentially to avoid overwhelming the API
      for (const row of csvData) {
        setBatchProgress(prev => ({
          ...prev,
          [row.id]: { status: 'processing', progress: 25 }
        }));

        // Debug: Log the row data
        console.log('CSV Row data:', row);
        
        // Map country to region for backend
        const getRegionFromCountry = (country) => {
          const regionMap = {
            'United States': 'North America',
            'Canada': 'North America', 
            'Mexico': 'North America',
            'European Union': 'Europe',
            'United Kingdom': 'Europe',
            'Germany': 'Europe',
            'France': 'Europe',
            'Japan': 'Asia Pacific',
            'China': 'Asia Pacific',
            'Australia': 'Asia Pacific',
            'Brazil': 'Latin America',
            'Argentina': 'Latin America',
            'South Africa': 'Africa & Middle East'
          };
          return regionMap[country] || 'Unknown';
        };
        
        const formData = {
          disease_name: row.disease_condition || row.disease_name,
          additional_parameters: {
            // Basic Information
            study_name: row.study_name,
            compound_name: row.compound_name,
            indication: row.disease_condition, // Required for IND, CTA, etc.
            dosage_form: row.drug_formulation, // Required for IND
            protocol_number: row.study_name, // Use study_name as protocol_number for CTA
            drug_class: row.drug_class,
            mechanism: row.mechanism_of_action,
            
            // Trial Characteristics
            trial_phase: row.trial_phase,
            trial_type: row.trial_type,
            blinding: row.blinding,
            randomization: row.randomization,
            
            // Population Details
            min_age: row.min_age,
            max_age: row.max_age,
            gender: row.gender,
            target_sample_size: row.target_sample_size,
            inclusion_criteria: row.inclusion_criteria,
            exclusion_criteria: row.exclusion_criteria,
            
            // Treatment & Control
            drug_formulation: row.drug_formulation,
            route_of_administration: row.route_of_administration,
            dosing_regimen: row.dosing_regimen,
            control_group: row.control_group,
            
            // Endpoints & Outcomes
            primary_endpoints: row.primary_endpoints,
            secondary_endpoints: row.secondary_endpoints,
            outcome_measure_tool: row.outcome_measure_tool,
            
            // Statistical Considerations
            statistical_power: row.statistical_power,
            significance_level: row.significance_level,
            
            // Regulatory Submission
            country: row.country,
            document_type: row.document_type,
          }
        };

        // Debug: Log the final formData being sent
        console.log('Final formData being sent:', formData);
        console.log('Required parameters check - indication:', formData.additional_parameters?.indication);
        console.log('Required parameters check - dosage_form:', formData.additional_parameters?.dosage_form);

        try {
          const result = await apiService.generateIndModule(formData);
          
          // Save to backend - RE-ENABLED FOR PRISMA DEBUGGING
          try {
            await saveDocument({
              type: 'REGULATORY', // Must match DocumentType enum
              title: `${row.document_type} for ${row.study_name}`,
              disease: row.disease_condition,
              region: getRegionFromCountry(row.country),
              country: row.country,
              documentType: row.document_type,
              cmcSection: result.cmc_section || '',
              clinicalSection: result.clinical_section || '',
              content: result.document_content || `CMC SECTION:\n${result.cmc_section || ''}\n\nCLINICAL SECTION:\n${result.clinical_section || ''}`,
              tags: [row.study_name, row.compound_name, row.disease_condition].filter(Boolean), // Required array
            });
          } catch (saveError) {
            console.warn(`Failed to save document for ${row.study_name}:`, saveError);
            console.log('Save error details:', saveError.response?.data);
            console.log('Document data that failed:', {
              type: 'REGULATORY',
              title: `${row.document_type} for ${row.study_name}`,
              disease: row.disease_condition,
              region: getRegionFromCountry(row.country),
              country: row.country,
              documentType: row.document_type,
              studyName: row.study_name,
              compoundName: row.compound_name,
            });
          }

          setBatchProgress(prev => ({
            ...prev,
            [row.id]: { status: 'completed', progress: 100 }
          }));

          setBatchResults(prev => [...prev, {
            id: row.id,
            studyName: row.study_name,
            status: 'success',
            result: result
          }]);

        } catch (rowError) {
          console.error(`Error generating document for ${row.study_name}:`, rowError);
          
          setBatchProgress(prev => ({
            ...prev,
            [row.id]: { status: 'error', progress: 0 }
          }));

          setBatchResults(prev => [...prev, {
            id: row.id,
            studyName: row.study_name,
            status: 'error',
            error: rowError.message
          }]);
        }

        // Small delay to prevent API overload
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (batchError) {
      console.error('Batch generation error:', batchError);
      setError(`Batch generation failed: ${batchError.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Monitor Background Job
  const monitorJob = (jobId) => {
    let checkAttempts = 0;
    const maxAttempts = 300;
    
    const checkJobStatus = async () => {
      checkAttempts++;
      
      if (checkAttempts > maxAttempts) {
        setError('Document generation timed out. Please try again.');
        setLoading(false);
        setBackgroundJobId(null);
        return;
      }
      
      const job = getJob(jobId);
      if (job) {
        if (job.status === 'completed') {
          setLoading(false);
          setBackgroundJobId(null);
          
          const response = job.result;
          
          if (response.document_content) {
            const content = response.document_content;
            let cmcSection = "";
            let clinicalSection = "";
            
            const possibleDividers = [
              "CLINICAL OVERVIEW", "CLINICAL SECTION", "CLINICAL STUDY", 
              "NONCLINICAL OVERVIEW", "3. NONCLINICAL", "4. CLINICAL", 
              "CLINICAL TRIAL", "EFFICACY AND SAFETY"
            ];
            
            let dividerIndex = -1;
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
              const midPoint = Math.floor(content.length / 2);
              cmcSection = content.substring(0, midPoint).trim();
              clinicalSection = content.substring(midPoint).trim();
            }
            
            setResult({
              cmc_section: cmcSection,
              clinical_section: clinicalSection,
              document_content: content
            });

            // Save to backend - DISABLED FOR NOW
            console.log("Single mode: Document generation successful, skipping save for now");
            /*try {
              await saveDocument({
                type: 'REGULATORY',
                title: `${documentType} for ${studyName || disease}`,
                disease,
                country,
                documentType,
                studyName,
                compoundName,
                cmcSection: cmcSection,
                clinicalSection: clinicalSection,
                content,
              });
              console.log('Document saved to backend successfully');
            } catch (saveError) {
              if (saveError.response?.status === 413) {
                console.warn('Document too large to save to backend (413 error). Document generated successfully but not saved.');
              } else {
                console.warn('Failed to save document to backend:', saveError);
              }
            }

          } else if (response.cmc_section && response.clinical_section) {
            setResult(response);
            
            try {
              console.log("Single mode: Document generation successful, skipping save for now");
              /*await saveDocument({
                type: 'REGULATORY',
                title: `${documentType} for ${studyName || disease}`,
                disease,
                country,
                documentType,
                studyName,
                compoundName,
                cmcSection: response.cmc_section,
                clinicalSection: response.clinical_section,
                content: response.document_content || `CMC SECTION:\n${response.cmc_section}\n\nCLINICAL SECTION:\n${response.clinical_section}`,
              });
              console.log('Document saved to backend successfully');
            } catch (saveError) {
              if (saveError.response?.status === 413) {
                console.warn('Document too large to save to backend (413 error). Document generated successfully but not saved.');
              } else {
                console.warn('Failed to save document to backend:', saveError);
              }
            }*/
          }
          
          setTimeout(() => {
            document.querySelector('.result-container')?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }, 100);
          
        } else if (job.status === 'error') {
          setLoading(false);
          setBackgroundJobId(null);
          console.error('Background job error details:', {
            jobId,
            error: job.error,
            data: job.data,
            type: job.type
          });
          setError(`Document generation failed: ${job.error || 'Unknown error occurred. Please check the console for details.'}`);
        } else {
          setTimeout(() => checkJobStatus(), 1000);
        }
      } else {
        console.warn(`Background job ${jobId} not found, attempt ${checkAttempts}/${maxAttempts}`);
        if (checkAttempts > 10) {
          setError('Lost connection to background job. Please try again.');
          setLoading(false);
          setBackgroundJobId(null);
          return;
        }
        setTimeout(() => checkJobStatus(), 1000);
      }
    };
    
    checkJobStatus();
  };

  // Handle Previous Documents
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
        if (err.response?.status === 401) {
          setFetchError('Please log in to view previous documents.');
        } else {
          setFetchError('Error fetching previous regulatory documents. Please try again later.');
        }
      } finally {
        setLoadingPreviousDocs(false);
      }
    }
  };

  // Download Results as ZIP (for batch)
  const downloadBatchResults = async () => {
    const successfulResults = batchResults.filter(r => r.status === 'success');
    
    if (successfulResults.length === 0) {
      alert('No successful documents to download.');
      return;
    }

    try {
      const zip = new JSZip();
      const timestamp = new Date().toISOString().slice(0, 10);
      
      // Create a main folder for this batch
      const batchFolder = zip.folder(`Regulatory_Documents_${timestamp}`);
      
      // Process each successful result
      for (let i = 0; i < successfulResults.length; i++) {
        const result = successfulResults[i];
        const studyName = result.studyName || `Study_${i + 1}`;
        const sanitizedStudyName = studyName.replace(/[^a-zA-Z0-9-_]/g, '_');
        
        // Create a folder for this study
        const studyFolder = batchFolder.folder(sanitizedStudyName);
        
        // Generate combined document content
        const combinedContent = `REGULATORY DOCUMENT - ${studyName}
Generated: ${new Date().toISOString()}

CMC SECTION:
${result.result.cmc_section || 'No CMC content available'}

CLINICAL SECTION:
${result.result.clinical_section || 'No clinical content available'}

FULL DOCUMENT:
${result.result.document_content || 'No document content available'}`;

        // Add text file
        studyFolder.file(`${sanitizedStudyName}_Document.txt`, combinedContent);
        
        // Generate PDF for each document
        try {
          const doc = new jsPDF();
          doc.setFont('helvetica');
          doc.setFontSize(10);
          
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;
          const margin = 15;
          const maxLineWidth = pageWidth - (margin * 2);
          const lineHeight = 6;
          const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
          
          const lines = doc.splitTextToSize(combinedContent, maxLineWidth);
          let currentLine = 0;
          
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            if (currentLine >= maxLinesPerPage) {
              doc.addPage();
              currentLine = 0;
            }
            
            const yPosition = margin + (currentLine * lineHeight);
            doc.text(lines[lineIndex], margin, yPosition);
            currentLine++;
          }
          
          // Convert PDF to blob and add to ZIP
          const pdfBlob = doc.output('blob');
          studyFolder.file(`${sanitizedStudyName}_Document.pdf`, pdfBlob);
          
        } catch (pdfError) {
          console.warn(`Failed to generate PDF for ${studyName}:`, pdfError);
          // Continue with other documents even if PDF generation fails
        }

        // Add separate CMC and Clinical sections as individual files
        if (result.result.cmc_section) {
          studyFolder.file(`${sanitizedStudyName}_CMC_Section.txt`, result.result.cmc_section);
        }
        
        if (result.result.clinical_section) {
          studyFolder.file(`${sanitizedStudyName}_Clinical_Section.txt`, result.result.clinical_section);
        }
      }
      
      // Add a summary file
      const summary = `BATCH GENERATION SUMMARY
Generated: ${new Date().toISOString()}
Total Studies Processed: ${batchResults.length}
Successful Documents: ${successfulResults.length}
Failed Documents: ${batchResults.filter(r => r.status === 'error').length}

SUCCESSFUL STUDIES:
${successfulResults.map((r, i) => `${i + 1}. ${r.studyName}`).join('\n')}

${batchResults.filter(r => r.status === 'error').length > 0 ? `
FAILED STUDIES:
${batchResults.filter(r => r.status === 'error').map((r, i) => `${i + 1}. ${r.studyName} - ${r.error}`).join('\n')}
` : ''}
`;
      
      batchFolder.file('Batch_Summary.txt', summary);
      
      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `Regulatory_Documents_${timestamp}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log(`Successfully created ZIP with ${successfulResults.length} documents`);
      
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('Failed to create ZIP file. Please try again.');
    }
  };

  // Reset Form
  const resetForm = () => {
    // Basic Information
    setDisease('');
    setDrugClass('');
    setMechanism('');
    setDocumentType('');
    setStudyName('');
    setCompoundName('');
    
    // Trial Characteristics
    setTrialPhase('');
    setTrialType('');
    setBlinding('');
    setRandomization('');
    
    // Population Details
    setMinAge('');
    setMaxAge('');
    setGender('');
    setTargetSampleSize('');
    setInclusionCriteria('');
    setExclusionCriteria('');
    
    // Treatment & Control
    setDrugFormulation('');
    setRouteOfAdministration('');
    setDosingRegimen('');
    setControlGroup('');
    
    // Endpoints & Outcomes
    setPrimaryEndpoints('');
    setSecondaryEndpoints('');
    setOutcomeMeasureTool('');
    
    // Statistical Considerations
    setStatisticalPower('80');
    setSignificanceLevel('0.05');
    
    setResult(null);
    setError('');
    
    // Reset batch state
    setCsvData([]);
    setCsvPreview([]);
    setShowCsvPreview(false);
    setBatchProgress({});
    setBatchResults([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="unified-regulatory-generator">
      {/* Header */}
      <div className="generator-header">
        <div>
          <h2>🧬 Medical Research Document Generator</h2>
          <p>Generate regulatory submissions for your research studies</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowMap(!showMap)} className="btn btn-outline">
            🌍 {showMap ? 'Hide Map' : 'Select Country'}
          </button>
          <button onClick={handleShowPreviousDocs} className="btn btn-outline">
            {showPreviousDocs ? 'Hide Previous' : 'Previous Docs'}
          </button>
        </div>
      </div>

      {/* Interactive Regulatory Map */}
      {showMap && (
        <div className="interactive-map-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#2d3748' }}>🗺️ Global Regulatory Document Map</h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#4a5568' }}>
                Select a region to explore available regulatory documents by country
              </p>
            </div>
          </div>
          
          <div style={{ position: 'relative', width: '100%', height: '400px', margin: '20px 0' }}>
            <ComposableMap projection="geoMercator" width={900} height={400} style={{ width: '100%', height: '400px' }}>
              <ZoomableGroup center={[20, 20]} zoom={1}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const countryName = geo.properties.NAME;
                      const region = getRegionByCountry(countryName);
                      const isRegion = selectedRegion ? region === selectedRegion : false;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (!selectedRegion && region) {
                              setSelectedRegion(region);
                            } else if (selectedRegion && isRegion) {
                              // Find country in regions[selectedRegion].countries
                              const regionObj = regions[selectedRegion];
                              if (regionObj) {
                                const country = regionObj.countries.find(c => c.name === countryName);
                                if (country) handleMapCountrySelect(country, selectedRegion);
                              }
                            }
                          }}
                          style={{
                            default: {
                              fill: selectedRegion
                                ? (isRegion ? regionColors[selectedRegion] : '#e2e8f0')
                                : (region ? regionColors[region] : '#e2e8f0'),
                              stroke: '#fff',
                              strokeWidth: 0.75,
                              outline: 'none',
                              cursor: region ? 'pointer' : 'default',
                              opacity: selectedRegion ? (isRegion ? 1 : 0.5) : 0.85
                            },
                            hover: {
                              fill: region ? regionColors[region] : '#cbd5e0',
                              opacity: 1,
                              outline: 'none',
                              cursor: region ? 'pointer' : 'default'
                            },
                            pressed: {
                              fill: region ? regionColors[region] : '#cbd5e0',
                              outline: 'none',
                              cursor: region ? 'pointer' : 'default'
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                {/* Add clickable region dots */}
                {Object.entries(regionCentroids).map(([regionId, coords]) => (
                  <Marker key={regionId} coordinates={coords}>
                    <circle
                      r={selectedRegion === regionId ? 18 : 13}
                      fill={regionColors[regionId]}
                      stroke="#2d3748"
                      strokeWidth={selectedRegion === regionId ? 3 : 2}
                      opacity={hoveredRegion === regionId ? 0.85 : 0.7}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={() => setHoveredRegion(regionId)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => setSelectedRegion(regionId)}
                    />
                    <text
                      textAnchor="middle"
                      y={selectedRegion === regionId ? 35 : 28}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: selectedRegion === regionId ? 15 : 13,
                        fontWeight: selectedRegion === regionId ? 'bold' : 'normal',
                        fill: '#2d3748',
                        cursor: 'pointer',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      {regionNameMap[regionId]}
                    </text>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Region Details */}
          {selectedRegion && (
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '20px',
              border: `2px solid ${regions[selectedRegion].color}`
            }}>
              <h4 style={{ 
                margin: '0 0 15px 0', 
                color: regions[selectedRegion].color,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {regions[selectedRegion].name}
                <span style={{ 
                  fontSize: '0.8rem', 
                  background: regions[selectedRegion].color,
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {regions[selectedRegion].countries.length} countries
                </span>
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px'
              }}>
                {regions[selectedRegion].countries.map((country) => (
                  <div
                    key={country.id}
                    onClick={() => handleMapCountrySelect(country, selectedRegion)}
                    style={{
                      padding: '15px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = regions[selectedRegion].color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#2d3748' }}>
                        {country.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                        {country.documents.length} document type{country.documents.length !== 1 ? 's' : ''} available
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '1.2rem',
                      color: regions[selectedRegion].color
                    }}>
                      →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#ebf8ff',
            borderRadius: '8px',
            border: '1px solid #bee3f8'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#2c5282' }}>
              <strong>How to use:</strong> Click on a region above to see available countries, 
              then click on a country to auto-fill your regulatory submission fields.
            </div>
          </div>
        </div>
      )}

      {/* Previous Documents Section */}
      {showPreviousDocs && (
        <div className="previous-docs-section">
          <h4>Previous Regulatory Documents</h4>
          {loadingPreviousDocs ? (
            <p>Loading...</p>
          ) : fetchError ? (
            <p style={{ color: 'red' }}>{fetchError}</p>
          ) : previousDocs.length === 0 ? (
            <p>No previous regulatory documents found.</p>
          ) : (
            <div className="docs-list">
              {previousDocs.slice(0, 3).map(doc => (
                <div key={doc.id} className="doc-item">
                  <strong>{doc.title}</strong>
                  <span>{doc.disease} • {doc.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode Selection */}
      <div className="mode-selection">
        <h3>Document Generation Mode</h3>
        <div className="mode-toggle">
          <div 
            className={`mode-card ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            <div className="mode-icon">📄</div>
            <h4>Single Document</h4>
            <p>Generate one regulatory submission</p>
          </div>
          <div 
            className={`mode-card ${mode === 'batch' ? 'active' : ''}`}
            onClick={() => setMode('batch')}
          >
            <div className="mode-icon">📊</div>
            <h4>Batch Processing</h4>
            <p>Multiple regulatory documents</p>
          </div>
        </div>
      </div>

      {/* Single Document Mode */}
      {mode === 'single' && (
        <div className="single-mode">
          {/* Basic Information */}
          <div className="form-section">
            <h3>📋 Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Disease/Condition <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  placeholder="e.g., Psoriasis, Atopic Dermatitis"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Drug Class</label>
                <input
                  type="text"
                  className="form-input"
                  value={drugClass}
                  onChange={(e) => setDrugClass(e.target.value)}
                  placeholder="e.g., Small molecule, Biologics"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mechanism of Action</label>
                <input
                  type="text"
                  className="form-input"
                  value={mechanism}
                  onChange={(e) => setMechanism(e.target.value)}
                  placeholder="e.g., PDE4 inhibition, JAK-STAT pathway"
                />
              </div>
            </div>
          </div>

          {/* Trial Characteristics */}
          <div className="form-section">
            <h3>🔬 Trial Characteristics</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Trial Phase</label>
                <select
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
                <label className="form-label">Trial Type</label>
                <select
                  className="form-select"
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
                <label className="form-label">Blinding</label>
                <select
                  className="form-select"
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
                <label className="form-label">Randomization</label>
                <select
                  className="form-select"
                  value={randomization}
                  onChange={(e) => setRandomization(e.target.value)}
                >
                  <option value="">Select</option>
                  {randomizationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Population Details */}
          <div className="form-section">
            <h3>👥 Population Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Minimum Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder="e.g., 18"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  placeholder="e.g., 75"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
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
                <label className="form-label">Target Sample Size</label>
                <input
                  type="number"
                  className="form-input"
                  value={targetSampleSize}
                  onChange={(e) => setTargetSampleSize(e.target.value)}
                  placeholder="e.g., 120"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Inclusion Criteria</label>
                <textarea
                  className="form-textarea"
                  value={inclusionCriteria}
                  onChange={(e) => setInclusionCriteria(e.target.value)}
                  placeholder="e.g., Adults aged 18-75 years, Confirmed diagnosis of moderate-to-severe condition..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Exclusion Criteria</label>
                <textarea
                  className="form-textarea"
                  value={exclusionCriteria}
                  onChange={(e) => setExclusionCriteria(e.target.value)}
                  placeholder="e.g., Pregnancy, Active infection, Immunocompromised state..."
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Treatment & Control */}
          <div className="form-section">
            <h3>💊 Treatment & Control</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Drug Formulation</label>
                <select
                  className="form-select"
                  value={drugFormulation}
                  onChange={(e) => setDrugFormulation(e.target.value)}
                >
                  <option value="">Select Formulation</option>
                  {formulationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Route of Administration</label>
                <select
                  className="form-select"
                  value={routeOfAdministration}
                  onChange={(e) => setRouteOfAdministration(e.target.value)}
                >
                  <option value="">Select Route</option>
                  {routeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dosing Regimen</label>
                <input
                  type="text"
                  className="form-input"
                  value={dosingRegimen}
                  onChange={(e) => setDosingRegimen(e.target.value)}
                  placeholder="e.g., 50mg once daily for 12 weeks"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Control Group</label>
                <select
                  className="form-select"
                  value={controlGroup}
                  onChange={(e) => setControlGroup(e.target.value)}
                >
                  <option value="">Select Control</option>
                  {controlOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Endpoints & Outcomes */}
          <div className="form-section">
            <h3>🎯 Endpoints & Outcomes</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Primary Endpoint(s)</label>
                <textarea
                  className="form-textarea"
                  value={primaryEndpoints}
                  onChange={(e) => setPrimaryEndpoints(e.target.value)}
                  placeholder="e.g., Proportion of patients achieving PASI 75 at Week 16"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Secondary Endpoint(s)</label>
                <textarea
                  className="form-textarea"
                  value={secondaryEndpoints}
                  onChange={(e) => setSecondaryEndpoints(e.target.value)}
                  placeholder="e.g., PASI 90 response, sPGA score, Quality of life measures"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Outcome Measure Tool</label>
                <select
                  className="form-select"
                  value={outcomeMeasureTool}
                  onChange={(e) => setOutcomeMeasureTool(e.target.value)}
                >
                  <option value="">Select Measurement Tool</option>
                  {measurementTools.map(tool => (
                    <option key={tool} value={tool}>{tool}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Statistical Considerations */}
          <div className="form-section">
            <h3>📊 Statistical Considerations</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Statistical Power (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={statisticalPower}
                  onChange={(e) => setStatisticalPower(e.target.value)}
                  placeholder="80"
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Significance Level (α)</label>
                <input
                  type="number"
                  className="form-input"
                  value={significanceLevel}
                  onChange={(e) => setSignificanceLevel(e.target.value)}
                  placeholder="0.05"
                  step="0.01"
                  min="0"
                  max="1"
                />
              </div>
            </div>
          </div>

          {/* Regulatory Submission Section */}
          <div className="form-section">
            <h3>🌍 Regulatory Submission</h3>
            {selectedCountryData && (
              <div className="selected-country-info">
                <h4>📍 Selected: {selectedCountryData.country} ({selectedCountryData.region})</h4>
                <p>Available documents: {selectedCountryData.availableDocuments.map(doc => doc.name).join(', ')}</p>
              </div>
            )}
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Study Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={studyName}
                  onChange={(e) => setStudyName(e.target.value)}
                  placeholder="e.g., PSORA-301"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Compound Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={compoundName}
                  onChange={(e) => setCompoundName(e.target.value)}
                  placeholder="e.g., LUM-2024"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  className="form-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Select from map or enter manually"
                />
              </div>

              {selectedCountryData && (
                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select
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
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="action-buttons">
            <button
              onClick={handleSingleGeneration}
              disabled={loading || !disease}
              className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? 'Generating...' : '🚀 Generate Regulatory Document'}
            </button>
            <button onClick={resetForm} className="btn btn-secondary">
              Reset Form
            </button>
          </div>
        </div>
      )}

      {/* Batch Processing Mode */}
      {mode === 'batch' && (
        <div className="batch-mode">
          <div className="form-section">
            <h3>📊 Batch Regulatory Document Processing</h3>
            
            {/* CSV Upload */}
            <div className="csv-upload-section">
              <h4>📄 Upload Pipeline Data</h4>
              <div className="upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  style={{ display: 'none' }}
                />
                <div 
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-content">
                    <div className="upload-icon">📁</div>
                    <p>Drag & drop CSV file or click to browse</p>
                    <button type="button" className="btn btn-outline">
                      Choose File
                    </button>
                  </div>
                </div>
                
                <div className="upload-actions">
                  <button 
                    onClick={generateCsvTemplate}
                    className="btn btn-outline"
                    type="button"
                  >
                    📥 Download CSV Template
                  </button>
                </div>
              </div>
            </div>

            {/* CSV Preview */}
            {showCsvPreview && csvPreview.length > 0 && (
              <div className="csv-preview-section">
                <h4>📋 Pipeline Preview ({csvData.length} studies)</h4>
                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Study Name</th>
                        <th>Disease</th>
                        <th>Compound</th>
                        <th>Phase</th>
                        <th>Sample Size</th>
                        <th>Country</th>
                        <th>Document</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, index) => (
                        <tr key={index}>
                          <td>{row.study_name}</td>
                          <td>{row.disease_condition}</td>
                          <td>{row.compound_name}</td>
                          <td>{row.trial_phase}</td>
                          <td>{row.target_sample_size}</td>
                          <td>{row.country}</td>
                          <td>{row.document_type}</td>
                          <td>
                            <span className={`status-badge ${batchProgress[row.id]?.status || 'pending'}`}>
                              {batchProgress[row.id]?.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <p className="preview-note">Showing first 5 of {csvData.length} studies</p>
                  )}
                </div>
              </div>
            )}

            {/* Batch Progress */}
            {loading && Object.keys(batchProgress).length > 0 && (
              <div className="batch-progress-section">
                <h4>🔄 Generation Progress</h4>
                <div className="progress-list">
                  {csvData.map(row => (
                    <div key={row.id} className="progress-item">
                      <div className="progress-info">
                        <span className="study-name">{row.study_name}</span>
                        <span className={`progress-status ${batchProgress[row.id]?.status || 'pending'}`}>
                          {batchProgress[row.id]?.status || 'pending'}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${batchProgress[row.id]?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <div className="batch-results-section">
                <h4>📋 Generation Results</h4>
                <div className="results-summary">
                  <span className="success-count">
                    ✅ {batchResults.filter(r => r.status === 'success').length} Successful
                  </span>
                  <span className="error-count">
                    ❌ {batchResults.filter(r => r.status === 'error').length} Failed
                  </span>
                </div>
                
                <button 
                  onClick={downloadBatchResults}
                  className="btn btn-primary"
                  disabled={batchResults.filter(r => r.status === 'success').length === 0}
                >
                  📦 Download ZIP Archive
                </button>
              </div>
            )}

            {/* Generate All Button */}
            <div className="action-buttons">
              <button
                onClick={handleBatchGeneration}
                disabled={loading || csvData.length === 0}
                className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? 'Processing Pipeline...' : '🚀 Generate All Documents'}
              </button>
              <button onClick={resetForm} className="btn btn-secondary">
                Reset Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-error" aria-live="polite">
          {error}
        </div>
      )}

      {/* Single Document Results */}
      {mode === 'single' && result && (
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
                  <pre>{result.cmc_section}</pre>
                </div>
              </>
            ) : (
              <>
                <h3>Clinical Section</h3>
                <div className="content-area">
                  <pre>{result.clinical_section}</pre>
                </div>
              </>
            )}
          </div>

          <div className="action-buttons">
            <button
              onClick={() => {
                const content = activeTab === 'cmc' ? result.cmc_section : result.clinical_section;
                navigator.clipboard.writeText(content);
                alert('Current section copied!');
              }}
              className="btn btn-outline"
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
              className="btn btn-outline"
            >
              Copy All
            </button>
            <button
              onClick={() => {
                try {
                  const content = `CMC SECTION:\n\n${result.cmc_section || 'No CMC content available'}\n\nCLINICAL SECTION:\n\n${result.clinical_section || 'No clinical content available'}`;
                  
                  if (content.length > 1000000) {
                    alert('Document is too large for PDF generation. Please copy the content instead.');
                    return;
                  }
                  
                  const doc = new jsPDF();
                  doc.setFont('helvetica');
                  doc.setFontSize(10);
                  
                  const pageHeight = doc.internal.pageSize.height;
                  const pageWidth = doc.internal.pageSize.width;
                  const margin = 15;
                  const maxLineWidth = pageWidth - (margin * 2);
                  const lineHeight = 6;
                  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
                  
                  const lines = doc.splitTextToSize(content, maxLineWidth);
                  let currentLine = 0;
                  
                  for (let i = 0; i < lines.length; i++) {
                    if (currentLine >= maxLinesPerPage) {
                      doc.addPage();
                      currentLine = 0;
                    }
                    
                    const yPosition = margin + (currentLine * lineHeight);
                    doc.text(lines[i], margin, yPosition);
                    currentLine++;
                  }
                  
                  const fileName = `${studyName || documentType || 'Regulatory'}_${disease || 'Document'}_${new Date().toISOString().slice(0, 10)}.pdf`;
                  doc.save(fileName);
                  
                } catch (pdfError) {
                  console.error('PDF generation failed:', pdfError);
                  alert('PDF generation failed. You can copy the content using the "Copy All" button instead.');
                }
              }}
              className="btn btn-primary"
            >
              Download as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedRegulatoryGenerator;