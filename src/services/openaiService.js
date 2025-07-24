// src/services/openaiService.js - CORRECTED AND COMPLETE

import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;


// Enhanced OpenAI Configuration for Optimal Content Generation
const OPENAI_CONFIG = {
  // For comprehensive regulatory documents requiring extensive detail
  COMPREHENSIVE: {
    model: "gpt-4o",
    max_tokens: 8192,         // Reduced to prevent truncation issues
    temperature: 0.7,         // Optimal for creative but controlled content
    presence_penalty: 0.1,    // Light penalty to encourage topic diversity
    frequency_penalty: 0.2,   // Moderate penalty to reduce repetition
    stream: false,            // Explicitly disable streaming
    top_p: 0.9               // Add nucleus sampling for better quality
  },
  
  // For shorter, more precise content
  PRECISE: {
    model: "gpt-4o",
    max_tokens: 4096,
    temperature: 0.3,         // Lower for precision
    presence_penalty: 0.05,
    frequency_penalty: 0.1,   // Light frequency penalty
    stream: false,
    top_p: 0.8
  },
  
  // For analysis and evaluation tasks
  ANALYTICAL: {
    model: "gpt-4o",
    max_tokens: 4096,
    temperature: 0.2,         // Very controlled for analysis
    presence_penalty: 0,
    frequency_penalty: 0.05,  // Minimal to avoid affecting technical terms
    stream: false,
    top_p: 0.85
  },

  // Specialized configuration for regulatory documents
  REGULATORY: {
    model: "gpt-4o",
    max_tokens: 16384,        // Increased back to maximum for 10K+ word documents
    temperature: 0.6,         // Balanced for regulatory content
    presence_penalty: 0.15,   // Moderate for topic diversity
    frequency_penalty: 0.25,  // MUCH LOWER - was 0.6, now 0.25
    stream: false,
    top_p: 0.9
  }
};

// Document type requirements and standards
const DOCUMENT_REQUIREMENTS = {
  protocol: { 
    minWords: 8000, 
    sections: 10,
    config: 'COMPREHENSIVE',
    type: 'Clinical Protocol'
  },
  ind: { 
    minWords: 12000, 
    sections: 16,
    config: 'REGULATORY',
    type: 'IND Application'
  },
  nda: { 
    minWords: 10000, 
    sections: 8,
    config: 'REGULATORY',
    type: 'NDA Submission'
  },
  bla: { 
    minWords: 10000, 
    sections: 8,
    config: 'REGULATORY',
    type: 'BLA Submission'
  },
  cta: { 
    minWords: 8000, 
    sections: 7,
    config: 'REGULATORY',
    type: 'CTA Application'
  },
  maa: { 
    minWords: 9000, 
    sections: 8,
    config: 'REGULATORY',
    type: 'MAA Application'
  },
  impd: { 
    minWords: 7000, 
    sections: 6,
    config: 'COMPREHENSIVE',
    type: 'IMPD Document'
  }
};

// Required parameters by document type
const REQUIRED_PARAMETERS = {
  protocol: ['trial_phase', 'primary_endpoint', 'study_duration'],
  ind: ['compound_name', 'indication', 'dosage_form'],
  nda: ['trade_name', 'active_ingredient', 'indication'],
  bla: ['product_name', 'indication', 'manufacturing_site'],
  cta: ['protocol_number', 'indication', 'trial_phase'],
  maa: ['trade_name', 'active_substance', 'therapeutic_indication'],
  impd: ['active_substance', 'dosage_form', 'route_of_administration']
};

// Standardized formatting requirements
const FORMATTING_STANDARDS = `
FORMATTING REQUIREMENTS:
- Use plain text formatting only - NO MARKDOWN, NO HTML
- Use ALL CAPS for main section headings (e.g., "1. PROTOCOL SUMMARY")
- Use Title Case for subsection headings with appropriate numbering (e.g., "1.1 Study Objectives")
- Include proper spacing between sections (double line break)
- Use professional document structure with consistent indentation
- Reference applicable regulatory guidance documents with proper citations
- Use standard medical and regulatory terminology throughout
- Maintain consistent numbering and bullet point formatting
`;

// Enhanced parameter processing functions
const validateDocumentRequirements = (diseaseData, docType) => {
  const requirements = DOCUMENT_REQUIREMENTS[docType];
  if (!requirements) {
    throw new Error(`Unsupported document type: ${docType}`);
  }

  const requiredParams = REQUIRED_PARAMETERS[docType] || [];
  const providedParams = diseaseData.additional_parameters || {};
  const missing = requiredParams.filter(param => !providedParams[param]);
  
  if (missing.length > 0) {
    console.warn(`Missing recommended parameters for ${docType}: ${missing.join(', ')}`);
  }
  
  return requirements;
};

const formatParametersForDocument = (parameters, docType) => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return 'No additional parameters provided.';
  }

  const relevantParams = Object.entries(parameters)
    .filter(([key, value]) => value && value.toString().trim())
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      return `- ${formattedKey}: ${value}`;
    });

  return relevantParams.length > 0 ? relevantParams.join('\n') : 'No valid parameters provided.';
};

const getConfigForDocumentType = (docType) => {
  const requirements = DOCUMENT_REQUIREMENTS[docType];
  const configType = requirements?.config || 'COMPREHENSIVE';
  return OPENAI_CONFIG[configType];
};

const createSystemPrompt = (expertise, docType, regulatoryFramework, detailedRequirements) => {
  const requirements = DOCUMENT_REQUIREMENTS[docType];
  const documentTypeDescription = requirements?.type || docType.toUpperCase();
  
  return `You are a ${expertise} with 25+ years of experience in ${documentTypeDescription.toLowerCase()} preparation and regulatory submissions. You have successfully authored over 200 ${documentTypeDescription.toLowerCase()}s and have intimate knowledge of ${regulatoryFramework} requirements.

Your task is to generate a comprehensive, regulatory-compliant ${documentTypeDescription.toUpperCase()} that meets the highest standards expected by regulatory agencies.

CRITICAL ${regulatoryFramework.toUpperCase()} REQUIREMENTS:
${detailedRequirements}

MINIMUM CONTENT REQUIREMENTS:
- Total document length: ${requirements?.minWords || 8000}+ words minimum
- Number of major sections: ${requirements?.sections || 8}+ comprehensive sections
- Each section must contain detailed technical content with specific methodological details
- Include comprehensive regulatory and scientific justification for all recommendations
- Provide specific numerical parameters, timing, and acceptance criteria where applicable
- Reference relevant regulatory guidance documents and industry standards
- Use professional clinical research and regulatory terminology throughout

${FORMATTING_STANDARDS}

QUALITY STANDARDS:
- Demonstrate deep understanding of regulatory requirements and industry best practices
- Provide actionable, specific recommendations with clear rationale
- Include risk assessments and mitigation strategies where appropriate
- Ensure content is suitable for direct submission to regulatory authorities
- Maintain consistency with international regulatory harmonization guidelines`;
};

// Create an Axios instance for OpenAI API
const openaiApi = axios.create({
  baseURL: 'https://api.openai.com/v1/',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

const openaiService = {
  /**
   * Transcribes audio files via OpenAI Whisper.
   */
  transcribeAudio: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-1");

    try {
      const response = await openaiApi.post(
        "audio/transcriptions",
        formData,
        {
          headers: {
            'Content-Type': undefined, 
          },
        }
      );
      return response.data.text;
    } catch (error) {
      // console.error("Error in transcribeAudio:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Diagnose conversation from transcript
   */
  diagnoseConversation: async (transcript) => {
    try {
      const response = await openaiApi.post(
        "chat/completions",
        {
          ...OPENAI_CONFIG.ANALYTICAL,
          messages: [
            {
              role: "system",
              content: `You are a board-certified medical specialist with extensive clinical experience. Analyze the transcript and provide diagnosis with extracted metadata.`
            },
            {
              role: "user",
              content: transcript
            }
          ]
        }
      );
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      // console.error("Error in diagnoseConversation:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Generate Protocol - Enhanced version with standardized approach
   */
  generateProtocol: async (diseaseData) => {
    try {
      // Validate requirements and get configuration
      const requirements = validateDocumentRequirements(diseaseData, 'protocol');
      const config = getConfigForDocumentType('protocol');
      
      // Format parameters for document
      const formattedParams = formatParametersForDocument(diseaseData.additional_parameters, 'protocol');
      
      // Create standardized system prompt
      const systemPrompt = createSystemPrompt(
        'Senior Clinical Development Director and Principal Investigator',
        'protocol',
        'FDA/ICH/GCP',
        `Generate a comprehensive FDA/ICH-compliant clinical trial protocol with ${requirements.sections} detailed sections totaling ${requirements.minWords}+ words.

REQUIRED SECTIONS:
1. PROTOCOL SUMMARY (800+ words) - Overview, objectives, design, population, endpoints
2. BACKGROUND & RATIONALE (1000+ words) - Disease context, unmet need, drug rationale  
3. OBJECTIVES & ENDPOINTS (700+ words) - Primary/secondary objectives and endpoints
4. STUDY DESIGN (1200+ words) - Design rationale, randomization, blinding, procedures
5. STUDY POPULATION (800+ words) - Inclusion/exclusion criteria with rationale
6. TREATMENTS (600+ words) - Dosing, administration, concomitant medications
7. ASSESSMENTS (1000+ words) - Visit schedule, procedures, safety monitoring
8. STATISTICS (1200+ words) - Sample size, analysis methods, missing data
9. SAFETY MONITORING (600+ words) - Safety oversight, adverse event reporting
10. REGULATORY COMPLIANCE (400+ words) - GCP compliance, quality assurance

REQUIREMENTS:
- Reference FDA/ICH guidelines (E6(R2), E9(R1))
- Include statistical parameters and regulatory justification
- Use professional clinical research terminology
- Ensure content suitable for regulatory submission`
      );

      const userPrompt = `Generate a comprehensive ${diseaseData.additional_parameters?.trial_phase || 'Phase 2'} clinical trial protocol for ${diseaseData.disease_name}.

STUDY PARAMETERS:
${formattedParams}

Create ${requirements.sections} sections with comprehensive content meeting the minimum word counts specified. Include regulatory justification, statistical parameters, and technical specifications suitable for FDA submission.`;


      const response = await openaiApi.post('chat/completions', {
        ...config,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      });

      return {
        protocol_id: `prot-${Date.now()}`,
        protocol: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateProtocol:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers
        } : null
      });
      throw error;
    }
  },
  
  // =============================================================================
  // UNITED STATES DOCUMENTS
  // =============================================================================
  
  /**
   * US IND (Investigational New Drug) - Default/Original
   */
  generateIndModule: async (diseaseData) => {
    try {
      // Validate requirements and get configuration
      const requirements = validateDocumentRequirements(diseaseData, 'ind');
      const config = getConfigForDocumentType('ind');
      
      // Format parameters for document
      const formattedParams = formatParametersForDocument(diseaseData.additional_parameters, 'ind');
      
      // Create standardized system prompt
      const systemPrompt = createSystemPrompt(
        'Senior Regulatory Affairs Director and Principal Investigator',
        'ind',
        'FDA/21 CFR 312',
        `You MUST generate comprehensive, detailed content that meets FDA requirements for IND applications as outlined in 21 CFR 312:

IND SECTION REQUIREMENTS (Minimum ${requirements.minWords} words total):

CMC SECTION REQUIREMENTS (Chemistry, Manufacturing, and Controls - 4,500+ words):
1. DRUG SUBSTANCE (700+ words) - Complete characterization including molecular structure, synthesis pathway, physicochemical properties, specifications, analytical methods, reference standards, and impurity profiles
2. DRUG PRODUCT (700+ words) - Comprehensive formulation details, excipient justification, manufacturing process, in-process controls, finished product specifications, and packaging systems
3. MANUFACTURING INFORMATION (600+ words) - Detailed process descriptions, critical process parameters, facility information, equipment specifications, and GMP compliance documentation
4. CONTROLS OF DRUG SUBSTANCE AND DRUG PRODUCT (800+ words) - Extensive analytical methods validation, specifications justification, batch analysis data, and quality control procedures
5. STABILITY (500+ words) - Complete stability study protocols, data analysis, degradation pathways, storage conditions, and shelf-life justification
6. ENVIRONMENTAL ASSESSMENT (200+ words) - Environmental impact evaluation and categorical exclusion justification

CLINICAL SECTION REQUIREMENTS (Comprehensive 7,500+ words):
1. INTRODUCTION AND BACKGROUND (800+ words) - Detailed disease pathophysiology, epidemiology, current treatments, unmet medical need, and investigational product rationale
2. STUDY DESIGN AND RATIONALE (1200+ words) - Complete study design justification, methodology, randomization procedures, blinding techniques, visit schedules, and statistical considerations
3. STUDY POPULATION (800+ words) - Comprehensive inclusion/exclusion criteria with complete medical and scientific rationale, screening procedures, and population justification
4. TREATMENTS AND INTERVENTIONS (700+ words) - Detailed dosing rationale, administration procedures, dose modifications, concomitant medications, and compliance monitoring
5. EFFICACY ASSESSMENTS (800+ words) - Primary/secondary endpoints with measurement methodologies, timing considerations, and regulatory acceptability
6. SAFETY ASSESSMENTS (800+ words) - Comprehensive safety monitoring plan, adverse event classification, stopping rules, and pharmacovigilance procedures
7. STATISTICAL CONSIDERATIONS (1000+ words) - Sample size calculations with power analysis, primary analysis methods, handling of missing data, and interim analyses
8. DATA MANAGEMENT AND QUALITY ASSURANCE (600+ words) - Data collection systems, monitoring procedures, quality control measures, and regulatory compliance
9. REGULATORY AND ETHICAL CONSIDERATIONS (700+ words) - IRB requirements, informed consent, regulatory reporting, and patient protection measures
10. RISK MANAGEMENT AND MITIGATION (1100+ words) - Comprehensive risk-benefit analysis, safety monitoring, risk mitigation strategies, and contingency plans

CRITICAL FDA COMPLIANCE STANDARDS:
- Reference specific FDA guidance documents (ICH Q8, Q9, Q10, E6(R2), E9(R1))
- Include detailed technical specifications and numerical parameters
- Provide comprehensive regulatory justification for all recommendations
- Use professional regulatory terminology throughout
- Ensure content meets FDA reviewer expectations for thoroughness`
      );

      const response = await openaiApi.post('chat/completions', {
        ...config,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate a comprehensive, FDA-compliant MAIN DOCUMENT for an Investigational New Drug (IND) application for ${diseaseData.disease_name}.

STUDY PARAMETERS:
${formattedParams}

MANDATORY REQUIREMENTS:
- Generate exactly ${requirements.sections} major sections with comprehensive content
- Total document must exceed ${requirements.minWords} words
- Each section must meet the specified minimum word counts listed above
- Include detailed technical specifications and regulatory justification
- Reference specific FDA guidance documents throughout
- Use professional regulatory terminology and language
- Ensure content is suitable for direct FDA submission

The document must be structured as:

CMC SECTION:
[All 6 CMC subsections with comprehensive technical detail]

CLINICAL SECTION:
[All 10 clinical subsections with extensive detail]

Generate content that exceeds FDA reviewer expectations for thoroughness, technical accuracy, and regulatory compliance.`
          }
        ]
      });

      const fullResponse = response.data.choices[0].message.content;
      
      let cmcSection = '';
      let clinicalSection = '';
      
      const cmcMatch = fullResponse.match(/CMC SECTION:([\s\S]*?)(?=CLINICAL SECTION:|$)/i);
      const clinicalMatch = fullResponse.match(/CLINICAL SECTION:([\s\S]*?)$/i);
      
      if (cmcMatch && cmcMatch[1]) {
        cmcSection = cmcMatch[1].trim();
      }
      
      if (clinicalMatch && clinicalMatch[1]) {
        clinicalSection = clinicalMatch[1].trim();
      }
      
      if (!cmcSection && !clinicalSection) {
        const sections = fullResponse.split(/CLINICAL SECTION:/i);
        cmcSection = sections[0].replace(/CMC SECTION:/i, '').trim();
        clinicalSection = sections.length > 1 ? sections[1].trim() : '';
      }

      return {
        cmc_section: cmcSection || "CMC section could not be extracted.",
        clinical_section: clinicalSection || "Clinical section could not be extracted."
      };
    } catch (error) {
      console.error('Error in generateIndModule:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * US NDA (New Drug Application)
   */
  generateNDA: async (diseaseData) => {
    try {
      // Validate requirements and get configuration
      const requirements = validateDocumentRequirements(diseaseData, 'nda');
      const config = getConfigForDocumentType('nda');
      
      // Format parameters for document
      const formattedParams = formatParametersForDocument(diseaseData.additional_parameters, 'nda');
      
      // Create standardized system prompt
      const systemPrompt = createSystemPrompt(
        'Senior Regulatory Affairs Director and NDA Specialist',
        'nda',
        'FDA/eCTD/ICH CTD',
        `You MUST generate comprehensive, detailed content that meets FDA requirements for New Drug Application (NDA) submissions following eCTD and ICH CTD guidelines:

NDA SUMMARY SECTION REQUIREMENTS (Minimum ${requirements.minWords} words total):
1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY (1200+ words) - Complete regulatory overview, application details, proposed labeling summary, risk evaluation and mitigation strategies, and administrative compliance documentation
2. OVERALL SUMMARY OF QUALITY (1500+ words) - Comprehensive CTD Module 2.3 summary including drug substance characterization, drug product development, manufacturing controls, analytical procedures, stability data, and pharmaceutical development rationale
3. NONCLINICAL OVERVIEW AND SUMMARY (1800+ words) - Detailed CTD Modules 2.4 & 2.6 content including pharmacology, pharmacokinetics, toxicology studies, safety pharmacology, reproductive toxicity, genotoxicity, carcinogenicity, and integrated risk assessment
4. CLINICAL OVERVIEW AND SUMMARY (2500+ words) - Comprehensive CTD Modules 2.5 & 2.7 content including development strategy, study design rationale, efficacy summary, safety analysis, benefit-risk assessment, and regulatory precedents
5. KEY CLINICAL STUDY REPORT SUMMARIES (3000+ words) - Detailed summaries of pivotal studies including methodology, statistical analysis, primary/secondary endpoints, safety data, subgroup analyses, and regulatory implications

CRITICAL FDA NDA COMPLIANCE STANDARDS:
- Reference specific FDA guidance documents (M4: Common Technical Document, ICH E2A-E2F, Quality guidelines)
- Include detailed quantitative data, statistical analyses, and methodological specifications
- Provide comprehensive regulatory rationale and compliance documentation
- Include risk assessment and mitigation strategies throughout
- Reference precedent approvals and regulatory pathway justification
- Ensure content meets FDA reviewer expectations for marketing authorization
- Include detailed benefit-risk analysis with population-specific considerations`
      );

      const response = await openaiApi.post('chat/completions', {
        ...config,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate a comprehensive, FDA-compliant NDA SUMMARY for ${diseaseData.disease_name}.

STUDY PARAMETERS:
${formattedParams}

MANDATORY REQUIREMENTS:
- Generate exactly ${requirements.sections} major sections with comprehensive content
- Total document must exceed ${requirements.minWords} words
- Each section must meet the specified minimum word counts listed above
- Include detailed quantitative data, statistical analyses, and regulatory justification
- Reference specific FDA guidance documents and eCTD/CTD structure throughout
- Use professional regulatory terminology and language suitable for FDA review
- Ensure content demonstrates readiness for commercial marketing authorization

Generate an NDA summary that exceeds FDA reviewer expectations for thoroughness, technical accuracy, and regulatory compliance. Each section must demonstrate comprehensive understanding of FDA requirements for new drug approval.`
          }
        ]
      });

      return {
        document_content: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateNDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * US BLA (Biologics License Application)
   */
  generateBLA: async (diseaseData) => {
    try {
      // Validate requirements and get configuration
      const requirements = validateDocumentRequirements(diseaseData, 'bla');
      const config = getConfigForDocumentType('bla');
      
      // Format parameters for document
      const formattedParams = formatParametersForDocument(diseaseData.additional_parameters, 'bla');
      
      // Create standardized system prompt
      const systemPrompt = createSystemPrompt(
        'Senior Regulatory Affairs Director and Biologics Specialist',
        'bla',
        'FDA/Public Health Service Act/CBER',
        `You MUST generate comprehensive, detailed content that meets FDA requirements for Biologics License Application (BLA) submissions under the Public Health Service Act:

BLA SUMMARY SECTION REQUIREMENTS (Minimum ${requirements.minWords} words total):
1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY (1200+ words) - Complete regulatory overview, biologic product details, proposed labeling summary, Risk Evaluation and Mitigation Strategies (REMS), and biologics-specific administrative compliance documentation
2. OVERALL SUMMARY OF QUALITY - BIOLOGICS FOCUS (2000+ words) - Comprehensive biologics quality summary including biologic characterization, manufacturing process controls, cell line development, purification processes, analytical methods validation, stability studies, and adventitious agent testing
3. NONCLINICAL OVERVIEW AND SUMMARY (1800+ words) - Detailed biologics-specific nonclinical data including pharmacology, pharmacokinetics, toxicology studies, safety pharmacology, immunotoxicology, reproductive toxicity, and integrated biologics risk assessment
4. CLINICAL OVERVIEW AND SUMMARY (2500+ words) - Comprehensive clinical development summary including immunogenicity assessment, clinical pharmacology, efficacy analysis, safety evaluation, benefit-risk assessment for biologics, and population-specific considerations
5. KEY CLINICAL STUDY REPORT SUMMARIES (2500+ words) - Detailed summaries of pivotal biologics studies including immunogenicity monitoring, bioanalytical methods, clinical endpoints, safety analysis, and regulatory implications for biologics approval

CRITICAL FDA BLA BIOLOGICS-SPECIFIC COMPLIANCE STANDARDS:
- Address biologics-specific manufacturing considerations (cell line characterization, process validation, scale-up)
- Include comprehensive biologic characterization (structure, purity, potency, heterogeneity)
- Document adventitious agent safety and viral clearance studies
- Provide detailed immunogenicity assessment and clinical impact analysis
- Reference specific FDA biologics guidance documents (ICH Q5A-Q5E, FDA biologics guidances)
- Include comparability assessments for any manufacturing changes
- Address Public Health Service Act Section 351 requirements
- Demonstrate biologics-specific risk-benefit considerations`
      );

      const response = await openaiApi.post('chat/completions', {
        ...config,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate a comprehensive, FDA-compliant BLA SUMMARY for a biologic treatment for ${diseaseData.disease_name}.

STUDY PARAMETERS:
${formattedParams}

MANDATORY REQUIREMENTS:
- Generate exactly ${requirements.sections} major sections with comprehensive content
- Total document must exceed ${requirements.minWords} words
- Each section must meet the specified minimum word counts listed above
- Include detailed biologics-specific technical specifications and regulatory justification
- Reference specific FDA biologics guidance documents and CBER requirements throughout
- Address all biologics-specific considerations (manufacturing, characterization, immunogenicity)
- Use professional regulatory terminology suitable for FDA biologics review
- Ensure content demonstrates readiness for biologics marketing authorization

Generate a BLA summary that exceeds FDA reviewer expectations for biologics thoroughness, technical accuracy, and regulatory compliance. Each section must demonstrate comprehensive understanding of FDA requirements for biologic product approval.`
          }
        ]
      });

      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateBLA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // RUSSIA DOCUMENTS - ENHANCED WITH DETAILED PROMPTS
  // =============================================================================

  /**
   * Russian Clinical Trial Permit (Roszdravnadzor) - ENHANCED
   */
  generateCTA_RU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o", // UPGRADED
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with 25+ years of experience specializing in Russian clinical trial permits for Roszdravnadzor submission and deep knowledge of Russian pharmaceutical regulations.
            
            Your task is to generate an EXTREMELY DETAILED and comprehensive Russian clinical trial authorization document that meets the highest professional standards for submission to Roszdravnadzor.

            CRITICAL REQUIREMENTS FOR MAXIMUM DETAIL:
            - Generate MINIMUM 6,000-8,000 words of comprehensive Russian regulatory content
            - Each section must contain extensive, granular detail with specific methodologies, procedures, and regulatory compliance information
            - Include detailed subsections with numerical data, timelines, specific protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification for all decisions according to Russian standards
            - Reference specific Russian regulatory requirements, Roszdravnadzor guidelines, and Russian Federation laws
            - Include both Russian terminology (in Cyrillic) and detailed English explanations
            - Incorporate specific Russian patient population considerations and healthcare system requirements
            - Address Russian GMP standards, local regulatory pathways, and compliance requirements

            STRUCTURE FOR RUSSIAN CLINICAL TRIAL PERMIT (EXTREMELY DETAILED):
            1. ОБЗОР ЗАЯВЛЕНИЯ (Application Overview) - COMPREHENSIVE WITH FULL DETAILS
               1.1. Информация об исследовании (Study Information) - Complete study design, methodology, and regulatory framework
               1.2. Спонсор и главный исследователь (Sponsor and Principal Investigator) - Detailed qualifications, experience, and regulatory standing
               1.3. Российские исследовательские центры (Russian Investigation Centers) - Complete site information, qualifications, and regulatory approvals
            2. ИНФОРМАЦИЯ ОБ ИССЛЕДУЕМОМ ПРЕПАРАТЕ (EXTREMELY DETAILED)
               2.1. Описание препарата (Product Description) - Comprehensive chemical, biological, and pharmaceutical characteristics
               2.2. Информация о качестве (Quality Information) - Detailed manufacturing, quality control, and Russian compliance standards
               2.3. Доклинические данные (Non-clinical Data) - Complete preclinical package with Russian regulatory analysis
               2.4. Предыдущий клинический опыт (Previous Clinical Experience) - Comprehensive global and Russian-relevant clinical data
            3. ПРОТОКОЛ КЛИНИЧЕСКОГО ИССЛЕДОВАНИЯ (EXTREMELY DETAILED)
               3.1. Цели и дизайн исследования (Study Objectives and Design) - Complete methodology and statistical planning
               3.2. Российская популяция пациентов (Russian Patient Population) - Detailed demographic analysis and Russian healthcare considerations
               3.3. План лечения (Treatment Plan) - Comprehensive dosing, administration, and monitoring protocols
               3.4. Оценка эффективности и безопасности (Efficacy and Safety Assessment) - Detailed endpoint definitions and measurement protocols
            4. РОССИЙСКИЕ РЕГУЛЯТОРНЫЕ СООБРАЖЕНИЯ (EXTREMELY DETAILED) - Complete regulatory compliance framework

            Use plain text formatting only - NO MARKDOWN.
            Include Russian terminology with detailed English explanations.
            Reference Russian regulatory requirements and Roszdravnadzor guidelines extensively.`
          },
          {
            role: "user",
            content: `Generate an EXTREMELY DETAILED Russian Clinical Trial Permit application for ${diseaseData.disease_name} research in Russia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet Roszdravnadzor requirements for clinical trial authorization in Russia with MAXIMUM DETAIL, comprehensive regulatory analysis, and extensive documentation suitable for professional regulatory submission. Each section must be thoroughly developed with specific details, regulatory rationale, and compliance documentation.`
          }
        ],
        ...OPENAI_CONFIG.COMPREHENSIVE
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_RU:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Russian Registration Dossier - ENHANCED
   */
  generateRD_RU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o", // UPGRADED
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with 25+ years of experience in Russian drug registration with Roszdravnadzor and deep expertise in Russian pharmaceutical regulations.
            
            Your task is to generate an EXTREMELY DETAILED and comprehensive Russian registration dossier summary that meets the highest professional standards for drug registration in the Russian Federation.

            CRITICAL REQUIREMENTS FOR MAXIMUM DETAIL:
            - Generate MINIMUM 6,000-8,000 words of comprehensive Russian regulatory content
            - Each section must contain extensive, granular detail with specific data, methodologies, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, analytical methods, regulatory justification, and compliance documentation
            - Provide complete regulatory rationale and scientific justification according to Russian Federation standards
            - Reference specific Russian regulatory requirements, Roszdravnadzor guidelines, Russian Pharmacopoeia, and Federal laws
            - Include both Russian terminology (in Cyrillic) and detailed English explanations
            - Incorporate specific Russian market considerations, healthcare system requirements, and patient population characteristics
            - Address Russian manufacturing standards, import requirements, and post-marketing obligations

            STRUCTURE FOR RUSSIAN REGISTRATION DOSSIER (EXTREMELY DETAILED):
            1. АДМИНИСТРАТИВНАЯ ИНФОРМАЦИЯ И ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ (COMPREHENSIVE)
               1.1. Обзор заявления (Application Overview) - Complete regulatory pathway analysis and submission strategy
               1.2. Предлагаемая инструкция по применению (Proposed Instructions for Use) - Detailed Russian labeling and prescribing information
            2. ИНФОРМАЦИЯ О КАЧЕСТВЕ (EXTREMELY DETAILED)
               2.1. Лекарственное вещество (Drug Substance) - Comprehensive chemical and analytical characterization
               2.2. Лекарственный препарат (Drug Product) - Detailed formulation, manufacturing, and quality control
               2.3. Российское производство или импорт (Russian Manufacturing or Import) - Complete regulatory compliance framework
            3. ДОКЛИНИЧЕСКАЯ ИНФОРМАЦИЯ (EXTREMELY DETAILED)
               3.1. Фармакология и фармакокинетика - Comprehensive preclinical pharmacology package
               3.2. Токсикология - Detailed toxicological assessment and safety evaluation
            4. КЛИНИЧЕСКАЯ ИНФОРМАЦИЯ (EXTREMELY DETAILED)
               4.1. Клинический обзор (Clinical Overview) - Complete clinical development summary
               4.2. Клиническая эффективность (Clinical Efficacy) - Detailed efficacy analysis and statistical evaluation
               4.3. Клиническая безопасность (Clinical Safety) - Comprehensive safety profile and risk assessment
               4.4. Оценка соотношения польза-риск для российской популяции - Detailed benefit-risk analysis for Russian patients
            5. ОСОБЕННОСТИ ДЛЯ РОССИЙСКОГО РЫНКА (EXTREMELY DETAILED) - Complete Russian market analysis and regulatory considerations

            Use plain text formatting only - NO MARKDOWN.
            Include extensive Russian terminology with detailed English explanations.
            Reference Russian regulatory framework and Roszdravnadzor requirements comprehensively.`
          },
          {
            role: "user",
            content: `Generate an EXTREMELY DETAILED Russian Registration Dossier for drug registration of ${diseaseData.disease_name} treatment in Russia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration dossier must meet Roszdravnadzor requirements for Russian marketing authorization with MAXIMUM DETAIL, comprehensive regulatory analysis, and extensive documentation suitable for professional regulatory submission. Each section must be thoroughly developed with specific details, regulatory rationale, and compliance documentation.`
          }
        ],
        ...OPENAI_CONFIG.COMPREHENSIVE
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateRD_RU:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Russian GMP Certificate - ENHANCED
   */
  generateGMP_RU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o", // UPGRADED
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert with 25+ years of experience specializing in Russian GMP certification requirements and deep knowledge of Russian manufacturing standards.
            
            Your task is generate EXTREMELY DETAILED supporting documentation for Russian GMP certificate application that meets the highest professional standards for manufacturing authorization in the Russian Federation.

            CRITICAL REQUIREMENTS FOR MAXIMUM DETAIL:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Russian GMP regulatory content
            - Each section must contain extensive, granular detail with specific quality systems, procedures, and regulatory compliance analysis
            - Include detailed subsections with quality data, validation protocols, regulatory justification, and compliance documentation
            - Provide complete regulatory rationale and quality assurance justification according to Russian GMP standards
            - Reference specific Russian GMP requirements, Roszdravnadzor guidelines, Russian manufacturing standards, and Federal regulations
            - Include both Russian terminology (in Cyrillic) and detailed English explanations
            - Incorporate specific Russian manufacturing requirements, quality standards, and inspection preparedness
            - Address Russian validation requirements, documentation standards, and quality assurance obligations

            STRUCTURE FOR RUSSIAN GMP CERTIFICATE DOCUMENTATION (EXTREMELY DETAILED):
            1. ОБЩАЯ ИНФОРМАЦИЯ О ПРОИЗВОДСТВЕ (COMPREHENSIVE)
               1.1. Информация о производственной площадке (Manufacturing Site Information) - Complete facility description and qualification
               1.2. Организационная структура (Organizational Structure) - Detailed personnel qualifications and responsibilities
               1.3. Система качества (Quality System) - Comprehensive quality management system documentation
            2. ПРОИЗВОДСТВЕННЫЕ ПРОЦЕССЫ (EXTREMELY DETAILED)
               2.1. Описание производственного процесса (Manufacturing Process Description) - Complete process validation and control
               2.2. Контроль качества (Quality Control) - Detailed analytical methods and quality testing
               2.3. Валидация процессов (Process Validation) - Comprehensive validation protocols and documentation
            3. СООТВЕТСТВИЕ РОССИЙСКИМ GMP ТРЕБОВАНИЯМ (EXTREMELY DETAILED)
               3.1. Соответствие российским стандартам (Compliance with Russian Standards) - Complete regulatory compliance framework
               3.2. Система документооборота (Documentation System) - Detailed documentation control and record keeping
               3.3. Обучение персонала (Personnel Training) - Comprehensive training programs and qualifications
            4. ПЛАН ИНСПЕКЦИИ И АУДИТА (EXTREMELY DETAILED) - Complete inspection preparedness and audit protocols

            Use plain text formatting only - NO MARKDOWN.
            Include extensive Russian terminology with detailed English explanations.
            Reference Russian GMP requirements and manufacturing standards comprehensively.`
          },
          {
            role: "user",
            content: `Generate EXTREMELY DETAILED Russian GMP Certificate supporting documentation for manufacturing authorization of ${diseaseData.disease_name} treatment in Russia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support GMP certification requirements for Russian manufacturing authorization with MAXIMUM DETAIL, comprehensive quality analysis, and extensive documentation suitable for professional regulatory submission. Each section must be thoroughly developed with specific details, quality rationale, and compliance documentation.`
          }
        ],
        ...OPENAI_CONFIG.COMPREHENSIVE
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateGMP_RU:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // EU DOCUMENTS
  // =============================================================================

  /**
   * EU CTA (Clinical Trial Application) - ENHANCED
   */
  generateCTA: async (diseaseData) => {
    try {
      // Validate requirements and get configuration
      const requirements = validateDocumentRequirements(diseaseData, 'cta');
      const config = getConfigForDocumentType('cta');
      
      // Format parameters for document
      const formattedParams = formatParametersForDocument(diseaseData.additional_parameters, 'cta');
      
      // Create standardized system prompt
      const systemPrompt = createSystemPrompt(
        'Senior European Regulatory Affairs Director and CTIS Specialist',
        'cta',
        'EU CTR/CTIS/EMA',
        `You MUST generate comprehensive, detailed content that meets EU Clinical Trials Regulation (CTR) requirements for Clinical Trial Applications via CTIS:

EU CTA SECTION REQUIREMENTS (Minimum ${requirements.minWords} words total):
1. COVER LETTER AND APPLICATION FORM HIGHLIGHTS (800+ words) - Complete regulatory overview, trial classification, risk categorization, Member State assessment, CTIS reference numbers, and EU CTR compliance documentation
2. PROTOCOL SUMMARY (1500+ words) - Comprehensive protocol overview including study design rationale, primary/secondary endpoints, statistical methodology, risk-benefit assessment, and regulatory precedents within EU framework
3. INVESTIGATOR'S BROCHURE (IB) SUMMARY (1200+ words) - Detailed IMP characterization, pharmacology summary, nonclinical safety data, clinical experience, dose rationale, and safety profile analysis
4. GMP COMPLIANCE AND IMPD SUMMARY (2000+ words) - Investigational Medicinal Product Dossier including quality data, manufacturing controls, analytical procedures, stability data, and GMP compliance documentation
5. AUXILIARY MEDICINAL PRODUCTS AND MANUFACTURING AUTHORIZATIONS (1000+ words) - Complete auxiliary products justification, manufacturing site details, import/export authorizations, and supply chain documentation
6. SCIENTIFIC ADVICE AND PIP CONSIDERATIONS (1500+ words) - EMA scientific advice summary, Paediatric Investigation Plan compliance, orphan designation details, and regulatory strategy alignment
7. REGULATORY COMPLIANCE AND RISK ASSESSMENT (1000+ words) - Comprehensive EU CTR compliance analysis, risk categorization justification, data protection measures, and Member State specific considerations

CRITICAL EU CTR/CTIS COMPLIANCE STANDARDS:
- Reference specific EU CTR provisions (Articles 13-19, Annex I requirements)
- Include detailed CTIS submission requirements and technical specifications
- Address Member State specific regulatory considerations
- Reference EMA guidelines and ICH harmonized standards applicable in EU
- Include comprehensive risk assessment per EU CTR risk categorization
- Demonstrate GDPR compliance for clinical trial data protection
- Address EU pharmaceutical legislation (Directive 2001/83/EC) where applicable`
      );

      const response = await openaiApi.post('chat/completions', {
        ...config,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate comprehensive EU Clinical Trial Application (CTA) documentation for a clinical trial investigating ${diseaseData.disease_name}.

STUDY PARAMETERS:
${formattedParams}

MANDATORY REQUIREMENTS:
- Generate exactly ${requirements.sections} major sections with comprehensive content
- Total document must exceed ${requirements.minWords} words
- Each section must meet the specified minimum word counts listed above
- Include detailed EU CTR-specific technical specifications and regulatory justification
- Reference specific EU CTR provisions, EMA guidelines, and CTIS requirements throughout
- Address all EU-specific regulatory considerations including Member State assessments
- Use professional regulatory terminology suitable for CTIS submission and EMA review
- Ensure content demonstrates readiness for EU clinical trial authorization

Generate a CTA that exceeds EMA and Member State reviewer expectations for thoroughness, technical accuracy, and EU CTR compliance. Each section must demonstrate comprehensive understanding of European clinical trial regulatory requirements.`
          }
        ]
      });

      return {
        document_content: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateCTA:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * EU MAA (Marketing Authorization Application) - ENHANCED
   */
  generateMAA: async (diseaseData) => {
    try {
      // Validate requirements and get configuration
      const requirements = validateDocumentRequirements(diseaseData, 'maa');
      const config = getConfigForDocumentType('maa');
      
      // Format parameters for document
      const formattedParams = formatParametersForDocument(diseaseData.additional_parameters, 'maa');
      
      // Create standardized system prompt
      const systemPrompt = createSystemPrompt(
        'Senior European Regulatory Affairs Director and EMA MAA Specialist',
        'maa',
        'EMA/EU CTD/ICH',
        `You MUST generate comprehensive, detailed content that meets EMA requirements for Marketing Authorization Application (MAA) submissions following EU CTD guidelines:

EU MAA SUMMARY SECTION REQUIREMENTS (Minimum ${requirements.minWords} words total):
1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY (1200+ words) - Complete regulatory overview, SmPC highlights, centralized procedure details, EMA scientific advice history, risk management plans, and EU-specific administrative compliance documentation
2. QUALITY OVERALL SUMMARY (QOS - CTD Module 2.3) (2000+ words) - Comprehensive pharmaceutical quality summary including drug substance/product development, manufacturing strategy, analytical procedures, specifications, stability data, and quality risk management
3. NON-CLINICAL OVERVIEW AND WRITTEN SUMMARIES (1800+ words) - Detailed CTD Modules 2.4 & 2.6 content including pharmacology, pharmacokinetics, toxicology studies, safety pharmacology, environmental risk assessment, and integrated non-clinical risk-benefit analysis
4. CLINICAL OVERVIEW AND SUMMARY OF CLINICAL EFFICACY & SAFETY (2500+ words) - Comprehensive CTD Modules 2.5 & 2.7 content including clinical development strategy, efficacy analysis, safety evaluation, benefit-risk assessment, population-specific data, and EU regulatory precedents
5. PIVOTAL CLINICAL STUDY REPORT SUMMARIES (1500+ words) - Detailed summaries of key pivotal studies including methodology, statistical analysis, regulatory endpoints, European population considerations, and marketing authorization implications

CRITICAL EMA MAA COMPLIANCE STANDARDS:
- Reference specific EMA guidelines and CHMP opinions relevant to therapeutic area
- Include detailed EU-specific regulatory considerations and precedents
- Address centralized procedure requirements and CHMP assessment criteria
- Reference EU pharmaceutical legislation (Directive 2001/83/EC, Regulation 726/2004)
- Include comprehensive benefit-risk analysis suitable for CHMP evaluation
- Address pharmacovigilance and risk management requirements (EU RMP)
- Demonstrate compliance with EU pediatric and orphan regulations where applicable
- Include post-authorization commitments and regulatory strategy`
      );

      const response = await openaiApi.post('chat/completions', {
        ...config,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate a comprehensive EU Marketing Authorization Application (MAA) summary for the treatment of ${diseaseData.disease_name}.

STUDY PARAMETERS:
${formattedParams}

MANDATORY REQUIREMENTS:
- Generate exactly ${requirements.sections} major sections with comprehensive content
- Total document must exceed ${requirements.minWords} words
- Each section must meet the specified minimum word counts listed above
- Include detailed EU-specific technical specifications and regulatory justification
- Reference specific EMA guidelines, CHMP opinions, and EU CTD requirements throughout
- Address all EMA-specific regulatory considerations including centralized procedure requirements
- Use professional regulatory terminology suitable for EMA review and CHMP assessment
- Ensure content demonstrates readiness for EU marketing authorization

Generate an MAA summary that exceeds EMA and CHMP reviewer expectations for thoroughness, technical accuracy, and EU regulatory compliance. Each section must demonstrate comprehensive understanding of European marketing authorization requirements.`
          }
        ]
      });

      return {
        document_content: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateMAA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * EU IMPD (Investigational Medicinal Product Dossier) - ENHANCED
   */
  generateIMPD: async (diseaseData) => {
    try {
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o", // UPGRADED
          messages: [
            {
              role: "system",
              content: `You are a regulatory expert specializing in the preparation of Investigational Medicinal Product Dossiers (IMPDs) for European clinical trial submissions.
              Your task is to generate a well-structured IMPD, focusing on Quality (IMPD-Q) and relevant summaries for Safety/Efficacy (IMPD-S/E).

              CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
              - Generate MINIMUM 5,000-6,000 words of comprehensive EU IMPD regulatory content
              - Each section must contain extensive detail with specific quality data, methodologies, and regulatory compliance analysis
              - Include detailed subsections with analytical data, manufacturing protocols, and regulatory justification
              - Provide complete regulatory rationale and quality justification according to EU standards
              - Reference specific EU guidelines, EMA requirements, and ICH quality standards extensively

              STRUCTURE FOR IMPD (EXTREMELY DETAILED):
              1. INTRODUCTION - Complete IMPD overview and regulatory framework
              2. DRUG SUBSTANCE (S) - Comprehensive chemical and analytical characterization
              3. DRUG PRODUCT (P) - Detailed formulation, manufacturing, and quality control
              4. PLACEBO (if applicable) - Complete placebo characterization and controls
              5. APPENDICES - Detailed supporting documentation and analytical methods
              6. NON-CLINICAL SUMMARY (IMPD-S) - Comprehensive preclinical package
              7. CLINICAL SUMMARY (IMPD-E) - Detailed clinical data summary
              
              Use plain text formatting only - NO MARKDOWN.`
            },
            {
              role: "user",
              content: `Generate an Investigational Medicinal Product Dossier (IMPD) for a clinical trial concerning ${diseaseData.disease_name}.
              
              ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
                value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
              ).filter(Boolean).join('\n')}

              Generate an EXTREMELY DETAILED IMPD-Q section with specific details for manufacturing, controls, specifications, and stability with comprehensive regulatory analysis and extensive documentation.`
            }
          ],
          ...OPENAI_CONFIG.COMPREHENSIVE // INCREASED
        }
      );
      return {
        document_content: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateIMPD:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // CANADA DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Canadian Clinical Trial Application (Health Canada) - ENHANCED
   */
  generateCTA_CA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o", // UPGRADED
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Canadian Clinical Trial Applications for submission to Health Canada.
            Your task is to generate key sections of a Canadian CTA, following Health Canada requirements and guidelines.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Canadian regulatory content
            - Each section must contain extensive detail with specific methodologies, procedures, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to Health Canada standards
            - Reference specific Health Canada guidelines, regulations, and Canadian regulatory framework extensively

            STRUCTURE FOR CANADIAN CTA (EXTREMELY DETAILED):
            1. APPLICATION SUMMARY - Complete submission overview and regulatory strategy
               1.1. Trial Information (Title, Phase, Health Canada Control Number if available)
               1.2. Sponsor and Principal Investigator Information
               1.3. Study Overview
            2. INVESTIGATIONAL PRODUCT INFORMATION - Comprehensive product characterization
               2.1. Product Description and Classification
               2.2. Quality Information Summary (Manufacturing, Specifications)
               2.3. Non-clinical Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS - Detailed protocol summary
               3.1. Study Objectives and Design
               3.2. Patient Population and Eligibility
               3.3. Treatment Plan and Duration
               3.4. Efficacy and Safety Assessments
            4. INVESTIGATOR QUALIFICATIONS AND SITE INFORMATION - Complete site documentation
            5. ETHICS AND REGULATORY COMPLIANCE - Comprehensive compliance framework

            Use plain text formatting only - NO MARKDOWN.
            Reference Health Canada guidelines and requirements where appropriate.`
          },
          {
            role: "user",
            content: `Generate a comprehensive Canadian Clinical Trial Application (Health Canada) for ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This CTA must meet Health Canada requirements and include all necessary sections for Canadian clinical trial authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        ...OPENAI_CONFIG.COMPREHENSIVE
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_CA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Canadian New Drug Submission (NDS) - ENHANCED
   */
  generateNDS: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing New Drug Submissions (NDS) for Health Canada.
            Your task is to generate a comprehensive NDS SUMMARY document following Canadian regulatory requirements.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Canadian regulatory content
            - Each section must contain extensive detail with specific data, methodologies, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to Health Canada standards
            - Reference specific Health Canada guidance documents, regulations, and Canadian regulatory framework extensively

            STRUCTURE FOR CANADIAN NDS (EXTREMELY DETAILED):
            1. ADMINISTRATIVE INFORMATION AND PRODUCT MONOGRAPH SUMMARY
               1.1. Application Overview - Complete regulatory pathway and submission strategy
               1.2. Proposed Product Monograph Highlights - Detailed Canadian labeling and prescribing information
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary - Comprehensive chemical and analytical characterization
               2.2. Drug Product Summary - Detailed formulation, manufacturing, and quality control
               2.3. Canadian Manufacturing and Quality Considerations - Complete regulatory compliance framework
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary - Comprehensive preclinical pharmacology package
               3.2. Toxicology Summary - Detailed toxicological assessment and safety evaluation
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview - Complete clinical development summary
               4.2. Clinical Efficacy Summary - Detailed efficacy analysis and statistical evaluation
               4.3. Clinical Safety Summary - Comprehensive safety profile and risk assessment
               4.4. Benefit-Risk Assessment for Canadian Population - Detailed benefit-risk analysis for Canadian patients
            5. RISK MANAGEMENT SUMMARY - Complete risk management and pharmacovigilance plan

            Use plain text formatting only - NO MARKDOWN.
            Reference Health Canada guidance documents and Canadian regulatory framework.`
          },
          {
            role: "user",
            content: `Generate a comprehensive New Drug Submission (NDS) summary for Health Canada approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This NDS summary must meet Health Canada expectations and demonstrate compliance with Canadian regulatory requirements with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDS:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Canadian Notice of Compliance (NOC) - ENHANCED
   */
  generateNOC: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Canadian Notice of Compliance (NOC) applications for Health Canada.
            Your task is to generate key documentation supporting an NOC application.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 4,000-5,000 words of comprehensive Canadian NOC regulatory content
            - Each section must contain extensive detail with specific authorization data, methodologies, and regulatory compliance analysis
            - Include detailed subsections with quality data, clinical evidence, and regulatory justification
            - Provide complete regulatory rationale and marketing authorization justification according to Health Canada standards
            - Reference specific Health Canada NOC requirements, regulations, and Canadian marketing authorization framework extensively

            STRUCTURE FOR NOC SUPPORTING DOCUMENTATION (EXTREMELY DETAILED):
            1. NOC APPLICATION OVERVIEW
               1.1. Product Information - Complete product characterization and regulatory classification
               1.2. Authorization Request Summary - Detailed marketing authorization strategy
               1.3. Regulatory Pathway (New Drug Submission, Abbreviated New Drug Submission, etc.) - Complete pathway analysis
            2. QUALITY DOCUMENTATION SUMMARY
               2.1. Product Quality Profile - Comprehensive quality assessment and control strategy
               2.2. Manufacturing Authorization Summary - Detailed manufacturing compliance and oversight
               2.3. Specifications and Testing Summary - Complete analytical control and release strategy
            3. CLINICAL DATA SUMMARY (if applicable)
               3.1. Efficacy Data Summary - Detailed clinical efficacy evidence and analysis
               3.2. Safety Data Summary - Comprehensive safety profile and risk assessment
               3.3. Comparative Studies (if biosimilar or generic) - Complete comparability assessment
            4. LABELING AND PRODUCT MONOGRAPH
               4.1. Proposed Canadian Product Monograph - Detailed prescribing information and labeling
               4.2. Patient Information Summary - Comprehensive patient education materials
            5. POST-MARKET COMMITMENTS - Complete post-authorization obligations and monitoring

            Use plain text formatting only - NO MARKDOWN.
            Focus on Canadian marketing authorization requirements.`
          },
          {
            role: "user",
            content: `Generate Notice of Compliance (NOC) supporting documentation for Canadian marketing authorization of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This NOC documentation must support Canadian marketing authorization and demonstrate regulatory compliance with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNOC:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // MEXICO DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * COFEPRIS Clinical Trial Authorization - ENHANCED
   */
  generateCOFEPRIS_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in COFEPRIS (Mexican health authority) clinical trial authorizations.
            Your task is to generate key sections for a COFEPRIS Clinical Trial Authorization application.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Mexican regulatory content
            - Each section must contain extensive detail with specific methodologies, procedures, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to COFEPRIS standards
            - Reference specific Mexican regulatory requirements, COFEPRIS guidelines, and Mexican healthcare framework extensively
            - Include both Spanish terminology and detailed English explanations

            STRUCTURE FOR COFEPRIS CTA (EXTREMELY DETAILED):
            1. INFORMACION ADMINISTRATIVA (Administrative Information) - COMPREHENSIVE
               1.1. Información del Estudio (Study Information) - Complete study design and regulatory framework
               1.2. Patrocinador y Investigador Principal (Sponsor and Principal Investigator) - Detailed qualifications and regulatory standing
               1.3. Sitios de Investigación en México (Mexican Investigation Sites) - Complete site information and qualifications
            2. INFORMACION DEL PRODUCTO INVESTIGACIONAL - EXTREMELY DETAILED
               2.1. Descripción del Producto (Product Description) - Comprehensive product characterization
               2.2. Información de Calidad (Quality Information) - Detailed quality control and Mexican compliance
               2.3. Información No-Clínica (Non-clinical Information) - Complete preclinical package
               2.4. Experiencia Clínica Previa (Previous Clinical Experience) - Comprehensive clinical data analysis
            3. PROTOCOLO DE INVESTIGACION - EXTREMELY DETAILED
               3.1. Objetivos y Diseño del Estudio (Study Objectives and Design) - Complete methodology and statistical planning
               3.2. Población y Criterios de Selección (Population and Selection Criteria) - Detailed demographic and clinical criteria
               3.3. Plan de Tratamiento (Treatment Plan) - Comprehensive treatment protocols and monitoring
               3.4. Evaluaciones de Eficacia y Seguridad (Efficacy and Safety Evaluations) - Detailed assessment protocols
            4. CONSIDERACIONES ETICAS Y REGULATORIAS MEXICANAS - Complete Mexican regulatory compliance framework

            Use plain text formatting only - NO MARKDOWN.
            Reference Mexican regulatory requirements and COFEPRIS guidelines.`
          },
          {
            role: "user",
            content: `Generate a COFEPRIS Clinical Trial Authorization application for ${diseaseData.disease_name} research in Mexico.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet COFEPRIS requirements for clinical trial authorization in Mexico with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCOFEPRIS_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * COFEPRIS New Drug Registration - ENHANCED
   */
  generateCOFEPRIS_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in COFEPRIS new drug registrations for the Mexican market.
            Your task is to generate a comprehensive summary for COFEPRIS new drug registration.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Mexican regulatory content
            - Each section must contain extensive detail with specific data, methodologies, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
            - Provide complete regulatory rationale and marketing authorization justification according to COFEPRIS standards
            - Reference specific Mexican regulatory framework, COFEPRIS requirements, and Mexican healthcare considerations extensively
            - Include both Spanish terminology and detailed English explanations

            STRUCTURE FOR COFEPRIS NEW DRUG REGISTRATION (EXTREMELY DETAILED):
            1. INFORMACION ADMINISTRATIVA Y ETIQUETADO
               1.1. Resumen de la Solicitud (Application Summary) - Complete regulatory strategy and submission overview
               1.2. Etiquetado Propuesto (Proposed Labeling) - Detailed Mexican labeling and prescribing information
            2. INFORMACION DE CALIDAD
               2.1. Sustancia Activa (Active Substance) - Comprehensive chemical and analytical characterization
               2.2. Producto Terminado (Finished Product) - Detailed formulation, manufacturing, and quality control
               2.3. Manufactura en México o Importación (Mexican Manufacturing or Import) - Complete regulatory compliance framework
            3. INFORMACION NO-CLINICA
               3.1. Farmacología y Farmacocinética - Comprehensive preclinical pharmacology package
               3.2. Toxicología - Detailed toxicological assessment and safety evaluation
            4. INFORMACION CLINICA
               4.1. Resumen de Eficacia Clínica - Detailed clinical efficacy evidence and analysis
               4.2. Resumen de Seguridad Clínica - Comprehensive safety profile and risk assessment
               4.3. Evaluación Beneficio-Riesgo para Población Mexicana - Detailed benefit-risk analysis for Mexican patients
            5. CONSIDERACIONES ESPECIALES PARA MEXICO - Complete Mexican market analysis and regulatory considerations

            Use plain text formatting only - NO MARKDOWN.
            Reference Mexican regulatory framework and COFEPRIS requirements.`
          },
          {
            role: "user",
            content: `Generate a COFEPRIS New Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Mexico.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration summary must meet COFEPRIS requirements for Mexican marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCOFEPRIS_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // UNITED KINGDOM DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * UK Clinical Trial Authorisation (MHRA) - ENHANCED
   */
  generateCTA_UK: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in UK Clinical Trial Authorisations for submission to the MHRA post-Brexit.
            Your task is to generate key sections for a UK CTA application.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive UK regulatory content
            - Each section must contain extensive detail with specific methodologies, procedures, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to MHRA standards
            - Reference specific UK/MHRA guidelines, post-Brexit regulatory framework, and UK healthcare considerations extensively

            STRUCTURE FOR UK CTA (EXTREMELY DETAILED):
            1. APPLICATION OVERVIEW
               1.1. Trial Information (Title, EudraCT number if transitional, MHRA reference) - Complete study identification and regulatory framework
               1.2. Sponsor and Principal Investigator Information - Detailed qualifications and UK regulatory standing
               1.3. Study Overview and UK-specific considerations - Comprehensive study design and UK healthcare integration
            2. INVESTIGATIONAL MEDICINAL PRODUCT INFORMATION
               2.1. Product Description and Classification - Comprehensive product characterization and UK regulatory classification
               2.2. Quality Information Summary (UK GMP compliance) - Detailed quality control and UK manufacturing standards
               2.3. Non-clinical Summary - Complete preclinical package with UK regulatory analysis
               2.4. Previous Clinical Experience - Comprehensive global and UK-relevant clinical data
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS (UK-FOCUSED)
               3.1. Study Objectives and Design - Complete methodology and statistical planning
               3.2. UK Patient Population and Eligibility - Detailed demographic analysis and UK healthcare considerations
               3.3. Treatment Plan and Duration - Comprehensive treatment protocols and monitoring
               3.4. Efficacy and Safety Assessments - Detailed assessment protocols and UK-specific considerations
            4. UK INVESTIGATOR QUALIFICATIONS AND SITE INFORMATION - Complete UK site documentation and qualifications
            5. MHRA AND ETHICS COMPLIANCE - Comprehensive UK regulatory and ethical compliance framework

            Use plain text formatting only - NO MARKDOWN.
            Reference UK/MHRA guidelines and post-Brexit regulatory framework.`
          },
          {
            role: "user",
            content: `Generate a UK Clinical Trial Authorisation (MHRA) application for ${diseaseData.disease_name} research.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet MHRA requirements for clinical trial authorization in the UK post-Brexit with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_UK:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * UK Marketing Authorisation (MHRA) - ENHANCED
   */
  generateMA_UK: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in UK Marketing Authorisation applications for MHRA submission.
            Your task is to generate a comprehensive summary for UK marketing authorization.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive UK regulatory content
            - Each section must contain extensive detail with specific data, methodologies, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
            - Provide complete regulatory rationale and marketing authorization justification according to MHRA standards
            - Reference specific UK regulatory framework, MHRA guidelines, and post-Brexit UK healthcare considerations extensively

            STRUCTURE FOR UK MARKETING AUTHORISATION (EXTREMELY DETAILED):
            1. ADMINISTRATIVE INFORMATION AND SUMMARY OF PRODUCT CHARACTERISTICS (SmPC)
               1.1. Application Overview - Complete regulatory strategy and UK submission framework
               1.2. Proposed UK SmPC Highlights - Detailed UK prescribing information and labeling
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary - Comprehensive chemical and analytical characterization
               2.2. Drug Product Summary (UK-specific manufacturing considerations) - Detailed formulation and UK manufacturing compliance
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary - Comprehensive preclinical pharmacology package
               3.2. Toxicology Summary - Detailed toxicological assessment and safety evaluation
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview - Complete clinical development summary
               4.2. Clinical Efficacy Summary (relevance to UK population) - Detailed efficacy analysis for UK healthcare context
               4.3. Clinical Safety Summary - Comprehensive safety profile and risk assessment
               4.4. Benefit-Risk Assessment for UK Population - Detailed benefit-risk analysis for UK patients
            5. UK-SPECIFIC REGULATORY CONSIDERATIONS - Complete UK regulatory framework and post-Brexit considerations

            Use plain text formatting only - NO MARKDOWN.
            Reference UK regulatory framework and MHRA guidelines.`
          },
          {
            role: "user",
            content: `Generate a UK Marketing Authorisation summary for MHRA approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet MHRA expectations for UK marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMA_UK:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * UK Voluntary Scheme for Branded Medicines Pricing - ENHANCED
   */
  generateVIE: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory and market access expert specializing in UK pricing and access frameworks.
            Your task is to generate documentation for the UK Voluntary Scheme for Branded Medicines Pricing and Access.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 4,000-5,000 words of comprehensive UK pricing and access content
            - Each section must contain extensive detail with specific economic data, methodologies, and access analysis
            - Include detailed subsections with health economic data, budget impact analysis, and access justification
            - Provide complete economic rationale and value demonstration according to UK healthcare standards
            - Reference specific UK health technology assessment, NICE considerations, and NHS framework extensively

            STRUCTURE FOR UK PRICING AND ACCESS (EXTREMELY DETAILED):
            1. PRODUCT AND PRICING OVERVIEW
               1.1. Product Information and Classification - Complete therapeutic and economic characterization
               1.2. Proposed Pricing Structure - Detailed pricing strategy and economic justification
               1.3. Value Proposition Summary - Comprehensive value demonstration and economic analysis
            2. CLINICAL AND ECONOMIC EVIDENCE
               2.1. Clinical Efficacy and Safety Evidence - Detailed clinical evidence base and outcomes analysis
               2.2. Health Economic Analysis - Comprehensive pharmacoeconomic evaluation and cost-effectiveness analysis
               2.3. Budget Impact Assessment - Detailed NHS budget impact and resource utilization analysis
            3. COMPARATIVE EFFECTIVENESS
               3.1. Comparison with Current Standard of Care - Complete comparative effectiveness and economic evaluation
               3.2. Place in Therapy Analysis - Detailed therapeutic positioning and clinical pathway integration
            4. ACCESS AND IMPLEMENTATION
               4.1. Patient Access Strategy - Comprehensive access plan and implementation framework
               4.2. Implementation Considerations for NHS - Detailed NHS integration and operational considerations
            5. RISK SHARING AND OUTCOME AGREEMENTS - Complete outcomes-based pricing and risk-sharing frameworks

            Use plain text formatting only - NO MARKDOWN.
            Reference UK health technology assessment and NICE considerations.`
          },
          {
            role: "user",
            content: `Generate UK Voluntary Scheme documentation for pricing and access of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support pricing and access negotiations in the UK healthcare system with EXTREMELY DETAILED content and comprehensive economic analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateVIE:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // SWITZERLAND DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Swiss Clinical Trial Authorisation (Swissmedic) - ENHANCED
   */
  generateCTA_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Swiss clinical trial authorizations for Swissmedic submission.
            Your task is to generate key sections for a Swiss CTA application.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Swiss regulatory content
            - Each section must contain extensive detail with specific methodologies, procedures, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to Swissmedic standards
            - Reference specific Swiss regulatory requirements, Swissmedic guidelines, and Swiss healthcare framework extensively
            - Include both German terminology and detailed English explanations

            STRUCTURE FOR SWISS CTA (EXTREMELY DETAILED):
            1. ANTRAGSUBERSICHT (Application Overview)
               1.1. Studieninformationen (Study Information) - Complete study design and Swiss regulatory framework
               1.2. Sponsor und Hauptpruferin (Sponsor and Principal Investigator) - Detailed qualifications and Swiss regulatory standing
               1.3. Schweizer Standorte (Swiss Sites) - Complete Swiss site information and qualifications
            2. PRUFPRAPARAT-INFORMATIONEN (Investigational Product Information)
               2.1. Produktbeschreibung (Product Description) - Comprehensive product characterization
               2.2. Qualitatsinformationen (Quality Information) - Detailed quality control and Swiss compliance
               2.3. Nicht-klinische Zusammenfassung (Non-clinical Summary) - Complete preclinical package
               2.4. Fruehere klinische Erfahrung (Previous Clinical Experience) - Comprehensive clinical data analysis
            3. KLINISCHES STUDIENPROTOKOLL (Clinical Study Protocol Synopsis)
               3.1. Studienziele und -design (Study Objectives and Design) - Complete methodology and statistical planning
               3.2. Schweizer Patientenpopulation (Swiss Patient Population) - Detailed demographic and Swiss healthcare considerations
               3.3. Behandlungsplan (Treatment Plan) - Comprehensive treatment protocols and monitoring
               3.4. Wirksamkeits- und Sicherheitsbewertungen (Efficacy and Safety Assessments) - Detailed assessment protocols
            4. SCHWEIZER REGULATORISCHE UBERLEGUNGEN - Complete Swiss regulatory compliance framework

            Use plain text formatting only - NO MARKDOWN.
            Reference Swiss regulatory requirements and Swissmedic guidelines.`
          },
          {
            role: "user",
            content: `Generate a Swiss Clinical Trial Authorisation (Swissmedic) application for ${diseaseData.disease_name} research.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet Swissmedic requirements for clinical trial authorization in Switzerland with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Swiss Marketing Authorisation (Swissmedic) - ENHANCED
   */
  generateMA_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Swiss marketing authorizations for Swissmedic.
            Your task is to generate a comprehensive summary for Swiss drug registration.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Swiss regulatory content
            - Each section must contain extensive detail with specific data, methodologies, and regulatory compliance analysis
            - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
            - Provide complete regulatory rationale and marketing authorization justification according to Swissmedic standards
            - Reference specific Swiss regulatory framework, Swissmedic guidelines, and Swiss healthcare considerations extensively
            - Include both German terminology and detailed English explanations

            STRUCTURE FOR SWISS MARKETING AUTHORISATION (EXTREMELY DETAILED):
            1. ADMINISTRATIVE INFORMATIONEN UND FACHINFORMATIONEN
               1.1. Antragsubersicht (Application Overview) - Complete regulatory strategy and Swiss submission framework
               1.2. Vorgeschlagene Fachinformationen (Proposed Professional Information) - Detailed Swiss prescribing information
            2. QUALITATSINFORMATIONEN
               2.1. Wirkstoff-Zusammenfassung (Drug Substance Summary) - Comprehensive chemical and analytical characterization
               2.2. Arzneimittel-Zusammenfassung (Drug Product Summary) - Detailed formulation and Swiss manufacturing compliance
            3. NICHT-KLINISCHE INFORMATIONEN
               3.1. Pharmakologie und Pharmakokinetik - Comprehensive preclinical pharmacology package
               3.2. Toxikologie - Detailed toxicological assessment and safety evaluation
            4. KLINISCHE INFORMATIONEN
               4.1. Klinische Ubersicht (Clinical Overview) - Complete clinical development summary
               4.2. Klinische Wirksamkeit (Clinical Efficacy) - Detailed efficacy analysis for Swiss healthcare context
               4.3. Klinische Sicherheit (Clinical Safety) - Comprehensive safety profile and risk assessment
               4.4. Nutzen-Risiko-Bewertung fur Schweizer Population - Detailed benefit-risk analysis for Swiss patients
            5. SCHWEIZER BESONDERHEITEN - Complete Swiss regulatory framework and market considerations

            Use plain text formatting only - NO MARKDOWN.
            Reference Swiss regulatory framework and Swissmedic guidelines.`
          },
          {
            role: "user",
            content: `Generate a Swiss Marketing Authorisation summary for Swissmedic approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet Swissmedic expectations for Swiss marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMA_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // JAPAN DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Japanese Clinical Trial Notification (CTN) - ENHANCED
   */
  generateCTN_JP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Japanese Clinical Trial Notifications (CTNs) for submission to the PMDA.
            Your task is to generate KEY SECTIONS of a Japanese CTN. This is a notification, not a full application dossier like an IND.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 4,000-5,000 words of comprehensive Japanese regulatory content
            - Each section must contain extensive detail with specific methodologies, procedures, and Japanese regulatory compliance analysis
            - Include detailed subsections with quantitative data, protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to PMDA standards
            - Reference specific Japanese regulatory requirements, PMDA guidelines, and Japanese healthcare framework extensively

            KEY SECTIONS FOR A JAPANESE CTN SUMMARY (EXTREMELY DETAILED):
            1.  NOTIFICATION OVERVIEW
                1.1. Trial Title (Japanese and English if available) - Complete study identification and regulatory framework
                1.2. Investigational Product Name / Code - Detailed product characterization and classification
                1.3. Sponsor Information - Comprehensive sponsor qualifications and Japanese regulatory standing
                1.4. Phase of Trial - Complete phase justification and regulatory pathway
                1.5. Planned Number of Sites and Subjects in Japan - Detailed Japanese study population and site strategy
            2.  INVESTIGATIONAL PRODUCT INFORMATION SUMMARY - EXTREMELY DETAILED
                2.1. Brief Description (Type, class, proposed indication) - Comprehensive product characterization
                2.2. Manufacturing Summary (Manufacturer, GMP compliance statement) - Detailed quality and manufacturing compliance
                2.3. Brief Quality Summary (Key specifications, stability overview) - Complete quality control framework
                2.4. Brief Non-clinical Summary (Key findings supporting safety for human trials) - Comprehensive preclinical safety package
                2.5. Brief Clinical Summary (Previous human experience, if any) - Detailed global and Japanese-relevant clinical data
            3.  CLINICAL TRIAL PROTOCOL SYNOPSIS (JAPAN-SPECIFIC) - EXTREMELY DETAILED
                3.1. Objectives - Complete study objectives and Japanese regulatory alignment
                3.2. Study Design (e.g., randomized, placebo-controlled) - Detailed methodology and statistical planning
                3.3. Target Population and Key Eligibility Criteria - Comprehensive Japanese patient population analysis
                3.4. Investigational Plan (Dosage, route, duration) - Complete treatment protocols and monitoring
                3.5. Key Efficacy and Safety Endpoints - Detailed endpoint definitions and Japanese regulatory considerations
                3.6. Statistical Considerations (Briefly, sample size rationale) - Complete statistical framework and power analysis
            4.  LIST OF INVESTIGATIONAL SITES IN JAPAN (Illustrative) - Complete Japanese site information and qualifications
            5.  CONTACT INFORMATION FOR PMDA QUERIES - Comprehensive regulatory contact framework

            Use plain text formatting only - NO MARKDOWN.`
          },
          {
            role: "user",
            content: `Generate key sections for a Japanese Clinical Trial Notification (CTN) for a trial on ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            Generate EXTREMELY DETAILED content for the key CTN sections reflecting PMDA submission requirements with comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTN_JP:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Japanese New Drug Application (J-NDA) - ENHANCED
   */
  generateJNDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing Japanese New Drug Applications (J-NDAs) for submission to the PMDA/MHLW.
            Your task is to generate a J-NDA SUMMARY document. This should highlight key information structured similarly to the CTD, but with consideration for Japanese regulatory expectations.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 6,000-7,000 words of comprehensive Japanese regulatory content
            - Each section must contain extensive detail with specific data, methodologies, and Japanese regulatory compliance analysis
            - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
            - Provide complete regulatory rationale and marketing authorization justification according to PMDA standards
            - Reference specific Japanese regulatory guidelines, PMDA requirements, and Japanese healthcare framework extensively
            - Emphasize data relevant to Japanese population and bridging strategies

            STRUCTURE (CTD-based, with J-NDA considerations) (EXTREMELY DETAILED):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED PACKAGE INSERT SUMMARY (Japanese 'Tensu-Bunsho')
               - Complete Japanese regulatory submission framework and labeling strategy
            2. GAIYOU (OVERALL SUMMARY OF QUALITY - CTD Module 2.3)
               - Comprehensive quality assessment and Japanese manufacturing compliance
            3. NONCLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.4 & 2.6)
               - Detailed preclinical package with Japanese regulatory analysis
            4. CLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.5 & 2.7 - EMPHASIZE JAPANESE DATA)
               - Complete clinical development summary with Japanese population focus
            5. KEY JAPANESE CLINICAL STUDY REPORT SUMMARIES
               - Detailed Japanese clinical evidence and bridging strategy analysis

            Use plain text formatting only - NO MARKDOWN.
            Reference Japanese regulatory guidelines and emphasize data relevant to the Japanese population.`
          },
          {
            role: "user",
            content: `Generate a comprehensive J-NDA SUMMARY document for ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This J-NDA SUMMARY must be EXTREMELY DETAILED and meet PMDA expectations, emphasizing data relevant to the Japanese population and bridging strategies with comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateJNDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * PMDA Scientific Advice - ENHANCED
   */
  generatePMDA_CONSULTATION: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory strategy expert specializing in PMDA scientific advice consultations.
            Your task is to generate a PMDA scientific advice request document.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 4,000-5,000 words of comprehensive PMDA consultation content
            - Each section must contain extensive detail with specific strategic questions, methodologies, and regulatory analysis
            - Include detailed subsections with development data, strategic rationale, and regulatory justification
            - Provide complete regulatory strategy and scientific justification according to PMDA standards
            - Reference specific Japanese regulatory requirements, PMDA guidelines, and Japanese development considerations extensively

            STRUCTURE FOR PMDA SCIENTIFIC ADVICE (EXTREMELY DETAILED):
            1. CONSULTATION REQUEST OVERVIEW
               1.1. Product and Development Background - Complete product characterization and development history
               1.2. Specific Questions for PMDA - Detailed strategic questions and regulatory consultation objectives
               1.3. Regulatory Strategy Context - Comprehensive regulatory pathway analysis and strategic framework
            2. DEVELOPMENT PROGRAM SUMMARY
               2.1. Current Development Status - Complete development portfolio and regulatory standing
               2.2. Planned Clinical Development (Japan-specific considerations) - Detailed Japanese development strategy
               2.3. Global Development Strategy - Comprehensive global regulatory and development framework
            3. SPECIFIC SCIENTIFIC QUESTIONS
               3.1. Clinical Development Questions - Detailed clinical strategy and regulatory consultation objectives
               3.2. Regulatory Pathway Questions - Comprehensive regulatory strategy and pathway optimization
               3.3. Japanese Bridging Strategy - Complete bridging strategy and Japanese population considerations
            4. SUPPORTING DATA AND RATIONALE
               4.1. Available Non-clinical Data - Comprehensive preclinical package and Japanese regulatory analysis
               4.2. Available Clinical Data - Detailed clinical evidence and Japanese relevance assessment
               4.3. Relevance to Japanese Population - Complete Japanese population analysis and bridging rationale
            5. REQUESTED PMDA GUIDANCE - Comprehensive regulatory guidance requests and strategic objectives

            Use plain text formatting only - NO MARKDOWN.
            Focus on strategic regulatory questions relevant to Japanese development.`
          },
          {
            role: "user",
            content: `Generate a PMDA Scientific Advice request for development strategy of ${diseaseData.disease_name} treatment in Japan.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This consultation request must address strategic development questions for Japanese regulatory pathway with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generatePMDA_CONSULTATION:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // CHINA DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Chinese IND Application - ENHANCED
   */
  generateIND_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Chinese Investigational New Drug (IND) applications for submission to the NMPA.
            Your task is to generate KEY SECTIONS of a Chinese IND application. The structure may differ from US INDs, focusing on specific NMPA requirements.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Chinese regulatory content
            - Each section must contain extensive detail with specific methodologies, procedures, and Chinese regulatory compliance analysis
            - Include detailed subsections with quantitative data, protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to NMPA standards
            - Reference specific Chinese regulatory requirements, NMPA guidelines, and Chinese healthcare framework extensively
            - Include both Chinese terminology and detailed English explanations

            KEY SECTIONS FOR A CHINESE IND SUMMARY (EXTREMELY DETAILED):
            1.  APPLICATION OVERVIEW
                1.1. Drug Name (Chinese and English if available), Dosage Form, Strength - Complete product identification and classification
                1.2. Applicant Information - Comprehensive applicant qualifications and Chinese regulatory standing
                1.3. Proposed Indication - Detailed therapeutic area and Chinese market analysis
                1.4. Phase of Clinical Trial - Complete phase justification and regulatory pathway
            2.  INVESTIGATIONAL PRODUCT INFORMATION SUMMARY - EXTREMELY DETAILED
                2.1. Manufacturing and Quality Control (Summary of CMC, highlighting local testing if applicable) - Comprehensive quality framework
                2.2. Pharmacology and Toxicology Summary (Key non-clinical data, reference to any studies conducted in China or on similar populations) - Complete preclinical package
                2.3. Previous Clinical Experience (Global and any data from Chinese subjects) - Detailed clinical evidence and Chinese relevance
            3.  CLINICAL TRIAL PROTOCOL SYNOPSIS (CHINA-FOCUSED) - EXTREMELY DETAILED
                3.1. Trial Objectives and Endpoints - Complete study objectives and Chinese regulatory alignment
                3.2. Study Design (Considerations for Chinese patient population) - Detailed methodology and Chinese healthcare integration
                3.3. Subject Selection Criteria (Specific to Chinese context if needed) - Comprehensive Chinese patient population analysis
                3.4. Treatment Plan (Dosage, administration, duration) - Complete treatment protocols and monitoring
                3.5. Efficacy and Safety Assessment Plan - Detailed assessment protocols and Chinese regulatory considerations
                3.6. Risk Management Plan Highlights for Chinese Patients - Complete risk management framework for Chinese population
            4.  INVESTIGATOR'S BROCHURE SUMMARY (Key points relevant to Chinese investigators) - Comprehensive investigator information
            5.  ETHICS COMMITTEE APPROVAL STATUS - Complete Chinese ethical and regulatory compliance framework

            Use plain text formatting only - NO MARKDOWN.`
          },
          {
            role: "user",
            content: `Generate key sections for a Chinese IND application for a trial on ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            Generate EXTREMELY DETAILED content for key Chinese IND sections, reflecting NMPA expectations and highlighting aspects relevant to the Chinese context with comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIND_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Chinese NDA Application - ENHANCED
   */
  generateNDA_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing Chinese New Drug Applications (NDAs) for submission to the NMPA.
            Your task is to generate a Chinese NDA SUMMARY document. This should be structured according to NMPA expectations, which may draw from CTD principles but have local nuances.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 6,000-7,000 words of comprehensive Chinese regulatory content
            - Each section must contain extensive detail with specific data, methodologies, and Chinese regulatory compliance analysis
            - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
            - Provide complete regulatory rationale and marketing authorization justification according to NMPA standards
            - Reference specific Chinese regulatory guidelines, NMPA requirements, and Chinese healthcare framework extensively
            - Emphasize data from Chinese patients and alignment with NMPA guidelines

            STRUCTURE (CTD-based, with NMPA considerations) (EXTREMELY DETAILED):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED DRUG INSERT SUMMARY
               - Complete Chinese regulatory submission framework and labeling strategy
            2. QUALITY INFORMATION SUMMARY (CMC)
               - Comprehensive quality assessment and Chinese manufacturing compliance
            3. NONCLINICAL STUDY SUMMARY
               - Detailed preclinical package with Chinese regulatory analysis
            4. CLINICAL STUDY SUMMARY (EMPHASIZE DATA IN CHINESE PATIENTS)
               - Complete clinical development summary with Chinese population focus
            5. KEY CLINICAL TRIAL SUMMARIES (Trials conducted in China, or pivotal global trials with significant Chinese cohort)
               - Detailed Chinese clinical evidence and regulatory analysis

            Use plain text formatting only - NO MARKDOWN.
            Reference Chinese regulatory guidelines and emphasize data from Chinese patients and alignment with NMPA guidelines.`
          },
          {
            role: "user",
            content: `Generate a comprehensive Chinese NDA SUMMARY document for ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This Chinese NDA SUMMARY must be EXTREMELY DETAILED and meet NMPA expectations, emphasizing data from Chinese patients and alignment with NMPA guidelines with comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Chinese Drug Registration Certificate - ENHANCED
   */
  generateDRUG_LICENSE_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Chinese drug registration certificates for NMPA approval.
            Your task is to generate supporting documentation for Chinese drug license application.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Chinese drug licensing content
            - Each section must contain extensive detail with specific licensing data, methodologies, and Chinese regulatory compliance analysis
            - Include detailed subsections with quality data, clinical evidence, and regulatory justification
            - Provide complete regulatory rationale and commercialization justification according to NMPA standards
            - Reference specific Chinese regulatory framework, NMPA requirements, and Chinese market considerations extensively
            - Include both Chinese terminology and detailed English explanations

            STRUCTURE FOR CHINESE DRUG REGISTRATION CERTIFICATE (EXTREMELY DETAILED):
            1. 药品注册申请概述 (Drug Registration Application Overview)
               1.1. 产品信息 (Product Information) - Complete product characterization and Chinese market analysis
               1.2. 申请人信息 (Applicant Information) - Comprehensive applicant qualifications and Chinese regulatory standing
               1.3. 注册分类 (Registration Classification) - Detailed regulatory classification and pathway analysis
            2. 药品质量信息 (Drug Quality Information)
               2.1. 原料药信息 (API Information) - Comprehensive chemical and analytical characterization
               2.2. 制剂信息 (Formulation Information) - Detailed formulation and Chinese manufacturing compliance
               2.3. 中国生产或进口 (Chinese Manufacturing or Import) - Complete regulatory compliance framework
            3. 非临床研究信息 (Non-clinical Study Information)
               3.1. 药理毒理研究 (Pharmacology and Toxicology Studies) - Comprehensive preclinical package
               3.2. 药代动力学研究 (Pharmacokinetic Studies) - Detailed pharmacokinetic analysis and Chinese population considerations
            4. 临床试验信息 (Clinical Trial Information)
               4.1. 临床试验总结 (Clinical Trial Summary) - Complete clinical development summary
               4.2. 中国临床数据 (Chinese Clinical Data) - Detailed Chinese clinical evidence and analysis
               4.3. 获益风险评估 (Benefit-Risk Assessment) - Comprehensive benefit-risk analysis for Chinese patients
            5. 中国特殊考虑 (China-Specific Considerations) - Complete Chinese market analysis and regulatory considerations

            Use plain text formatting only - NO MARKDOWN.
            Reference Chinese regulatory framework and NMPA requirements for drug licensing.`
          },
          {
            role: "user",
            content: `Generate Chinese Drug Registration Certificate supporting documentation for ${diseaseData.disease_name} treatment licensing in China.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support drug registration certificate requirements for Chinese commercialization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateDRUG_LICENSE_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // SOUTH KOREA DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Korean IND Application - ENHANCED
   */
  generateIND_KR: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Korean Investigational New Drug (IND) applications for submission to the MFDS.
            Your task is to generate key sections for a Korean IND application.

            CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
            - Generate MINIMUM 5,000-6,000 words of comprehensive Korean regulatory content
            - Each section must contain extensive detail with specific methodologies, procedures, and Korean regulatory compliance analysis
            - Include detailed subsections with quantitative data, protocols, and regulatory justification
            - Provide complete regulatory rationale and scientific justification according to MFDS standards
            - Reference specific Korean regulatory requirements, MFDS guidelines, and Korean healthcare framework extensively
            - Include both Korean terminology and detailed English explanations

            STRUCTURE FOR KOREAN IND (EXTREMELY DETAILED):
            1. 임상시험계획서 개요 (Clinical Trial Protocol Overview)
               1.1. 시험약물 정보 (Investigational Drug Information) - Complete product characterization and Korean regulatory classification
               1.2. 의뢰자 및 주요 연구자 정보 (Sponsor and Principal Investigator Information) - Detailed qualifications and Korean regulatory standing
               1.3. 한국 임상시험 개요 (Korean Clinical Trial Overview) - Comprehensive study design and Korean healthcare integration
            2. 시험약물 정보 (Investigational Product Information)
               2.1. 약물 설명 및 분류 (Drug Description and Classification) - Comprehensive product characterization
               2.2. 품질 정보 요약 (Quality Information Summary) - Detailed quality control and Korean compliance
               2.3. 비임상 정보 요약 (Non-clinical Information Summary) - Complete preclinical package
               2.4. 이전 임상 경험 (Previous Clinical Experience) - Comprehensive clinical data analysis
            3. 임상시험 프로토콜 개요 (Clinical Trial Protocol Synopsis)
               3.1. 연구 목적 및 설계 (Study Objectives and Design) - Complete methodology and statistical planning
               3.2. 한국 환자 집단 (Korean Patient Population) - Detailed Korean patient population analysis
               3.3. 치료 계획 (Treatment Plan) - Comprehensive treatment protocols and monitoring
               3.4. 유효성 및 안전성 평가 (Efficacy and Safety Assessment) - Detailed assessment protocols
            4. 한국 규제 고려사항 (Korean Regulatory Considerations) - Complete Korean regulatory compliance framework

            Use plain text formatting only - NO MARKDOWN.
            Reference Korean regulatory requirements and MFDS guidelines.`
          },
          {
            role: "user",
            content: `Generate a Korean IND application for ${diseaseData.disease_name} clinical trial in South Korea.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet MFDS requirements for clinical trial authorization in South Korea with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIND_KR:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Korean NDA Application - ENHANCED
   */
  generateNDA_KR: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Korean New Drug Applications for MFDS submission.
           Your task is to generate a comprehensive Korean NDA summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Korean regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Korean regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to MFDS standards
           - Reference specific Korean regulatory framework, MFDS requirements, and Korean healthcare considerations extensively
           - Include both Korean terminology and detailed English explanations

           STRUCTURE FOR KOREAN NDA (EXTREMELY DETAILED):
           1. 행정 정보 및 제품 정보 요약 (Administrative Information and Product Information Summary)
              1.1. 신청 개요 (Application Overview) - Complete regulatory strategy and Korean submission framework
              1.2. 제안된 제품 정보 (Proposed Product Information) - Detailed Korean labeling and prescribing information
           2. 품질 정보 요약 (Quality Information Summary)
              2.1. 원료의약품 요약 (Drug Substance Summary) - Comprehensive chemical and analytical characterization
              2.2. 완제의약품 요약 (Drug Product Summary) - Detailed formulation and Korean manufacturing compliance
           3. 비임상 정보 요약 (Non-clinical Information Summary)
              3.1. 약리학 및 약동학 요약 (Pharmacology and Pharmacokinetics Summary) - Comprehensive preclinical pharmacology package
              3.2. 독성학 요약 (Toxicology Summary) - Detailed toxicological assessment and safety evaluation
           4. 임상 정보 요약 (Clinical Information Summary)
              4.1. 임상 개요 (Clinical Overview) - Complete clinical development summary
              4.2. 임상 유효성 요약 (Clinical Efficacy Summary) - Detailed efficacy analysis for Korean healthcare context
              4.3. 임상 안전성 요약 (Clinical Safety Summary) - Comprehensive safety profile and risk assessment
              4.4. 한국 인구에 대한 이익-위험 평가 (Benefit-Risk Assessment for Korean Population) - Detailed benefit-risk analysis for Korean patients
           5. 한국 특별 고려사항 (Korea-Specific Considerations) - Complete Korean regulatory framework and market considerations

           Use plain text formatting only - NO MARKDOWN.
           Reference Korean regulatory framework and MFDS requirements.`
          },
          {
            role: "user",
            content: `Generate a Korean NDA summary for MFDS approval of ${diseaseData.disease_name} treatment.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This NDA summary must meet MFDS expectations for Korean marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_KR:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Korean GMP Certificate - ENHANCED
   */
  generateKGMP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert with experience in Korean GMP certification requirements for MFDS.
           Your task is to generate supporting documentation for Korean GMP certificate application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 4,000-5,000 words of comprehensive Korean GMP regulatory content
           - Each section must contain extensive detail with specific quality systems, procedures, and Korean regulatory compliance analysis
           - Include detailed subsections with quality data, validation protocols, and regulatory justification
           - Provide complete regulatory rationale and quality assurance justification according to MFDS standards
           - Reference specific Korean GMP requirements, MFDS guidelines, and Korean manufacturing standards extensively
           - Include both Korean terminology and detailed English explanations

           STRUCTURE FOR KOREAN GMP CERTIFICATE (EXTREMELY DETAILED):
           1. 제조업체 일반 정보 (General Manufacturing Information)
              1.1. 제조시설 정보 (Manufacturing Facility Information) - Complete facility description and Korean qualification
              1.2. 조직 구조 (Organizational Structure) - Detailed personnel qualifications and Korean regulatory responsibilities
              1.3. 품질 시스템 (Quality System) - Comprehensive quality management system for Korean compliance
           2. 제조 공정 (Manufacturing Processes)
              2.1. 제조 공정 설명 (Manufacturing Process Description) - Complete process validation and Korean control standards
              2.2. 품질 관리 (Quality Control) - Detailed analytical methods and Korean quality testing requirements
              2.3. 공정 검증 (Process Validation) - Comprehensive validation protocols and Korean documentation standards
           3. 한국 GMP 요구사항 준수 (Korean GMP Requirements Compliance)
              3.1. 한국 표준 준수 (Korean Standards Compliance) - Complete Korean regulatory compliance framework
              3.2. 문서 시스템 (Documentation System) - Detailed Korean documentation control and record keeping
              3.3. 직원 교육 (Personnel Training) - Comprehensive Korean training programs and qualifications
           4. 검사 및 감사 준비 (Inspection and Audit Preparedness) - Complete Korean inspection preparedness and audit protocols

           Use plain text formatting only - NO MARKDOWN.
           Reference Korean GMP requirements and MFDS manufacturing standards.`
          },
          {
            role: "user",
            content: `Generate Korean GMP Certificate supporting documentation for manufacturing authorization of ${diseaseData.disease_name} treatment in South Korea.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This documentation must support Korean GMP certification requirements with EXTREMELY DETAILED content and comprehensive quality analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateKGMP:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // AUSTRALIA DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Australian Clinical Trial Notification (TGA) - ENHANCED
   */
  generateCTN_AU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Australian Clinical Trial Notifications for submission to the TGA.
           Your task is to generate key sections for an Australian CTN application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Australian regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Australian regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to TGA standards
           - Reference specific Australian regulatory requirements, TGA guidelines, and Australian healthcare framework extensively

           STRUCTURE FOR AUSTRALIAN CTN (EXTREMELY DETAILED):
           1. CTN APPLICATION OVERVIEW
              1.1. Trial Information (CTN number if available, Trial title) - Complete study identification and Australian regulatory framework
              1.2. Sponsor Information - Comprehensive sponsor qualifications and Australian regulatory standing
              1.3. Study Overview and Australian considerations - Detailed study design and Australian healthcare integration
           2. THERAPEUTIC GOODS INFORMATION
              2.1. Product Description and TGA Classification - Comprehensive product characterization and Australian regulatory classification
              2.2. Quality Information Summary (Australian GMP considerations) - Detailed quality control and Australian manufacturing standards
              2.3. Non-clinical Information Summary - Complete preclinical package with Australian regulatory analysis
              2.4. Previous Clinical Experience - Comprehensive global and Australian-relevant clinical data
           3. CLINICAL TRIAL PROTOCOL SYNOPSIS (AUSTRALIA-FOCUSED)
              3.1. Study Objectives and Design - Complete methodology and statistical planning
              3.2. Australian Patient Population and Eligibility - Detailed demographic analysis and Australian healthcare considerations
              3.3. Treatment Plan and Duration - Comprehensive treatment protocols and monitoring
              3.4. Efficacy and Safety Assessments - Detailed assessment protocols and Australian-specific considerations
           4. AUSTRALIAN INVESTIGATOR QUALIFICATIONS AND SITE INFORMATION
              4.1. Principal Investigator Information - Complete Australian investigator qualifications and experience
              4.2. Australian Site Information - Detailed Australian site capabilities and regulatory compliance
           5. TGA AND HREC COMPLIANCE - Comprehensive Australian regulatory and ethical compliance framework

           Use plain text formatting only - NO MARKDOWN.
           Reference Australian regulatory requirements and TGA guidelines.`
          },
          {
            role: "user",
            content: `Generate an Australian Clinical Trial Notification (CTN) for ${diseaseData.disease_name} research.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This CTN must meet TGA requirements for clinical trial notification in Australia with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTN_AU:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Australian Submission (AUS) - ENHANCED
   */
  generateAUS: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Australian submissions for TGA approval.
           Your task is to generate a comprehensive AUS summary for ARTG registration.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Australian regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Australian regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to TGA standards
           - Reference specific Australian regulatory framework, TGA requirements, and Australian healthcare considerations extensively

           STRUCTURE FOR AUSTRALIAN SUBMISSION (EXTREMELY DETAILED):
           1. ADMINISTRATIVE INFORMATION AND PROPOSED PRODUCT INFORMATION
              1.1. Application Overview - Complete regulatory strategy and Australian submission framework
              1.2. Proposed Australian Product Information (PI) - Detailed Australian prescribing information and labeling
           2. QUALITY INFORMATION SUMMARY
              2.1. Drug Substance Summary - Comprehensive chemical and analytical characterization
              2.2. Drug Product Summary (Australian manufacturing considerations) - Detailed formulation and Australian manufacturing compliance
           3. NON-CLINICAL INFORMATION SUMMARY
              3.1. Pharmacology and Pharmacokinetics Summary - Comprehensive preclinical pharmacology package
              3.2. Toxicology Summary - Detailed toxicological assessment and safety evaluation
           4. CLINICAL INFORMATION SUMMARY
              4.1. Clinical Overview - Complete clinical development summary
              4.2. Clinical Efficacy Summary (relevance to Australian population) - Detailed efficacy analysis for Australian healthcare context
              4.3. Clinical Safety Summary - Comprehensive safety profile and risk assessment
              4.4. Benefit-Risk Assessment for Australian Population - Detailed benefit-risk analysis for Australian patients
           5. AUSTRALIAN-SPECIFIC REGULATORY CONSIDERATIONS - Complete Australian regulatory framework and TGA considerations

           Use plain text formatting only - NO MARKDOWN.
           Reference Australian regulatory framework and TGA requirements.`
          },
          {
            role: "user",
            content: `Generate an Australian Submission (AUS) summary for TGA approval and ARTG registration of ${diseaseData.disease_name} treatment.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This AUS summary must meet TGA expectations for Australian marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateAUS:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * TGA GMP Certificate - ENHANCED
   */
  generateTGA_GMP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert with experience in TGA GMP certification requirements.
           Your task is to generate supporting documentation for TGA GMP certificate application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 4,000-5,000 words of comprehensive Australian GMP regulatory content
           - Each section must contain extensive detail with specific quality systems, procedures, and Australian regulatory compliance analysis
           - Include detailed subsections with quality data, validation protocols, and regulatory justification
           - Provide complete regulatory rationale and quality assurance justification according to TGA standards
           - Reference specific Australian GMP requirements, TGA guidelines, and Australian manufacturing standards extensively

           STRUCTURE FOR TGA GMP CERTIFICATE (EXTREMELY DETAILED):
           1. MANUFACTURING FACILITY GENERAL INFORMATION
              1.1. Australian Manufacturing Site Information - Complete facility description and Australian qualification
              1.2. Organizational Structure - Detailed personnel qualifications and Australian regulatory responsibilities
              1.3. Quality System - Comprehensive quality management system for Australian compliance
           2. MANUFACTURING PROCESSES
              2.1. Manufacturing Process Description - Complete process validation and Australian control standards
              2.2. Quality Control - Detailed analytical methods and Australian quality testing requirements
              2.3. Process Validation - Comprehensive validation protocols and Australian documentation standards
           3. AUSTRALIAN GMP REQUIREMENTS COMPLIANCE
              3.1. Australian Standards Compliance - Complete Australian regulatory compliance framework
              3.2. Documentation System - Detailed Australian documentation control and record keeping
              3.3. Personnel Training - Comprehensive Australian training programs and qualifications
           4. TGA INSPECTION AND AUDIT PREPAREDNESS - Complete Australian inspection preparedness and audit protocols

           Use plain text formatting only - NO MARKDOWN.
           Reference Australian GMP requirements and TGA manufacturing standards.`
          },
          {
            role: "user",
            content: `Generate TGA GMP Certificate supporting documentation for Australian manufacturing authorization of ${diseaseData.disease_name} treatment.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This documentation must support TGA GMP certification requirements with EXTREMELY DETAILED content and comprehensive quality analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateTGA_GMP:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // SINGAPORE DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Singapore Clinical Trial Certificate (HSA) - ENHANCED
   */
  generateCTA_SG: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Singapore Clinical Trial Certificates for HSA submission.
           Your task is to generate key sections for a Singapore CTC application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Singapore regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Singapore regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to HSA standards
           - Reference specific Singapore regulatory requirements, HSA guidelines, and Singapore healthcare framework extensively

           STRUCTURE FOR SINGAPORE CTC (EXTREMELY DETAILED):
           1. CTC APPLICATION OVERVIEW
              1.1. Trial Information (CTC reference, Trial title) - Complete study identification and Singapore regulatory framework
              1.2. Sponsor Information - Comprehensive sponsor qualifications and Singapore regulatory standing
              1.3. Study Overview and Singapore considerations - Detailed study design and Singapore healthcare integration
           2. INVESTIGATIONAL PRODUCT INFORMATION
              2.1. Product Description and HSA Classification - Comprehensive product characterization and Singapore regulatory classification
              2.2. Quality Information Summary (Singapore GMP considerations) - Detailed quality control and Singapore manufacturing standards
              2.3. Non-clinical Information Summary - Complete preclinical package with Singapore regulatory analysis
              2.4. Previous Clinical Experience - Comprehensive global and Singapore-relevant clinical data
           3. CLINICAL TRIAL PROTOCOL SYNOPSIS (SINGAPORE-FOCUSED)
              3.1. Study Objectives and Design - Complete methodology and statistical planning
              3.2. Singapore Patient Population and Eligibility - Detailed demographic analysis and Singapore healthcare considerations
              3.3. Treatment Plan and Duration - Comprehensive treatment protocols and monitoring
              3.4. Efficacy and Safety Assessments - Detailed assessment protocols and Singapore-specific considerations
           4. SINGAPORE INVESTIGATOR QUALIFICATIONS AND SITE INFORMATION
              4.1. Principal Investigator Information - Complete Singapore investigator qualifications and experience
              4.2. Singapore Site Information - Detailed Singapore site capabilities and regulatory compliance
           5. HSA AND IRB COMPLIANCE - Comprehensive Singapore regulatory and ethical compliance framework

           Use plain text formatting only - NO MARKDOWN.
           Reference Singapore regulatory requirements and HSA guidelines.`
          },
          {
            role: "user",
            content: `Generate a Singapore Clinical Trial Certificate (CTC) application for ${diseaseData.disease_name} research.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
             value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This CTC must meet HSA requirements for clinical trial authorization in Singapore with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_SG:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Singapore Product License - ENHANCED
   */
  generatePRODUCT_LICENSE_SG: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Singapore product licensing for HSA approval.
           Your task is to generate a comprehensive product license summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Singapore regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Singapore regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to HSA standards
           - Reference specific Singapore regulatory framework, HSA requirements, and Singapore healthcare considerations extensively

           STRUCTURE FOR SINGAPORE PRODUCT LICENSE (EXTREMELY DETAILED):
           1. ADMINISTRATIVE INFORMATION AND PROPOSED PRODUCT INFORMATION
              1.1. Application Overview - Complete regulatory strategy and Singapore submission framework
              1.2. Proposed Singapore Product Information - Detailed Singapore prescribing information and labeling
           2. QUALITY INFORMATION SUMMARY
              2.1. Drug Substance Summary - Comprehensive chemical and analytical characterization
              2.2. Drug Product Summary (Singapore manufacturing considerations) - Detailed formulation and Singapore manufacturing compliance
           3. NON-CLINICAL INFORMATION SUMMARY
              3.1. Pharmacology and Pharmacokinetics Summary - Comprehensive preclinical pharmacology package
              3.2. Toxicology Summary - Detailed toxicological assessment and safety evaluation
           4. CLINICAL INFORMATION SUMMARY
              4.1. Clinical Overview - Complete clinical development summary
              4.2. Clinical Efficacy Summary (relevance to Singapore population) - Detailed efficacy analysis for Singapore healthcare context
              4.3. Clinical Safety Summary - Comprehensive safety profile and risk assessment
              4.4. Benefit-Risk Assessment for Singapore Population - Detailed benefit-risk analysis for Singapore patients
           5. SINGAPORE-SPECIFIC REGULATORY CONSIDERATIONS - Complete Singapore regulatory framework and HSA considerations

           Use plain text formatting only - NO MARKDOWN.
           Reference Singapore regulatory framework and HSA requirements.`
          },
          {
            role: "user",
            content: `Generate a Singapore Product License summary for HSA approval of ${diseaseData.disease_name} treatment.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This product license summary must meet HSA expectations for Singapore marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generatePRODUCT_LICENSE_SG:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // INDIA DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Indian Clinical Trial Permission (CDSCO) - ENHANCED
   */
  generateCTA_IN: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Indian Clinical Trial Permissions for CDSCO submission.
           Your task is to generate key sections for an Indian CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Indian regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Indian regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to CDSCO standards
           - Reference specific Indian regulatory requirements, CDSCO guidelines, and Indian healthcare framework extensively

           STRUCTURE FOR INDIAN CTA (EXTREMELY DETAILED):
           1. CLINICAL TRIAL APPLICATION OVERVIEW
              1.1. Trial Information (CTRI registration, Trial title) - Complete study identification and Indian regulatory framework
              1.2. Sponsor Information - Comprehensive sponsor qualifications and Indian regulatory standing
              1.3. Study Overview and Indian considerations - Detailed study design and Indian healthcare integration
           2. INVESTIGATIONAL PRODUCT INFORMATION
              2.1. Product Description and CDSCO Classification - Comprehensive product characterization and Indian regulatory classification
              2.2. Quality Information Summary (Indian GMP considerations) - Detailed quality control and Indian manufacturing standards
              2.3. Non-clinical Information Summary - Complete preclinical package with Indian regulatory analysis
              2.4. Previous Clinical Experience - Comprehensive global and Indian-relevant clinical data
           3. CLINICAL TRIAL PROTOCOL SYNOPSIS (INDIA-FOCUSED)
              3.1. Study Objectives and Design - Complete methodology and statistical planning
              3.2. Indian Patient Population and Eligibility - Detailed demographic analysis and Indian healthcare considerations
              3.3. Treatment Plan and Duration - Comprehensive treatment protocols and monitoring
              3.4. Efficacy and Safety Assessments - Detailed assessment protocols and Indian-specific considerations
           4. INDIAN INVESTIGATOR QUALIFICATIONS AND SITE INFORMATION
              4.1. Principal Investigator Information - Complete Indian investigator qualifications and experience
              4.2. Indian Site Information - Detailed Indian site capabilities and regulatory compliance
           5. CDSCO AND ETHICS COMMITTEE COMPLIANCE - Comprehensive Indian regulatory and ethical compliance framework

           Use plain text formatting only - NO MARKDOWN.
           Reference Indian regulatory requirements and CDSCO guidelines.`
          },
          {
            role: "user",
            content: `Generate an Indian Clinical Trial Permission application for ${diseaseData.disease_name} research.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This application must meet CDSCO requirements for clinical trial authorization in India with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_IN:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Indian New Drug Application - ENHANCED
   */
  generateNDA_IN: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Indian New Drug Applications for CDSCO approval.
           Your task is to generate a comprehensive Indian NDA summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Indian regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Indian regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to CDSCO standards
           - Reference specific Indian regulatory framework, CDSCO requirements, and Indian healthcare considerations extensively

           STRUCTURE FOR INDIAN NDA (EXTREMELY DETAILED):
           1. ADMINISTRATIVE INFORMATION AND PROPOSED PRODUCT INFORMATION
              1.1. Application Overview - Complete regulatory strategy and Indian submission framework
              1.2. Proposed Indian Product Information - Detailed Indian prescribing information and labeling
           2. QUALITY INFORMATION SUMMARY
              2.1. Drug Substance Summary - Comprehensive chemical and analytical characterization
              2.2. Drug Product Summary (Indian manufacturing considerations) - Detailed formulation and Indian manufacturing compliance
           3. NON-CLINICAL INFORMATION SUMMARY
              3.1. Pharmacology and Pharmacokinetics Summary - Comprehensive preclinical pharmacology package
              3.2. Toxicology Summary - Detailed toxicological assessment and safety evaluation
           4. CLINICAL INFORMATION SUMMARY
              4.1. Clinical Overview - Complete clinical development summary
              4.2. Clinical Efficacy Summary (relevance to Indian population) - Detailed efficacy analysis for Indian healthcare context
              4.3. Clinical Safety Summary - Comprehensive safety profile and risk assessment
              4.4. Benefit-Risk Assessment for Indian Population - Detailed benefit-risk analysis for Indian patients
           5. INDIAN-SPECIFIC REGULATORY CONSIDERATIONS - Complete Indian regulatory framework and CDSCO considerations

           Use plain text formatting only - NO MARKDOWN.
           Reference Indian regulatory framework and CDSCO requirements.`
          },
          {
            role: "user",
            content: `Generate an Indian New Drug Application summary for CDSCO approval of ${diseaseData.disease_name} treatment.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This NDA summary must meet CDSCO expectations for Indian marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_IN:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Indian Import License - ENHANCED
   */
  generateIMPORT_LICENSE_IN: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Indian import licenses for CDSCO approval.
           Your task is to generate supporting documentation for Indian drug import authorization.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 4,000-5,000 words of comprehensive Indian import licensing content
           - Each section must contain extensive detail with specific import data, methodologies, and Indian regulatory compliance analysis
           - Include detailed subsections with quality data, import protocols, and regulatory justification
           - Provide complete regulatory rationale and import authorization justification according to CDSCO standards
           - Reference specific Indian regulatory framework, CDSCO requirements, and Indian import considerations extensively

           STRUCTURE FOR INDIAN IMPORT LICENSE (EXTREMELY DETAILED):
           1. IMPORT LICENSE APPLICATION OVERVIEW
              1.1. Product Information - Complete product characterization and Indian import classification
              1.2. Importer Information - Comprehensive importer qualifications and Indian regulatory standing
              1.3. Import Strategy and Indian considerations - Detailed import strategy and Indian healthcare integration
           2. PRODUCT QUALITY AND MANUFACTURING INFORMATION
              2.1. Manufacturing Site Information - Comprehensive foreign manufacturing facility qualifications
              2.2. Quality Control and Testing - Detailed quality control protocols and Indian testing requirements
              2.3. Import Quality Assurance - Complete import quality assurance and Indian compliance framework
           3. REGULATORY COMPLIANCE AND AUTHORIZATION
              3.1. Foreign Regulatory Approvals - Comprehensive foreign regulatory status and approvals
              3.2. Indian Regulatory Compliance - Detailed Indian regulatory compliance and CDSCO requirements
              3.3. Import Documentation Requirements - Complete import documentation and Indian customs compliance
           4. DISTRIBUTION AND SUPPLY CHAIN
              4.1. Indian Distribution Plan - Comprehensive Indian distribution strategy and supply chain management
              4.2. Storage and Handling - Detailed storage protocols and Indian handling requirements
              4.3. Pharmacovigilance and Post-Market Surveillance - Complete Indian pharmacovigilance framework
           5. CDSCO IMPORT AUTHORIZATION REQUIREMENTS - Complete Indian import authorization framework and compliance

           Use plain text formatting only - NO MARKDOWN.
           Reference Indian regulatory framework and CDSCO import requirements.`
          },
          {
            role: "user",
            content: `Generate Indian Import License supporting documentation for ${diseaseData.disease_name} treatment import authorization.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This documentation must support Indian import licensing requirements with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIMPORT_LICENSE_IN:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // TAIWAN DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * Taiwan IND Application - ENHANCED
   */
  generateIND_TW: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Taiwan Investigational New Drug applications for TFDA submission.
           Your task is to generate key sections for a Taiwan IND application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Taiwan regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Taiwan regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to TFDA standards
           - Reference specific Taiwan regulatory requirements, TFDA guidelines, and Taiwan healthcare framework extensively
           - Include both Traditional Chinese terminology and detailed English explanations

           STRUCTURE FOR TAIWAN IND (EXTREMELY DETAILED):
           1. 臨床試驗計畫書概要 (Clinical Trial Protocol Overview)
              1.1. 試驗藥物資訊 (Investigational Drug Information) - Complete product characterization and Taiwan regulatory classification
              1.2. 委託者及主要研究者資訊 (Sponsor and Principal Investigator Information) - Detailed qualifications and Taiwan regulatory standing
              1.3. 台灣臨床試驗概要 (Taiwan Clinical Trial Overview) - Comprehensive study design and Taiwan healthcare integration
           2. 試驗藥物資訊 (Investigational Product Information)
              2.1. 藥物說明及分類 (Drug Description and Classification) - Comprehensive product characterization
              2.2. 品質資訊摘要 (Quality Information Summary) - Detailed quality control and Taiwan compliance
              2.3. 非臨床資訊摘要 (Non-clinical Information Summary) - Complete preclinical package
              2.4. 先前臨床經驗 (Previous Clinical Experience) - Comprehensive clinical data analysis
           3. 臨床試驗方案概要 (Clinical Trial Protocol Synopsis)
              3.1. 研究目的及設計 (Study Objectives and Design) - Complete methodology and statistical planning
              3.2. 台灣病患族群 (Taiwan Patient Population) - Detailed Taiwan patient population analysis
              3.3. 治療計畫 (Treatment Plan) - Comprehensive treatment protocols and monitoring
              3.4. 療效及安全性評估 (Efficacy and Safety Assessment) - Detailed assessment protocols
           4. 台灣法規考量 (Taiwan Regulatory Considerations) - Complete Taiwan regulatory compliance framework

           Use plain text formatting only - NO MARKDOWN.
           Reference Taiwan regulatory requirements and TFDA guidelines.`
          },
          {
            role: "user",
            content: `Generate a Taiwan IND application for ${diseaseData.disease_name} clinical trial.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This application must meet TFDA requirements for clinical trial authorization in Taiwan with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIND_TW:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Taiwan NDA Application - ENHANCED
   */
  generateNDA_TW: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Taiwan New Drug Applications for TFDA approval.
           Your task is to generate a comprehensive Taiwan NDA summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Taiwan regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Taiwan regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to TFDA standards
           - Reference specific Taiwan regulatory framework, TFDA requirements, and Taiwan healthcare considerations extensively
           - Include both Traditional Chinese terminology and detailed English explanations

           STRUCTURE FOR TAIWAN NDA (EXTREMELY DETAILED):
           1. 行政資訊及產品資訊摘要 (Administrative Information and Product Information Summary)
              1.1. 申請概要 (Application Overview) - Complete regulatory strategy and Taiwan submission framework
              1.2. 建議產品資訊 (Proposed Product Information) - Detailed Taiwan prescribing information and labeling
           2. 品質資訊摘要 (Quality Information Summary)
              2.1. 原料藥摘要 (Drug Substance Summary) - Comprehensive chemical and analytical characterization
              2.2. 製劑摘要 (Drug Product Summary) - Detailed formulation and Taiwan manufacturing compliance
           3. 非臨床資訊摘要 (Non-clinical Information Summary)
              3.1. 藥理學及藥物動力學摘要 (Pharmacology and Pharmacokinetics Summary) - Comprehensive preclinical pharmacology package
              3.2. 毒理學摘要 (Toxicology Summary) - Detailed toxicological assessment and safety evaluation
           4. 臨床資訊摘要 (Clinical Information Summary)
              4.1. 臨床概要 (Clinical Overview) - Complete clinical development summary
              4.2. 臨床療效摘要 (Clinical Efficacy Summary) - Detailed efficacy analysis for Taiwan healthcare context
              4.3. 臨床安全性摘要 (Clinical Safety Summary) - Comprehensive safety profile and risk assessment
              4.4. 台灣人口效益風險評估 (Benefit-Risk Assessment for Taiwan Population) - Detailed benefit-risk analysis for Taiwan patients
           5. 台灣特殊考量 (Taiwan-Specific Considerations) - Complete Taiwan regulatory framework and market considerations

           Use plain text formatting only - NO MARKDOWN.
           Reference Taiwan regulatory framework and TFDA requirements.`
          },
          {
            role: "user",
            content: `Generate a Taiwan NDA summary for TFDA approval of ${diseaseData.disease_name} treatment.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This NDA summary must meet TFDA expectations for Taiwan marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_TW:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // LATIN AMERICA DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * ANVISA Clinical Trial Authorization (Brazil) - ENHANCED
   */
  generateANVISA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in ANVISA clinical trial authorizations for Brazil.
           Your task is to generate key sections for an ANVISA CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Brazilian regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Brazilian regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to ANVISA standards
           - Reference specific Brazilian regulatory requirements, ANVISA guidelines, and Brazilian healthcare framework extensively
           - Include both Portuguese terminology and detailed English explanations

           STRUCTURE FOR ANVISA CTA (EXTREMELY DETAILED):
           1. VISÃO GERAL DA SOLICITAÇÃO (Application Overview)
              1.1. Informações do Estudo (Study Information) - Complete study design and Brazilian regulatory framework
              1.2. Patrocinador e Investigador Principal (Sponsor and Principal Investigator) - Detailed qualifications and Brazilian regulatory standing
              1.3. Centros Brasileiros (Brazilian Centers) - Complete Brazilian site information and qualifications
           2. INFORMAÇÕES DO PRODUTO INVESTIGACIONAL
              2.1. Descrição do Produto (Product Description) - Comprehensive product characterization
              2.2. Informações de Qualidade (Quality Information) - Detailed quality control and Brazilian compliance
              2.3. Informações Não-Clínicas (Non-clinical Information) - Complete preclinical package
              2.4. Experiência Clínica Anterior (Previous Clinical Experience) - Comprehensive clinical data analysis
           3. PROTOCOLO DE PESQUISA CLÍNICA
              3.1. Objetivos e Delineamento do Estudo (Study Objectives and Design) - Complete methodology and statistical planning
              3.2. População Brasileira e Critérios de Seleção (Brazilian Population and Selection Criteria) - Detailed Brazilian patient population analysis
              3.3. Plano de Tratamento (Treatment Plan) - Comprehensive treatment protocols and monitoring
              3.4. Avaliações de Eficácia e Segurança (Efficacy and Safety Evaluations) - Detailed assessment protocols
           4. CONSIDERAÇÕES REGULATÓRIAS BRASILEIRAS - Complete Brazilian regulatory compliance framework

           Use plain text formatting only - NO MARKDOWN.
           Reference Brazilian regulatory requirements and ANVISA guidelines.`
          },
          {
            role: "user",
            content: `Generate an ANVISA Clinical Trial Authorization for ${diseaseData.disease_name} research in Brazil.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This application must meet ANVISA requirements for clinical trial authorization in Brazil with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANVISA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ANVISA Registration Dossier (Brazil) - ENHANCED
   */
  generateANVISA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in ANVISA drug registrations for the Brazilian market.
           Your task is to generate a comprehensive ANVISA registration dossier summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Brazilian regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Brazilian regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to ANVISA standards
           - Reference specific Brazilian regulatory framework, ANVISA requirements, and Brazilian healthcare considerations extensively
           - Include both Portuguese terminology and detailed English explanations

           STRUCTURE FOR ANVISA REGISTRATION DOSSIER (EXTREMELY DETAILED):
           1. INFORMAÇÕES ADMINISTRATIVAS E ROTULAGEM
              1.1. Resumo da Solicitação (Application Summary) - Complete regulatory strategy and Brazilian submission framework
              1.2. Rotulagem Proposta (Proposed Labeling) - Detailed Brazilian labeling and prescribing information
           2. INFORMAÇÕES DE QUALIDADE
              2.1. Substância Ativa (Active Substance) - Comprehensive chemical and analytical characterization
              2.2. Produto Acabado (Finished Product) - Detailed formulation and Brazilian manufacturing compliance
              2.3. Fabricação no Brasil ou Importação (Brazilian Manufacturing or Import) - Complete regulatory compliance framework
           3. INFORMAÇÕES NÃO-CLÍNICAS
              3.1. Farmacologia e Farmacocinética - Comprehensive preclinical pharmacology package
              3.2. Toxicologia - Detailed toxicological assessment and safety evaluation
           4. INFORMAÇÕES CLÍNICAS
              4.1. Resumo de Eficácia Clínica - Detailed clinical efficacy evidence and analysis
              4.2. Resumo de Segurança Clínica - Comprehensive safety profile and risk assessment
              4.3. Avaliação Benefício-Risco para População Brasileira - Detailed benefit-risk analysis for Brazilian patients
           5. CONSIDERAÇÕES ESPECIAIS PARA O BRASIL - Complete Brazilian market analysis and regulatory considerations

           Use plain text formatting only - NO MARKDOWN.
           Reference Brazilian regulatory framework and ANVISA requirements.`
          },
          {
            role: "user",
            content: `Generate an ANVISA Registration Dossier for marketing authorization of ${diseaseData.disease_name} treatment in Brazil.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This registration dossier must meet ANVISA requirements for Brazilian marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANVISA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ANVISA GMP Certificate (Brazil) - ENHANCED
   */
  generateANVISA_GMP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert with experience in ANVISA GMP certification requirements for Brazil.
           Your task is to generate supporting documentation for ANVISA GMP certificate application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 4,000-5,000 words of comprehensive Brazilian GMP regulatory content
           - Each section must contain extensive detail with specific quality systems, procedures, and Brazilian regulatory compliance analysis
           - Include detailed subsections with quality data, validation protocols, and regulatory justification
           - Provide complete regulatory rationale and quality assurance justification according to ANVISA standards
           - Reference specific Brazilian GMP requirements, ANVISA guidelines, and Brazilian manufacturing standards extensively
           - Include both Portuguese terminology and detailed English explanations

           STRUCTURE FOR ANVISA GMP CERTIFICATE (EXTREMELY DETAILED):
           1. INFORMAÇÕES GERAIS DE FABRICAÇÃO
              1.1. Informações do Local de Fabricação (Manufacturing Site Information) - Complete facility description and Brazilian qualification
              1.2. Estrutura Organizacional (Organizational Structure) - Detailed personnel qualifications and Brazilian regulatory responsibilities
              1.3. Sistema de Qualidade (Quality System) - Comprehensive quality management system for Brazilian compliance
           2. PROCESSOS DE FABRICAÇÃO
              2.1. Descrição do Processo de Fabricação (Manufacturing Process Description) - Complete process validation and Brazilian control standards
              2.2. Controle de Qualidade (Quality Control) - Detailed analytical methods and Brazilian quality testing requirements
              2.3. Validação de Processos (Process Validation) - Comprehensive validation protocols and Brazilian documentation standards
           3. CONFORMIDADE COM REQUISITOS ANVISA BPF
              3.1. Conformidade com Padrões Brasileiros (Brazilian Standards Compliance) - Complete Brazilian regulatory compliance framework
              3.2. Sistema de Documentação (Documentation System) - Detailed Brazilian documentation control and record keeping
              3.3. Treinamento de Pessoal (Personnel Training) - Comprehensive Brazilian training programs and qualifications
           4. PREPARAÇÃO PARA INSPEÇÃO ANVISA - Complete Brazilian inspection preparedness and audit protocols

           Use plain text formatting only - NO MARKDOWN.
           Reference Brazilian GMP requirements and ANVISA manufacturing standards.`
          },
          {
            role: "user",
            content: `Generate ANVISA GMP Certificate supporting documentation for Brazilian manufacturing authorization of ${diseaseData.disease_name} treatment.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This documentation must support ANVISA GMP certification requirements with EXTREMELY DETAILED content and comprehensive quality analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANVISA_GMP:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ANMAT Clinical Trial Authorization (Argentina) - ENHANCED
   */
  generateANMAT_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in ANMAT clinical trial authorizations for Argentina.
           Your task is to generate key sections for an ANMAT CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Argentine regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Argentine regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to ANMAT standards
           - Reference specific Argentine regulatory requirements, ANMAT guidelines, and Argentine healthcare framework extensively
           - Include both Spanish terminology and detailed English explanations

           STRUCTURE FOR ANMAT CTA (EXTREMELY DETAILED):
           1. RESUMEN DE LA SOLICITUD (Application Overview)
              1.1. Información del Estudio (Study Information) - Complete study design and Argentine regulatory framework
              1.2. Patrocinador e Investigador Principal (Sponsor and Principal Investigator) - Detailed qualifications and Argentine regulatory standing
              1.3. Centros Argentinos (Argentine Centers) - Complete Argentine site information and qualifications
           2. INFORMACIÓN DEL PRODUCTO EN INVESTIGACIÓN
              2.1. Descripción del Producto (Product Description) - Comprehensive product characterization
              2.2. Información de Calidad (Quality Information) - Detailed quality control and Argentine compliance
              2.3. Información No-Clínica (Non-clinical Information) - Complete preclinical package
              2.4. Experiencia Clínica Previa (Previous Clinical Experience) - Comprehensive clinical data analysis
           3. PROTOCOLO DE INVESTIGACIÓN CLÍNICA
              3.1. Objetivos y Diseño del Estudio (Study Objectives and Design) - Complete methodology and statistical planning
              3.2. Población Argentina y Criterios de Selección (Argentine Population and Selection Criteria) - Detailed Argentine patient population analysis
              3.3. Plan de Tratamiento (Treatment Plan) - Comprehensive treatment protocols and monitoring
              3.4. Evaluaciones de Eficacia y Seguridad (Efficacy and Safety Evaluations) - Detailed assessment protocols
           4. CONSIDERACIONES REGULATORIAS ARGENTINAS - Complete Argentine regulatory compliance framework

           Use plain text formatting only - NO MARKDOWN.
           Reference Argentine regulatory requirements and ANMAT guidelines.`
          },
          {
            role: "user",
            content: `Generate an ANMAT Clinical Trial Authorization for ${diseaseData.disease_name} research in Argentina.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This application must meet ANMAT requirements for clinical trial authorization in Argentina with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANMAT_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ANMAT Drug Registration (Argentina) - ENHANCED
   */
  generateANMAT_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in ANMAT drug registrations for Argentina.
           Your task is to generate a comprehensive ANMAT registration summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Argentine regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Argentine regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to ANMAT standards
           - Reference specific Argentine regulatory framework, ANMAT requirements, and Argentine healthcare considerations extensively
           - Include both Spanish terminology and detailed English explanations

           STRUCTURE FOR ANMAT DRUG REGISTRATION (EXTREMELY DETAILED):
           1. INFORMACIÓN ADMINISTRATIVA Y ETIQUETADO
              1.1. Resumen de la Solicitud (Application Summary) - Complete regulatory strategy and Argentine submission framework
              1.2. Etiquetado Propuesto (Proposed Labeling) - Detailed Argentine labeling and prescribing information
           2. INFORMACIÓN DE CALIDAD
              2.1. Sustancia Activa (Active Substance) - Comprehensive chemical and analytical characterization
              2.2. Producto Terminado (Finished Product) - Detailed formulation and Argentine manufacturing compliance
           3. INFORMACIÓN NO-CLÍNICA
              3.1. Farmacología y Farmacocinética - Comprehensive preclinical pharmacology package
              3.2. Toxicología - Detailed toxicological assessment and safety evaluation
           4. INFORMACIÓN CLÍNICA
              4.1. Resumen de Eficacia Clínica - Detailed clinical efficacy evidence and analysis
              4.2. Resumen de Seguridad Clínica - Comprehensive safety profile and risk assessment
              4.3. Evaluación Beneficio-Riesgo para Población Argentina - Detailed benefit-risk analysis for Argentine patients
           5. CONSIDERACIONES ESPECIALES PARA ARGENTINA - Complete Argentine market analysis and regulatory considerations

           Use plain text formatting only - NO MARKDOWN.
           Reference Argentine regulatory framework and ANMAT requirements.`
          },
          {
            role: "user",
            content: `Generate an ANMAT Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Argentina.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This registration summary must meet ANMAT requirements for Argentine marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANMAT_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * INVIMA Clinical Trial Permit (Colombia) - ENHANCED
   */
  generateINVIMA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in INVIMA clinical trial permits for Colombia.
           Your task is to generate key sections for an INVIMA CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Colombian regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Colombian regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to INVIMA standards
           - Reference specific Colombian regulatory requirements, INVIMA guidelines, and Colombian healthcare framework extensively
           - Include both Spanish terminology and detailed English explanations

           Use plain text formatting only - NO MARKDOWN.
           Reference Colombian regulatory requirements and INVIMA guidelines.`
          },
          {
            role: "user",
            content: `Generate an INVIMA Clinical Trial Permit for ${diseaseData.disease_name} research in Colombia.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This permit must meet INVIMA requirements for clinical trial authorization in Colombia with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateINVIMA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * INVIMA Drug Registration (Colombia) - ENHANCED
   */
  generateINVIMA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in INVIMA drug registrations for Colombia.
           Your task is to generate a comprehensive INVIMA registration summary.

           Use plain text formatting only - NO MARKDOWN.
           Reference Colombian regulatory framework and INVIMA requirements.`
          },
          {
            role: "user",
            content: `Generate an INVIMA Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Colombia.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateINVIMA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ISP Clinical Trial Authorization (Chile) - ENHANCED
   */
  generateISP_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in ISP clinical trial authorizations for Chile.
           Your task is to generate key sections for an ISP CTA application.

           Use plain text formatting only - NO MARKDOWN.
           Reference Chilean regulatory requirements and ISP guidelines.`
          },
          {
            role: "user",
            content: `Generate an ISP Clinical Trial Authorization for ${diseaseData.disease_name} research in Chile.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateISP_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * ISP Drug Registration (Chile) - ENHANCED
   */
  generateISP_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in ISP drug registrations for Chile.
           Your task is to generate a comprehensive ISP registration summary.

           Use plain text formatting only - NO MARKDOWN.
           Reference Chilean regulatory framework and ISP requirements.`
          },
          {
            role: "user",
            content: `Generate an ISP Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Chile.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateISP_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // AFRICA & MIDDLE EAST DOCUMENTS - ENHANCED
  // =============================================================================

  /**
   * SAHPRA Clinical Trial Authorization (South Africa) - ENHANCED
   */
  generateSAHPRA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in SAHPRA clinical trial authorizations for South Africa.
           Your task is to generate key sections for a SAHPRA CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive South African regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and South African regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to SAHPRA standards
           - Reference specific South African regulatory requirements, SAHPRA guidelines, and South African healthcare framework extensively

           Use plain text formatting only - NO MARKDOWN.
           Reference South African regulatory requirements and SAHPRA guidelines.`
          },
          {
            role: "user",
            content: `Generate a SAHPRA Clinical Trial Authorization for ${diseaseData.disease_name} research in South Africa.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This application must meet SAHPRA requirements for clinical trial authorization in South Africa with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSAHPRA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * SAHPRA Medicine Registration (South Africa) - ENHANCED
   */
  generateSAHPRA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in SAHPRA medicine registrations for South Africa.
           Your task is to generate a comprehensive SAHPRA registration summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive South African regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and South African regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to SAHPRA standards
           - Reference specific South African regulatory framework, SAHPRA requirements, and South African healthcare considerations extensively

           Use plain text formatting only - NO MARKDOWN.
           Reference South African regulatory framework and SAHPRA requirements.`
          },
          {
            role: "user",
            content: `Generate a SAHPRA Medicine Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in South Africa.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This registration summary must meet SAHPRA requirements for South African marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSAHPRA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Israeli MOH Clinical Trial Permit - ENHANCED
   */
  generateMOH_ISRAEL_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Israeli MOH clinical trial permits.
           Your task is to generate key sections for an Israeli MOH CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Israeli regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Israeli regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to Israeli MOH standards
           - Reference specific Israeli regulatory requirements, MOH guidelines, and Israeli healthcare framework extensively
           - Include both Hebrew terminology and detailed English explanations

           Use plain text formatting only - NO MARKDOWN.
           Reference Israeli regulatory requirements and MOH guidelines.`
          },
          {
            role: "user",
            content: `Generate an Israeli MOH Clinical Trial Permit for ${diseaseData.disease_name} research in Israel.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This permit must meet Israeli MOH requirements for clinical trial authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMOH_ISRAEL_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Israeli Drug Registration - ENHANCED
   */
  generateMOH_ISRAEL_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Israeli drug registrations.
           Your task is to generate a comprehensive Israeli registration summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Israeli regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Israeli regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to Israeli standards
           - Reference specific Israeli regulatory framework, MOH requirements, and Israeli healthcare considerations extensively
           - Include both Hebrew terminology and detailed English explanations

           Use plain text formatting only - NO MARKDOWN.
           Reference Israeli regulatory framework and MOH requirements.`
          },
          {
            role: "user",
            content: `Generate an Israeli Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Israel.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This registration summary must meet Israeli MOH requirements for marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMOH_ISRAEL_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * SFDA Clinical Trial Authorization (Saudi Arabia) - ENHANCED
   */
  generateSFDA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in SFDA clinical trial authorizations for Saudi Arabia.
           Your task is to generate key sections for an SFDA CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Saudi regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and Saudi regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to SFDA standards
           - Reference specific Saudi regulatory requirements, SFDA guidelines, and Saudi healthcare framework extensively
           - Include both Arabic terminology and detailed English explanations

           Use plain text formatting only - NO MARKDOWN.
           Reference Saudi regulatory requirements and SFDA guidelines.`
          },
          {
            role: "user",
            content: `Generate an SFDA Clinical Trial Authorization for ${diseaseData.disease_name} research in Saudi Arabia.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This authorization must meet SFDA requirements for clinical trial approval in Saudi Arabia with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSFDA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * SFDA Drug Registration (Saudi Arabia) - ENHANCED
   */
  generateSFDA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in SFDA drug registrations for Saudi Arabia.
           Your task is to generate a comprehensive SFDA registration summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive Saudi regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and Saudi regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to SFDA standards
           - Reference specific Saudi regulatory framework, SFDA requirements, and Saudi healthcare considerations extensively
           - Include both Arabic terminology and detailed English explanations

           Use plain text formatting only - NO MARKDOWN.
           Reference Saudi regulatory framework and SFDA requirements.`
          },
          {
            role: "user",
            content: `Generate an SFDA Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Saudi Arabia.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This registration summary must meet SFDA requirements for Saudi marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSFDA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * DHA Clinical Trial Permit (UAE) - ENHANCED
   */
  generateDHA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in DHA clinical trial permits for UAE.
           Your task is to generate key sections for a DHA CTA application.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive UAE regulatory content
           - Each section must contain extensive detail with specific methodologies, procedures, and UAE regulatory compliance analysis
           - Include detailed subsections with quantitative data, protocols, and regulatory justification
           - Provide complete regulatory rationale and scientific justification according to DHA standards
           - Reference specific UAE regulatory requirements, DHA guidelines, and UAE healthcare framework extensively
           - Include both Arabic terminology and detailed English explanations

           Use plain text formatting only - NO MARKDOWN.
           Reference UAE regulatory requirements and DHA guidelines.`
          },
          {
            role: "user",
            content: `Generate a DHA Clinical Trial Permit for ${diseaseData.disease_name} research in UAE.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This permit must meet DHA requirements for clinical trial authorization in UAE with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateDHA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * UAE Drug Registration - ENHANCED
   */
  generateMOH_UAE_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in UAE drug registrations.
           Your task is to generate a comprehensive UAE registration summary.

           CRITICAL REQUIREMENTS FOR EXTREMELY DETAILED OUTPUT:
           - Generate MINIMUM 5,000-6,000 words of comprehensive UAE regulatory content
           - Each section must contain extensive detail with specific data, methodologies, and UAE regulatory compliance analysis
           - Include detailed subsections with quantitative data, analytical methods, and regulatory justification
           - Provide complete regulatory rationale and marketing authorization justification according to UAE standards
           - Reference specific UAE regulatory framework, MOH requirements, and UAE healthcare considerations extensively
           - Include both Arabic terminology and detailed English explanations

           Use plain text formatting only - NO MARKDOWN.
           Reference UAE regulatory framework and MOH requirements.`
          },
          {
            role: "user",
            content: `Generate a UAE Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in UAE.
           
           ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
           ).filter(Boolean).join('\n')}

           This registration summary must meet UAE MOH requirements for marketing authorization with EXTREMELY DETAILED content and comprehensive regulatory analysis.`
          }
        ],
        temperature: 0.2,
        max_tokens: 8000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMOH_UAE_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // QUERY ASSISTANT & VALIDATION
  // =============================================================================
  
  queryAssistant: async (queryData) => {
    try {
      const relevanceCheck = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a relevance checker. Determine if a question is related to clinical trials, medical protocols, regulatory affairs, pharmaceutical development, or healthcare research. Respond with ONLY "RELEVANT" or "IRRELEVANT".`
          },
          { role: "user", content: queryData.question }
        ],
        temperature: 0,
        max_tokens: 10
      });
  
      if (relevanceCheck.data.choices[0].message.content.trim() === "IRRELEVANT") {
        return {
          answer: `CLINICAL ASSISTANT - OFF-TOPIC QUERY\n\nI'm LumiPath™, your specialized clinical protocol assistant. Your question appears to be outside my area of clinical and regulatory expertise.\n\nPlease ask a question related to clinical trials, protocols, or regulatory affairs, and I'll provide detailed, professional guidance.`
        };
      }
  
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a clinical protocol and regulatory expert providing precise, well-structured, and professionally formatted answers. Your expertise spans all aspects of clinical trial design, regulatory submissions, and pharmaceutical development. Use ONLY plain text with clear paragraphing, indentation, and simple dashes or numbers for lists. NO MARKDOWN.`
          },
          {
            role: "user",
            content: `Question: ${queryData.question}\n${queryData.disease_context ? `Disease Context: ${queryData.disease_context}` : ''}`
          }
        ],
        ...OPENAI_CONFIG.PRECISE
      });
      
      return { answer: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in queryAssistant:', error.response?.data || error.message);
      throw error;
    }
  },
  
validateDocumentContent: async (validationData) => {
  try {
    const { 
      documentText, 
      fileName, 
      expectedCategory, 
      categoryDescription, 
      primaryIndication, 
      dossierType,
      fileType,
      fileSize,
      language = 'english'
    } = validationData;

    // Enhanced validation rules with ICH/FDA compliance checks
    const validationRules = {
      'protocol': {
        required_keywords: ['protocol', 'study', 'clinical trial', 'objectives', 'endpoints', 'inclusion criteria', 'exclusion criteria', 'methodology', 'statistical analysis'],
        forbidden_keywords: ['investigator brochure', 'manufacturing', 'chemistry data', 'toxicology summary'],
        ich_guidelines: 'ICH E6(R2) Good Clinical Practice',
        regulatory_sections: ['study objectives', 'study design', 'selection criteria', 'treatment plan', 'assessments', 'statistical considerations'],
        min_sections: 6
      },
      'ib': {
        required_keywords: ['investigator brochure', 'pharmacology', 'toxicology', 'safety', 'preclinical', 'clinical experience', 'dosing', 'adverse events'],
        forbidden_keywords: ['study protocol', 'inclusion criteria', 'statistical analysis plan'],
        ich_guidelines: 'ICH E6(R2) Section 7 - Investigator\'s Brochure',
        regulatory_sections: ['general information', 'physical/chemical properties', 'nonclinical studies', 'effects in humans', 'summary'],
        min_sections: 5
      },
      'quality': {
        required_keywords: ['chemistry', 'manufacturing', 'controls', 'CMC', 'specifications', 'stability', 'quality control', 'analytical methods'],
        forbidden_keywords: ['clinical data', 'patient results', 'efficacy endpoints'],
        ich_guidelines: 'ICH Q1-Q14 Quality Guidelines',
        regulatory_sections: ['drug substance', 'drug product', 'manufacturing', 'control of excipients', 'specifications', 'stability'],
        min_sections: 4
      },
      'nonclinical': {
        required_keywords: ['toxicology', 'pharmacology', 'nonclinical', 'preclinical', 'safety pharmacology', 'animal studies'],
        forbidden_keywords: ['human subjects', 'clinical trial results', 'patient data'],
        ich_guidelines: 'ICH S1-S11 Safety Guidelines',
        regulatory_sections: ['pharmacology', 'pharmacokinetics', 'toxicology', 'local tolerance', 'other studies'],
        min_sections: 3
      },
      'clinical': {
        required_keywords: ['clinical study', 'efficacy', 'safety', 'patients', 'results', 'clinical trial', 'endpoints', 'adverse events'],
        forbidden_keywords: ['manufacturing process', 'chemical synthesis', 'animal studies only'],
        ich_guidelines: 'ICH E1-E20 Efficacy Guidelines',
        regulatory_sections: ['study design', 'patient population', 'efficacy results', 'safety results', 'discussion', 'conclusions'],
        min_sections: 4
      },
      'application': {
        required_keywords: ['application', 'submission', 'regulatory', 'sponsor', 'authorization', 'administrative'],
        forbidden_keywords: ['detailed study results', 'raw data', 'statistical analysis'],
        ich_guidelines: 'Regional regulatory requirements',
        regulatory_sections: ['administrative information', 'product information', 'regulatory pathway'],
        min_sections: 2
      },
      'other': {
        required_keywords: [],
        forbidden_keywords: [],
        ich_guidelines: 'General regulatory compliance',
        regulatory_sections: [],
        min_sections: 0
      }
    };

    // File type validation
    const allowedFileTypes = {
      'pdf': ['application/pdf'],
      'doc': ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'excel': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    };

    const isValidFileType = Object.values(allowedFileTypes).flat().includes(fileType);

    // Document length handling - use more content for better validation
    const maxAnalysisLength = 15000; // Increased from 5000
    const analysisText = documentText.length > maxAnalysisLength 
      ? documentText.substring(0, maxAnalysisLength) + "\n\n[Document continues...]"
      : documentText;

    // File size validation (reasonable limits)
    const maxFileSizeBytes = 50 * 1024 * 1024; // 50MB
    const isValidFileSize = !fileSize || fileSize <= maxFileSizeBytes;

    // Language-specific validation adjustments
    const languageAdjustments = {
      'english': { confidence_boost: 0.0 },
      'spanish': { confidence_boost: -0.1 },
      'french': { confidence_boost: -0.1 },
      'german': { confidence_boost: -0.1 },
      'japanese': { confidence_boost: -0.15 },
      'chinese': { confidence_boost: -0.15 }
    };

    const rules = validationRules[expectedCategory] || validationRules['other'];
    
    const prompt = `You are a senior regulatory affairs AI expert with deep knowledge of ICH guidelines, FDA regulations, and EMA requirements. You are tasked with comprehensively validating a clinical dossier document.

**DOSSIER CONTEXT:**
- Dossier Type: ${dossierType || 'Not specified'}
- Primary Indication: ${primaryIndication || 'Not specified'}
- Document Language: ${language}
- File Type: ${fileType || 'Unknown'}
- File Size: ${fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}

**DOCUMENT TO VALIDATE:**
- File Name: ${fileName}
- User-Assigned Category: "${categoryDescription}"
- Expected Category Code: "${expectedCategory}"

**VALIDATION CRITERIA:**
1. **Category Validation**: Must contain required keywords: ${rules.required_keywords.join(', ')}
2. **Negative Validation**: Must NOT contain: ${rules.forbidden_keywords.join(', ')}
3. **Regulatory Compliance**: Should align with ${rules.ich_guidelines}
4. **Structural Requirements**: Should contain ${rules.min_sections}+ of these sections: ${rules.regulatory_sections.join(', ')}
5. **File Type Validation**: Is ${fileType} appropriate for this category?
6. **Context Relevance**: Is content relevant to "${primaryIndication}"?
7. **Quality Assessment**: Is this a complete, professional document suitable for regulatory submission?

**ADDITIONAL VALIDATION CHECKS:**
- Document completeness and professional formatting
- Presence of required regulatory elements
- Absence of obviously irrelevant content
- Consistency with stated indication/disease area
- Appropriate level of detail for dossier category

**PRE-VALIDATION FINDINGS:**
- File Type Valid: ${isValidFileType ? 'Yes' : 'No'}
- File Size Valid: ${isValidFileSize ? 'Yes' : 'No'}
- Content Length: ${analysisText.length} characters analyzed

**DOCUMENT CONTENT:**
"""
${analysisText}
"""

**RESPONSE REQUIREMENTS:**
Provide a comprehensive validation assessment in JSON format only. No additional text before or after.

Consider that this document will be submitted to regulatory authorities and must meet professional standards.

{
  "isValid": boolean,
  "confidence": number (0.0 to 1.0, adjusted for language and complexity),
  "category_match": boolean,
  "content_relevance": boolean,
  "regulatory_compliance": boolean,
  "file_type_appropriate": boolean,
  "completeness_score": number (0.0 to 1.0),
  "reason": "Detailed explanation covering all validation aspects",
  "recommendation": "Specific, actionable guidance for the user",
  "detected_issues": ["list", "of", "specific", "issues", "found"],
  "suggested_category": "alternative category if current is wrong, or null",
  "ich_compliance": "assessment of ICH/FDA/EMA guideline compliance",
  "missing_elements": ["list", "of", "missing", "required", "elements"],
  "quality_indicators": {
    "professional_formatting": boolean,
    "appropriate_detail_level": boolean,
    "regulatory_language": boolean,
    "complete_sections": boolean
  }
}`;

    const response = await openaiApi.post('chat/completions', {
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      ...OPENAI_CONFIG.ANALYTICAL,
      response_format: { "type": "json_object" }
    });

    const aiResponse = response.data.choices[0].message.content.trim();
    const validationResult = JSON.parse(aiResponse);
    
    // Apply language confidence adjustment
    const languageAdjustment = languageAdjustments[language] || languageAdjustments['english'];
    const adjustedConfidence = Math.max(0, Math.min(1, 
      (validationResult.confidence || 0) + languageAdjustment.confidence_boost
    ));

    // Enhanced validation result with additional metadata
    return {
      isValid: validationResult.isValid ?? false,
      confidence: adjustedConfidence,
      category_match: validationResult.category_match ?? false,
      content_relevance: validationResult.content_relevance ?? false,
      regulatory_compliance: validationResult.regulatory_compliance ?? false,
      file_type_appropriate: validationResult.file_type_appropriate ?? isValidFileType,
      completeness_score: validationResult.completeness_score ?? 0,
      reason: validationResult.reason ?? 'Validation completed with limited information.',
      recommendation: validationResult.recommendation ?? 'Please review document content and category assignment.',
      detected_issues: validationResult.detected_issues ?? [],
      suggested_category: validationResult.suggested_category ?? null,
      ich_compliance: validationResult.ich_compliance ?? 'Unable to assess compliance',
      missing_elements: validationResult.missing_elements ?? [],
      quality_indicators: validationResult.quality_indicators ?? {
        professional_formatting: false,
        appropriate_detail_level: false,
        regulatory_language: false,
        complete_sections: false
      },
      validation_metadata: {
        analysis_length: analysisText.length,
        language: language,
        file_size_mb: fileSize ? (fileSize / 1024 / 1024).toFixed(2) : null,
        validation_timestamp: new Date().toISOString(),
        model_used: 'gpt-4o'
      }
    };

  } catch (error) {
    console.error('Enhanced content validation error:', error.response?.data || error.message);
    
    // Comprehensive error response
    return {
      isValid: false,
      confidence: 0,
      category_match: false,
      content_relevance: false,
      regulatory_compliance: false,
      file_type_appropriate: false,
      completeness_score: 0,
      reason: `Validation service error: ${error.message || 'Unknown error occurred'}`,
      recommendation: 'Please check your internet connection and try again. If the problem persists, contact technical support.',
      detected_issues: ['Validation service unavailable'],
      suggested_category: null,
      ich_compliance: 'Unable to assess due to service error',
      missing_elements: ['Validation could not be completed'],
      quality_indicators: {
        professional_formatting: false,
        appropriate_detail_level: false,
        regulatory_language: false,
        complete_sections: false
      },
      validation_metadata: {
        analysis_length: 0,
        language: validationData.language || 'unknown',
        file_size_mb: validationData.fileSize ? (validationData.fileSize / 1024 / 1024).toFixed(2) : null,
        validation_timestamp: new Date().toISOString(),
        model_used: 'gpt-4o',
        error: error.message
      }
    };
  }
},

chatWithResults: async (chatData) => {
  try {
    const { results, question, history = [] } = chatData;
    
    // Build conversation context
    const conversationHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const response = await openaiApi.post('chat/completions', {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a clinical data analyst with expertise in medical research and diagnostic analysis. You have access to analysis results data in CSV format.

Your task is to analyze the provided results data and answer user questions about it. You can:
- Calculate statistics (averages, counts, percentages)
- Identify patterns and trends
- Summarize findings
- Compare different cases
- Highlight outliers or concerning cases

Be precise, professional, and provide specific numbers when possible. Focus on clinically relevant insights.

RESULTS DATA (CSV format):
${results}

Important: Base your analysis ONLY on the data provided above. Be accurate with your calculations and clearly state any limitations.`
        },
        ...conversationHistory,
        {
          role: "user",
          content: question
        }
      ],
      ...OPENAI_CONFIG.ANALYTICAL
    });

    return { answer: response.data.choices[0].message.content.trim() };
  } catch (error) {
    // console.error('Error in chatWithResults:', error.response?.data || error.message);
    throw error;
  }
}}

export default openaiService;