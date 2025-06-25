// src/services/openaiService.js - COMPLETE VERSION WITH ALL DOCUMENT GENERATORS

import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

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
      console.error("Error in transcribeAudio:", error.response?.data || error.message);
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
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a board-certified medical specialist with extensive clinical experience. Analyze the transcript and provide diagnosis with extracted metadata.`
            },
            {
              role: "user",
              content: transcript
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        }
      );
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error in diagnoseConversation:", error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Generate Protocol - Enhanced version
   */
  generateProtocol: async (diseaseData) => {
    try {
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a senior regulatory affairs expert with 20+ years of experience in writing clinical study protocols for major pharmaceutical companies and regulatory agencies.

              Your task is to generate a highly professional, ICH/FDA/EMA-compliant protocol EXECUTIVE SUMMARY for a clinical trial that meets industry standards for regulatory submission.

              CRITICAL REQUIREMENTS:
              - This must be EXTREMELY DETAILED - aim for 3,500-4,500 words minimum
              - Each section must contain comprehensive, granular detail suitable for regulatory review
              - Include specific numerical values, dosing regimens, and methodological details
              - Reference established protocols and regulatory guidance documents
              - Use professional medical and regulatory terminology throughout

              STRICT FORMATTING REQUIREMENTS:
              - Format according to ICH E6(R2) Good Clinical Practice guidelines
              - Follow EXACTLY this section structure with numbered sections:
                1. Protocol Summary / Synopsis
                2. Introduction & Background
                3. Objectives & Endpoints
                4. Study Design & Investigational Plan
                5. Study Population & Eligibility
                6. Interventions / Treatments
                7. Assessments & Procedures
                8. Statistical Considerations & Data Analysis
                9. Outcome Analysis (Efficacy, Safety, etc.)
                10. References & Appendices / Supporting Documentation
              - Use ALL CAPS for main section headings (e.g., "1. PROTOCOL SUMMARY / SYNOPSIS")
              - Use Title Case for subsection headings with appropriate numbering
              - DO NOT use markdown formatting or special characters
              - Use plain text with proper spacing and indentation only`
            },
            {
              role: "user",
              content: `Generate a highly detailed and comprehensive ${diseaseData.additional_parameters?.trial_phase || 'Phase 2'} Clinical Study Protocol EXECUTIVE SUMMARY for the treatment of ${diseaseData.disease_name}.

              ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
                value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
              ).filter(Boolean).join('\n')}

              The executive summary must be extremely comprehensive and detailed while incorporating all provided trial design parameters to create a regulatory-compliant protocol suitable for FDA/EMA submission.`  
            }
          ],
          temperature: 0.15,
          max_tokens: 8000
        }
      );

      return {
        protocol_id: `prot-${Date.now()}`,
        protocol: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateProtocol:', error.response?.data || error.message);
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
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a Principal Investigator and Clinical Trial Design Expert with 25+ years of experience in pharmaceutical development.
              Your task is to generate a comprehensive, regulatory-compliant MAIN DOCUMENT for an Investigational New Drug (IND) application, focusing on the study design, CMC, and clinical sections. This document meets professional industry standards for submission to the FDA.
              
              The document MUST be structured EXACTLY into these sections:
              CMC SECTION: (Chemistry, Manufacturing, and Controls)
              CLINICAL SECTION: (numbered 1-10 with comprehensive clinical information)
              
              Use plain text formatting only - NO MARKDOWN.
              Incorporate ALL provided parameters systematically throughout both sections.`
            },
            {
              role: "user",
              content: `Generate a comprehensive, FDA-compliant MAIN DOCUMENT for an Investigational New Drug (IND) application for ${diseaseData.disease_name}.

              ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
                value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
              ).filter(Boolean).join('\n')}

              This MAIN DOCUMENT must incorporate all enhanced parameters to create a comprehensive, parameter-specific IND suitable for FDA submission.`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        }
      );

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
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a senior regulatory affairs expert with 25+ years of experience preparing New Drug Applications (NDAs) for FDA submission.
              Your task is to generate a comprehensive, FDA-compliant NDA SUMMARY document. This document should highlight key information typically found in Module 2 (CTD Summaries) and relevant aspects of Module 5 (Clinical Study Reports) of an eCTD submission.
              
              Structure according to FDA guidelines for NDA submissions, reflecting the Common Technical Document (CTD) structure:
              1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY
              2. OVERALL SUMMARY OF QUALITY (Based on CTD Module 2.3)
              3. NONCLINICAL OVERVIEW AND SUMMARY (Based on CTD Modules 2.4 & 2.6)
              4. CLINICAL OVERVIEW AND SUMMARY (Based on CTD Modules 2.5 & 2.7)
              5. KEY CLINICAL STUDY REPORT SUMMARIES
              
              Use plain text formatting only - NO MARKDOWN.`
            },
            {
              role: "user",
              content: `Generate a comprehensive NDA SUMMARY document for the treatment of ${diseaseData.disease_name}.
              
              ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
                value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
              ).filter(Boolean).join('\n')}

              This NDA SUMMARY must be EXTREMELY DETAILED and meet FDA expectations for Module 2 content with specific numerical values and regulatory compliance.`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        }
      );
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
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with 25+ years of experience preparing Biologics License Applications (BLAs) for FDA submission.
            Your task is to generate a comprehensive BLA SUMMARY document, analogous to an NDA summary but with a focus on biologics-specific considerations.

            KEY BLA-SPECIFIC CONSIDERATIONS:
            - Manufacturing process for biologics (cell lines, fermentation/culture, purification)
            - Characterization of the biologic (structure, purity, potency, heterogeneity, immunogenicity)
            - Comparability assessments (if manufacturing changes occurred)
            - Stability of the biologic
            - Adventitious agent safety
            - Immunogenicity assessment and impact

            STRUCTURE:
            1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY
            2. OVERALL SUMMARY OF QUALITY (BIOLOGICS FOCUS)
            3. NONCLINICAL OVERVIEW AND SUMMARY
            4. CLINICAL OVERVIEW AND SUMMARY
            5. KEY CLINICAL STUDY REPORT SUMMARIES
            
            Use plain text formatting only - NO MARKDOWN.
            Reference the Public Health Service Act where relevant for biologics.`
          },
          {
            role: "user",
            content: `Generate a comprehensive BLA SUMMARY document for a biologic treatment for ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This BLA SUMMARY must be DETAILED and meet FDA expectations for a biologic, emphasizing biologics-specific aspects (manufacturing, characterization, immunogenicity, comparability).`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateBLA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // CANADA DOCUMENTS
  // =============================================================================

  /**
   * Canadian Clinical Trial Application (Health Canada)
   */
  generateCTA_CA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Canadian Clinical Trial Applications for submission to Health Canada.
            Your task is to generate key sections of a Canadian CTA, following Health Canada requirements and guidelines.

            STRUCTURE FOR CANADIAN CTA:
            1. APPLICATION SUMMARY
               1.1. Trial Information (Title, Phase, Health Canada Control Number if available)
               1.2. Sponsor and Principal Investigator Information
               1.3. Study Overview
            2. INVESTIGATIONAL PRODUCT INFORMATION
               2.1. Product Description and Classification
               2.2. Quality Information Summary (Manufacturing, Specifications)
               2.3. Non-clinical Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS
               3.1. Study Objectives and Design
               3.2. Patient Population and Eligibility
               3.3. Treatment Plan and Duration
               3.4. Efficacy and Safety Assessments
            4. INVESTIGATOR QUALIFICATIONS AND SITE INFORMATION
            5. ETHICS AND REGULATORY COMPLIANCE

            Use plain text formatting only - NO MARKDOWN.
            Reference Health Canada guidelines and requirements where appropriate.`
          },
          {
            role: "user",
            content: `Generate a comprehensive Canadian Clinical Trial Application (Health Canada) for ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This CTA must meet Health Canada requirements and include all necessary sections for Canadian clinical trial authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_CA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Canadian New Drug Submission (NDS)
   */
  generateNDS: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing New Drug Submissions (NDS) for Health Canada.
            Your task is to generate a comprehensive NDS SUMMARY document following Canadian regulatory requirements.

            STRUCTURE FOR CANADIAN NDS:
            1. ADMINISTRATIVE INFORMATION AND PRODUCT MONOGRAPH SUMMARY
               1.1. Application Overview
               1.2. Proposed Product Monograph Highlights
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary
               2.3. Canadian Manufacturing and Quality Considerations
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for Canadian Population
            5. RISK MANAGEMENT SUMMARY

            Use plain text formatting only - NO MARKDOWN.
            Reference Health Canada guidance documents and Canadian regulatory framework.`
          },
          {
            role: "user",
            content: `Generate a comprehensive New Drug Submission (NDS) summary for Health Canada approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This NDS summary must meet Health Canada expectations and demonstrate compliance with Canadian regulatory requirements.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDS:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Canadian Notice of Compliance (NOC)
   */
  generateNOC: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Canadian Notice of Compliance (NOC) applications for Health Canada.
            Your task is to generate key documentation supporting an NOC application.

            STRUCTURE FOR NOC SUPPORTING DOCUMENTATION:
            1. NOC APPLICATION OVERVIEW
               1.1. Product Information
               1.2. Authorization Request Summary
               1.3. Regulatory Pathway (New Drug Submission, Abbreviated New Drug Submission, etc.)
            2. QUALITY DOCUMENTATION SUMMARY
               2.1. Product Quality Profile
               2.2. Manufacturing Authorization Summary
               2.3. Specifications and Testing Summary
            3. CLINICAL DATA SUMMARY (if applicable)
               3.1. Efficacy Data Summary
               3.2. Safety Data Summary
               3.3. Comparative Studies (if biosimilar or generic)
            4. LABELING AND PRODUCT MONOGRAPH
               4.1. Proposed Canadian Product Monograph
               4.2. Patient Information Summary
            5. POST-MARKET COMMITMENTS

            Use plain text formatting only - NO MARKDOWN.
            Focus on Canadian marketing authorization requirements.`
          },
          {
            role: "user",
            content: `Generate Notice of Compliance (NOC) supporting documentation for Canadian marketing authorization of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This NOC documentation must support Canadian marketing authorization and demonstrate regulatory compliance.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNOC:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // MEXICO DOCUMENTS
  // =============================================================================

  /**
   * COFEPRIS Clinical Trial Authorization
   */
  generateCOFEPRIS_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in COFEPRIS (Mexican health authority) clinical trial authorizations.
            Your task is to generate key sections for a COFEPRIS Clinical Trial Authorization application.

            STRUCTURE FOR COFEPRIS CTA:
            1. INFORMACION ADMINISTRATIVA (Administrative Information)
               1.1. Información del Estudio (Study Information)
               1.2. Patrocinador y Investigador Principal (Sponsor and Principal Investigator)
               1.3. Sitios de Investigación en México (Mexican Investigation Sites)
            2. INFORMACION DEL PRODUCTO INVESTIGACIONAL
               2.1. Descripción del Producto (Product Description)
               2.2. Información de Calidad (Quality Information)
               2.3. Información No-Clínica (Non-clinical Information)
               2.4. Experiencia Clínica Previa (Previous Clinical Experience)
            3. PROTOCOLO DE INVESTIGACION
               3.1. Objetivos y Diseño del Estudio (Study Objectives and Design)
               3.2. Población y Criterios de Selección (Population and Selection Criteria)
               3.3. Plan de Tratamiento (Treatment Plan)
               3.4. Evaluaciones de Eficacia y Seguridad (Efficacy and Safety Evaluations)
            4. CONSIDERACIONES ETICAS Y REGULATORIAS MEXICANAS

            Use plain text formatting only - NO MARKDOWN.
            Reference Mexican regulatory requirements and COFEPRIS guidelines.`
          },
          {
            role: "user",
            content: `Generate a COFEPRIS Clinical Trial Authorization application for ${diseaseData.disease_name} research in Mexico.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet COFEPRIS requirements for clinical trial authorization in Mexico.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCOFEPRIS_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * COFEPRIS New Drug Registration
   */
  generateCOFEPRIS_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in COFEPRIS new drug registrations for the Mexican market.
            Your task is to generate a comprehensive summary for COFEPRIS new drug registration.

            STRUCTURE FOR COFEPRIS NEW DRUG REGISTRATION:
            1. INFORMACION ADMINISTRATIVA Y ETIQUETADO
               1.1. Resumen de la Solicitud (Application Summary)
               1.2. Etiquetado Propuesto (Proposed Labeling)
            2. INFORMACION DE CALIDAD
               2.1. Sustancia Activa (Active Substance)
               2.2. Producto Terminado (Finished Product)
               2.3. Manufactura en México o Importación (Mexican Manufacturing or Import)
            3. INFORMACION NO-CLINICA
               3.1. Farmacología y Farmacocinética
               3.2. Toxicología
            4. INFORMACION CLINICA
               4.1. Resumen de Eficacia Clínica
               4.2. Resumen de Seguridad Clínica
               4.3. Evaluación Beneficio-Riesgo para Población Mexicana
            5. CONSIDERACIONES ESPECIALES PARA MEXICO

            Use plain text formatting only - NO MARKDOWN.
            Reference Mexican regulatory framework and COFEPRIS requirements.`
          },
          {
            role: "user",
            content: `Generate a COFEPRIS New Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Mexico.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration summary must meet COFEPRIS requirements for Mexican marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCOFEPRIS_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // EUROPEAN UNION DOCUMENTS
  // =============================================================================

  /**
   * EU CTA (Clinical Trial Application)
   */
  generateCTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a regulatory affairs expert specializing in European Clinical Trial Applications (CTAs) under the EU Clinical Trials Regulation (CTR).
              Your task is to generate key sections of a CTA, focusing on Part I (dossier related to the investigational medicinal product - IMP - and the trial itself). This content should be suitable for inclusion in a CTIS submission.

              STRICT FORMATTING REQUIREMENTS:
              - Format according to EU CTR requirements for CTA submissions via CTIS.
              - Focus on generating content for key sections of the CTA dossier, such as:
                A. COVER LETTER AND APPLICATION FORM HIGHLIGHTS
                B. PROTOCOL SUMMARY
                C. INVESTIGATOR'S BROCHURE (IB) SUMMARY
                D. GMP COMPLIANCE AND IMPD (Investigational Medicinal Product Dossier) - KEY SUMMARIES
                   D.1. IMP Quality Data Summary
                   D.2. IMP Non-Clinical Data Summary
                   D.3. IMP Clinical Data Summary
                E. AUXILIARY MEDICINAL PRODUCTS
                F. SCIENTIFIC ADVICE AND PIP
                G. MANUFACTURING AND IMPORTATION AUTHORIZATIONS
              - Use ALL CAPS for main section headings.
              - Use Title Case for subsection headings with appropriate lettering/numbering.
              - DO NOT use markdown formatting. Provide clean plain text.`
            },
            {
              role: "user",
              content: `Generate key section summaries for a European Clinical Trial Application (CTA) for a trial on ${diseaseData.disease_name}.
              
              ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
                value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
              ).filter(Boolean).join('\n')}

              The content must be detailed enough for a CTA summary and meet EU CTR expectations for these sections.`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        }
      );
      return {
        document_content: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateCTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * EU MAA (Marketing Authorization Application)
   */
  generateMAA: async (diseaseData) => {
    try {
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a senior regulatory affairs expert with extensive experience in preparing Marketing Authorisation Applications (MAAs) for submission to the European Medicines Agency (EMA).
              Your task is to generate a comprehensive MAA SUMMARY document, mirroring the structure and content expectations of the Common Technical Document (CTD) Modules 2 (Summaries) and key highlights from Module 5 (Clinical Study Reports).

              STRICT FORMATTING REQUIREMENTS:
              - Format according to EMA guidelines for MAA submissions, reflecting the CTD structure.
              - Focus on generating key summary sections of an MAA:
                1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY (SmPC Highlights)
                2. QUALITY OVERALL SUMMARY (QOS - CTD Module 2.3)
                3. NON-CLINICAL OVERVIEW AND WRITTEN SUMMARIES (CTD Modules 2.4 & 2.6)
                4. CLINICAL OVERVIEW AND SUMMARY OF CLINICAL EFFICACY & SAFETY (CTD Modules 2.5 & 2.7)
                5. PIVOTAL CLINICAL STUDY REPORT SUMMARIES
              - Use ALL CAPS for main section headings.
              - Use Title Case for subsection headings with appropriate numbering.
              - DO NOT use markdown formatting. Provide clean plain text.`
            },
            {
              role: "user",
              content: `Generate a comprehensive MAA SUMMARY document for the treatment of ${diseaseData.disease_name}, for submission to the EMA.
              
              ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
                value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
              ).filter(Boolean).join('\n')}

              This MAA SUMMARY must be EXTREMELY DETAILED and meet EMA CTD standards for summary documents (Module 2 focus).`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        }
      );
      return {
        document_content: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in generateMAA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * EU IMPD (Investigational Medicinal Product Dossier)
   */
  generateIMPD: async (diseaseData) => {
    try {
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a regulatory expert specializing in the preparation of Investigational Medicinal Product Dossiers (IMPDs) for European clinical trial submissions.
              Your task is to generate a well-structured IMPD, focusing on Quality (IMPD-Q) and relevant summaries for Safety/Efficacy (IMPD-S/E).

              STRUCTURE FOR IMPD:
              1. INTRODUCTION
              2. DRUG SUBSTANCE (S)
              3. DRUG PRODUCT (P)
              4. PLACEBO (if applicable)
              5. APPENDICES
              6. NON-CLINICAL SUMMARY (IMPD-S)
              7. CLINICAL SUMMARY (IMPD-E)
              
              Use plain text formatting only - NO MARKDOWN.`
            },
            {
              role: "user",
              content: `Generate an Investigational Medicinal Product Dossier (IMPD) for a clinical trial concerning ${diseaseData.disease_name}.
              
              ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
                value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
              ).filter(Boolean).join('\n')}

              Generate a detailed IMPD-Q section with specific details for manufacturing, controls, specifications, and stability.`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
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
  // UNITED KINGDOM DOCUMENTS
  // =============================================================================

  /**
   * UK Clinical Trial Authorisation (MHRA)
   */
  generateCTA_UK: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in UK Clinical Trial Authorisations for submission to the MHRA post-Brexit.
            Your task is to generate key sections for a UK CTA application.

            STRUCTURE FOR UK CTA:
            1. APPLICATION OVERVIEW
               1.1. Trial Information (Title, EudraCT number if transitional, MHRA reference)
               1.2. Sponsor and Principal Investigator Information
               1.3. Study Overview and UK-specific considerations
            2. INVESTIGATIONAL MEDICINAL PRODUCT INFORMATION
               2.1. Product Description and Classification
               2.2. Quality Information Summary (UK GMP compliance)
               2.3. Non-clinical Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS (UK-FOCUSED)
               3.1. Study Objectives and Design
               3.2. UK Patient Population and Eligibility
               3.3. Treatment Plan and Duration
               3.4. Efficacy and Safety Assessments
            4. UK INVESTIGATOR QUALIFICATIONS AND SITE INFORMATION
            5. MHRA AND ETHICS COMPLIANCE

            Use plain text formatting only - NO MARKDOWN.
            Reference UK/MHRA guidelines and post-Brexit regulatory framework.`
          },
          {
            role: "user",
            content: `Generate a UK Clinical Trial Authorisation (MHRA) application for ${diseaseData.disease_name} research.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet MHRA requirements for clinical trial authorization in the UK post-Brexit.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_UK:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * UK Marketing Authorisation (MHRA)
   */
  generateMA_UK: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in UK Marketing Authorisation applications for MHRA submission.
            Your task is to generate a comprehensive summary for UK marketing authorization.

            STRUCTURE FOR UK MARKETING AUTHORISATION:
            1. ADMINISTRATIVE INFORMATION AND SUMMARY OF PRODUCT CHARACTERISTICS (SmPC)
               1.1. Application Overview
               1.2. Proposed UK SmPC Highlights
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary (UK-specific manufacturing considerations)
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary (relevance to UK population)
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for UK Population
            5. UK-SPECIFIC REGULATORY CONSIDERATIONS

            Use plain text formatting only - NO MARKDOWN.
            Reference UK regulatory framework and MHRA guidelines.`
          },
          {
            role: "user",
            content: `Generate a UK Marketing Authorisation summary for MHRA approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet MHRA expectations for UK marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMA_UK:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * UK Voluntary Scheme for Branded Medicines Pricing
   */
  generateVIE: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory and market access expert specializing in UK pricing and access frameworks.
            Your task is to generate documentation for the UK Voluntary Scheme for Branded Medicines Pricing and Access.

            STRUCTURE FOR UK PRICING AND ACCESS:
            1. PRODUCT AND PRICING OVERVIEW
               1.1. Product Information and Classification
               1.2. Proposed Pricing Structure
               1.3. Value Proposition Summary
            2. CLINICAL AND ECONOMIC EVIDENCE
               2.1. Clinical Efficacy and Safety Evidence
               2.2. Health Economic Analysis
               2.3. Budget Impact Assessment
            3. COMPARATIVE EFFECTIVENESS
               3.1. Comparison with Current Standard of Care
               3.2. Place in Therapy Analysis
            4. ACCESS AND IMPLEMENTATION
               4.1. Patient Access Strategy
               4.2. Implementation Considerations for NHS
            5. RISK SHARING AND OUTCOME AGREEMENTS

            Use plain text formatting only - NO MARKDOWN.
            Reference UK health technology assessment and NICE considerations.`
          },
          {
            role: "user",
            content: `Generate UK Voluntary Scheme documentation for pricing and access of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support pricing and access negotiations in the UK healthcare system.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateVIE:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // SWITZERLAND DOCUMENTS
  // =============================================================================

  /**
   * Swiss Clinical Trial Authorisation (Swissmedic)
   */
  generateCTA_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Swiss clinical trial authorizations for Swissmedic submission.
            Your task is to generate key sections for a Swiss CTA application.

            STRUCTURE FOR SWISS CTA:
            1. ANTRAGSUBERSICHT (Application Overview)
               1.1. Studieninformationen (Study Information)
               1.2. Sponsor und Hauptpruferin (Sponsor and Principal Investigator)
               1.3. Schweizer Standorte (Swiss Sites)
            2. PRUFPRAPARAT-INFORMATIONEN (Investigational Product Information)
               2.1. Produktbeschreibung (Product Description)
               2.2. Qualitatsinformationen (Quality Information)
               2.3. Nicht-klinische Zusammenfassung (Non-clinical Summary)
               2.4. Fruehere klinische Erfahrung (Previous Clinical Experience)
            3. KLINISCHES STUDIENPROTOKOLL (Clinical Study Protocol Synopsis)
               3.1. Studienziele und -design (Study Objectives and Design)
               3.2. Schweizer Patientenpopulation (Swiss Patient Population)
               3.3. Behandlungsplan (Treatment Plan)
               3.4. Wirksamkeits- und Sicherheitsbewertungen (Efficacy and Safety Assessments)
            4. SCHWEIZER REGULATORISCHE UBERLEGUNGEN

            Use plain text formatting only - NO MARKDOWN.
            Reference Swiss regulatory requirements and Swissmedic guidelines.`
          },
          {
            role: "user",
            content: `Generate a Swiss Clinical Trial Authorisation (Swissmedic) application for ${diseaseData.disease_name} research.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet Swissmedic requirements for clinical trial authorization in Switzerland.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Swiss Marketing Authorisation (Swissmedic)
   */
  generateMA_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Swiss marketing authorizations for Swissmedic.
            Your task is to generate a comprehensive summary for Swiss drug registration.

            STRUCTURE FOR SWISS MARKETING AUTHORISATION:
            1. ADMINISTRATIVE INFORMATIONEN UND FACHINFORMATIONEN
               1.1. Antragsubersicht (Application Overview)
               1.2. Vorgeschlagene Fachinformationen (Proposed Professional Information)
            2. QUALITATSINFORMATIONEN
               2.1. Wirkstoff-Zusammenfassung (Drug Substance Summary)
               2.2. Arzneimittel-Zusammenfassung (Drug Product Summary)
            3. NICHT-KLINISCHE INFORMATIONEN
               3.1. Pharmakologie und Pharmakokinetik
               3.2. Toxikologie
            4. KLINISCHE INFORMATIONEN
               4.1. Klinische Ubersicht (Clinical Overview)
               4.2. Klinische Wirksamkeit (Clinical Efficacy)
               4.3. Klinische Sicherheit (Clinical Safety)
               4.4. Nutzen-Risiko-Bewertung fur Schweizer Population
            5. SCHWEIZER BESONDERHEITEN

            Use plain text formatting only - NO MARKDOWN.
            Reference Swiss regulatory framework and Swissmedic guidelines.`
          },
          {
            role: "user",
            content: `Generate a Swiss Marketing Authorisation summary for Swissmedic approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet Swissmedic expectations for Swiss marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMA_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // RUSSIA DOCUMENTS
  // =============================================================================

  /**
   * Russian Clinical Trial Permit (Roszdravnadzor)
   */
  generateCTA_RU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Russian clinical trial permits for Roszdravnadzor submission.
            Your task is to generate key sections for a Russian clinical trial authorization.

            STRUCTURE FOR RUSSIAN CLINICAL TRIAL PERMIT:
            1. ОБЗОР ЗАЯВЛЕНИЯ (Application Overview)
               1.1. Информация об исследовании (Study Information)
               1.2. Спонсор и главный исследователь (Sponsor and Principal Investigator)
               1.3. Российские исследовательские центры (Russian Investigation Centers)
            2. ИНФОРМАЦИЯ ОБ ИССЛЕДУЕМОМ ПРЕПАРАТЕ
               2.1. Описание препарата (Product Description)
               2.2. Информация о качестве (Quality Information)
               2.3. Доклинические данные (Non-clinical Data)
               2.4. Предыдущий клинический опыт (Previous Clinical Experience)
            3. ПРОТОКОЛ КЛИНИЧЕСКОГО ИССЛЕДОВАНИЯ
               3.1. Цели и дизайн исследования (Study Objectives and Design)
               3.2. Российская популяция пациентов (Russian Patient Population)
               3.3. План лечения (Treatment Plan)
               3.4. Оценка эффективности и безопасности (Efficacy and Safety Assessment)
            4. РОССИЙСКИЕ РЕГУЛЯТОРНЫЕ СООБРАЖЕНИЯ

            Use plain text formatting only - NO MARKDOWN.
            Reference Russian regulatory requirements and Roszdravnadzor guidelines.`
          },
          {
            role: "user",
            content: `Generate a Russian Clinical Trial Permit application for ${diseaseData.disease_name} research in Russia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet Roszdravnadzor requirements for clinical trial authorization in Russia.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_RU:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Russian Registration Dossier
   */
  generateRD_RU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Russian drug registration with Roszdravnadzor.
            Your task is to generate a comprehensive Russian registration dossier summary.

            STRUCTURE FOR RUSSIAN REGISTRATION DOSSIER:
            1. АДМИНИСТРАТИВНАЯ ИНФОРМАЦИЯ И ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ
               1.1. Обзор заявления (Application Overview)
               1.2. Предлагаемая инструкция по применению (Proposed Instructions for Use)
            2. ИНФОРМАЦИЯ О КАЧЕСТВЕ
               2.1. Лекарственное вещество (Drug Substance)
               2.2. Лекарственный препарат (Drug Product)
               2.3. Российское производство или импорт (Russian Manufacturing or Import)
            3. ДОКЛИНИЧЕСКАЯ ИНФОРМАЦИЯ
               3.1. Фармакология и фармакокинетика
               3.2. Токсикология
            4. КЛИНИЧЕСКАЯ ИНФОРМАЦИЯ
               4.1. Клинический обзор (Clinical Overview)
               4.2. Клиническая эффективность (Clinical Efficacy)
               4.3. Клиническая безопасность (Clinical Safety)
               4.4. Оценка соотношения польза-риск для российской популяции
            5. ОСОБЕННОСТИ ДЛЯ РОССИЙСКОГО РЫНКА

            Use plain text formatting only - NO MARKDOWN.
            Reference Russian regulatory framework and Roszdravnadzor requirements.`
          },
          {
            role: "user",
            content: `Generate a Russian Registration Dossier for drug registration of ${diseaseData.disease_name} treatment in Russia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration dossier must meet Roszdravnadzor requirements for Russian marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateRD_RU:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Russian GMP Certificate
   */
  generateGMP_RU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert specializing in Russian GMP certification requirements.
            Your task is to generate supporting documentation for Russian GMP certificate application.

            STRUCTURE FOR RUSSIAN GMP CERTIFICATE DOCUMENTATION:
            1. ОБЩАЯ ИНФОРМАЦИЯ О ПРОИЗВОДСТВЕ (General Manufacturing Information)
               1.1. Информация о производственной площадке (Manufacturing Site Information)
               1.2. Организационная структура (Organizational Structure)
               1.3. Система качества (Quality System)
            2. ПРОИЗВОДСТВЕННЫЕ ПРОЦЕССЫ (Manufacturing Processes)
               2.1. Описание производственного процесса (Manufacturing Process Description)
               2.2. Контроль качества (Quality Control)
               2.3. Валидация процессов (Process Validation)
            3. СООТВЕТСТВИЕ РОССИЙСКИМ GMP ТРЕБОВАНИЯМ
               3.1. Соответствие российским стандартам (Compliance with Russian Standards)
               3.2. Система документооборота (Documentation System)
               3.3. Обучение персонала (Personnel Training)
            4. ПЛАН ИНСПЕКЦИИ И АУДИТА

            Use plain text formatting only - NO MARKDOWN.
            Reference Russian GMP requirements and manufacturing standards.`
          },
          {
            role: "user",
            content: `Generate Russian GMP Certificate supporting documentation for manufacturing authorization of ${diseaseData.disease_name} treatment in Russia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support GMP certification requirements for Russian manufacturing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateGMP_RU:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // JAPAN DOCUMENTS
  // =============================================================================

  /**
   * Japanese Clinical Trial Notification (CTN)
   */
  generateCTN_JP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Japanese Clinical Trial Notifications (CTNs) for submission to the PMDA.
            Your task is to generate KEY SECTIONS of a Japanese CTN. This is a notification, not a full application dossier like an IND.

            KEY SECTIONS FOR A JAPANESE CTN SUMMARY:
            1.  NOTIFICATION OVERVIEW
                1.1. Trial Title (Japanese and English if available)
                1.2. Investigational Product Name / Code
                1.3. Sponsor Information
                1.4. Phase of Trial
                1.5. Planned Number of Sites and Subjects in Japan
            2.  INVESTIGATIONAL PRODUCT INFORMATION SUMMARY
                2.1. Brief Description (Type, class, proposed indication)
                2.2. Manufacturing Summary (Manufacturer, GMP compliance statement)
                2.3. Brief Quality Summary (Key specifications, stability overview)
                2.4. Brief Non-clinical Summary (Key findings supporting safety for human trials)
                2.5. Brief Clinical Summary (Previous human experience, if any)
            3.  CLINICAL TRIAL PROTOCOL SYNOPSIS (JAPAN-SPECIFIC)
                3.1. Objectives
                3.2. Study Design (e.g., randomized, placebo-controlled)
                3.3. Target Population and Key Eligibility Criteria
                3.4. Investigational Plan (Dosage, route, duration)
                3.5. Key Efficacy and Safety Endpoints
                3.6. Statistical Considerations (Briefly, sample size rationale)
            4.  LIST OF INVESTIGATIONAL SITES IN JAPAN (Illustrative)
            5.  CONTACT INFORMATION FOR PMDA QUERIES

            Use plain text formatting only - NO MARKDOWN.`
          },
          {
            role: "user",
            content: `Generate key sections for a Japanese Clinical Trial Notification (CTN) for a trial on ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            Generate concise yet informative content for the key CTN sections reflecting PMDA submission requirements.`
          }
        ],
        temperature: 0.2, max_tokens: 3000 
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTN_JP:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Japanese New Drug Application (J-NDA)
   */
  generateJNDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing Japanese New Drug Applications (J-NDAs) for submission to the PMDA/MHLW.
            Your task is to generate a J-NDA SUMMARY document. This should highlight key information structured similarly to the CTD, but with consideration for Japanese regulatory expectations.

            STRUCTURE (CTD-based, with J-NDA considerations):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED PACKAGE INSERT SUMMARY (Japanese 'Tensu-Bunsho')
            2. GAIYOU (OVERALL SUMMARY OF QUALITY - CTD Module 2.3)
            3. NONCLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.4 & 2.6)
            4. CLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.5 & 2.7 - EMPHASIZE JAPANESE DATA)
            5. KEY JAPANESE CLINICAL STUDY REPORT SUMMARIES

            Use plain text formatting only - NO MARKDOWN.
            Reference Japanese regulatory guidelines and emphasize data relevant to the Japanese population.`
          },
          {
            role: "user",
            content: `Generate a comprehensive J-NDA SUMMARY document for ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This J-NDA SUMMARY must be DETAILED and meet PMDA expectations, emphasizing data relevant to the Japanese population and any bridging strategies.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateJNDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * PMDA Scientific Advice
   */
  generatePMDA_CONSULTATION: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory strategy expert specializing in PMDA scientific advice consultations.
            Your task is to generate a PMDA scientific advice request document.

            STRUCTURE FOR PMDA SCIENTIFIC ADVICE:
            1. CONSULTATION REQUEST OVERVIEW
               1.1. Product and Development Background
               1.2. Specific Questions for PMDA
               1.3. Regulatory Strategy Context
            2. DEVELOPMENT PROGRAM SUMMARY
               2.1. Current Development Status
               2.2. Planned Clinical Development (Japan-specific considerations)
               2.3. Global Development Strategy
            3. SPECIFIC SCIENTIFIC QUESTIONS
               3.1. Clinical Development Questions
               3.2. Regulatory Pathway Questions
               3.3. Japanese Bridging Strategy
            4. SUPPORTING DATA AND RATIONALE
               4.1. Available Non-clinical Data
               4.2. Available Clinical Data
               4.3. Relevance to Japanese Population
            5. REQUESTED PMDA GUIDANCE

            Use plain text formatting only - NO MARKDOWN.
            Focus on strategic regulatory questions relevant to Japanese development.`
          },
          {
            role: "user",
            content: `Generate a PMDA Scientific Advice request for development strategy of ${diseaseData.disease_name} treatment in Japan.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This consultation request must address strategic development questions for Japanese regulatory pathway.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generatePMDA_CONSULTATION:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // CHINA DOCUMENTS
  // =============================================================================

  /**
   * Chinese IND Application
   */
  generateIND_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Chinese Investigational New Drug (IND) applications for submission to the NMPA.
            Your task is to generate KEY SECTIONS of a Chinese IND application. The structure may differ from US INDs, focusing on specific NMPA requirements.

            KEY SECTIONS FOR A CHINESE IND SUMMARY:
            1.  APPLICATION OVERVIEW
                1.1. Drug Name (Chinese and English if available), Dosage Form, Strength
                1.2. Applicant Information
                1.3. Proposed Indication
                1.4. Phase of Clinical Trial
            2.  INVESTIGATIONAL PRODUCT INFORMATION SUMMARY
                2.1. Manufacturing and Quality Control (Summary of CMC, highlighting local testing if applicable)
                2.2. Pharmacology and Toxicology Summary (Key non-clinical data, reference to any studies conducted in China or on similar populations)
                2.3. Previous Clinical Experience (Global and any data from Chinese subjects)
            3.  CLINICAL TRIAL PROTOCOL SYNOPSIS (CHINA-FOCUSED)
                3.1. Trial Objectives and Endpoints
                3.2. Study Design (Considerations for Chinese patient population)
                3.3. Subject Selection Criteria (Specific to Chinese context if needed)
                3.4. Treatment Plan (Dosage, administration, duration)
                3.5. Efficacy and Safety Assessment Plan
                3.6. Risk Management Plan Highlights for Chinese Patients
            4.  INVESTIGATOR'S BROCHURE SUMMARY (Key points relevant to Chinese investigators)
            5.  ETHICS COMMITTEE APPROVAL STATUS

            Use plain text formatting only - NO MARKDOWN.`
          },
          {
            role: "user",
            content: `Generate key sections for a Chinese IND application for a trial on ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            Generate content for key Chinese IND sections, reflecting NMPA expectations and highlighting aspects relevant to the Chinese context.`
          }
        ],
        temperature: 0.2, max_tokens: 3500
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIND_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Chinese NDA Application
   */
  generateNDA_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing Chinese New Drug Applications (NDAs) for submission to the NMPA.
            Your task is to generate a Chinese NDA SUMMARY document. This should be structured according to NMPA expectations, which may draw from CTD principles but have local nuances.

            STRUCTURE (CTD-based, with NMPA considerations):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED DRUG INSERT SUMMARY
            2. QUALITY INFORMATION SUMMARY (CMC)
            3. NONCLINICAL STUDY SUMMARY
            4. CLINICAL STUDY SUMMARY (EMPHASIZE DATA IN CHINESE PATIENTS)
            5. KEY CLINICAL TRIAL SUMMARIES (Trials conducted in China, or pivotal global trials with significant Chinese cohort)

            Use plain text formatting only - NO MARKDOWN.
            Reference Chinese regulatory guidelines and emphasize data from Chinese patients and alignment with NMPA guidelines.`
          },
          {
            role: "user",
            content: `Generate a comprehensive Chinese NDA SUMMARY document for ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This Chinese NDA SUMMARY must be DETAILED and meet NMPA expectations, emphasizing data from Chinese patients and alignment with NMPA guidelines.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Chinese Drug Registration Certificate
   */
  generateDRUG_LICENSE_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Chinese drug registration certificates for NMPA approval.
            Your task is to generate supporting documentation for Chinese drug license application.

            STRUCTURE FOR CHINESE DRUG REGISTRATION CERTIFICATE:
            1. 药品注册申请概述 (Drug Registration Application Overview)
               1.1. 产品信息 (Product Information)
               1.2. 申请人信息 (Applicant Information)
               1.3. 注册分类 (Registration Classification)
            2. 药品质量信息 (Drug Quality Information)
               2.1. 原料药信息 (API Information)
               2.2. 制剂信息 (Formulation Information)
               2.3. 中国生产或进口 (Chinese Manufacturing or Import)
            3. 非临床研究信息 (Non-clinical Study Information)
               3.1. 药理毒理研究 (Pharmacology and Toxicology Studies)
               3.2. 药代动力学研究 (Pharmacokinetic Studies)
            4. 临床试验信息 (Clinical Trial Information)
               4.1. 临床试验总结 (Clinical Trial Summary)
               4.2. 中国临床数据 (Chinese Clinical Data)
               4.3. 获益风险评估 (Benefit-Risk Assessment)
            5. 中国特殊考虑 (China-Specific Considerations)

            Use plain text formatting only - NO MARKDOWN.
            Reference Chinese regulatory framework and NMPA requirements for drug licensing.`
          },
          {
            role: "user",
            content: `Generate Chinese Drug Registration Certificate supporting documentation for ${diseaseData.disease_name} treatment licensing in China.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support drug registration certificate requirements for Chinese commercialization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateDRUG_LICENSE_CH:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // SOUTH KOREA DOCUMENTS
  // =============================================================================

  /**
   * Korean IND Application
   */
  generateIND_KR: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Korean Investigational New Drug (IND) applications for submission to the MFDS.
            Your task is to generate key sections for a Korean IND application.

            STRUCTURE FOR KOREAN IND:
            1. 임상시험계획서 개요 (Clinical Trial Protocol Overview)
               1.1. 시험약물 정보 (Investigational Drug Information)
               1.2. 의뢰자 및 주요 연구자 정보 (Sponsor and Principal Investigator Information)
               1.3. 한국 임상시험 개요 (Korean Clinical Trial Overview)
            2. 시험약물 정보 (Investigational Product Information)
               2.1. 약물 설명 및 분류 (Drug Description and Classification)
               2.2. 품질 정보 요약 (Quality Information Summary)
               2.3. 비임상 정보 요약 (Non-clinical Information Summary)
               2.4. 이전 임상 경험 (Previous Clinical Experience)
            3. 임상시험 프로토콜 개요 (Clinical Trial Protocol Synopsis)
               3.1. 연구 목적 및 설계 (Study Objectives and Design)
               3.2. 한국 환자 집단 (Korean Patient Population)
               3.3. 치료 계획 (Treatment Plan)
               3.4. 유효성 및 안전성 평가 (Efficacy and Safety Assessment)
            4. 한국 규제 고려사항 (Korean Regulatory Considerations)

            Use plain text formatting only - NO MARKDOWN.
            Reference Korean regulatory requirements and MFDS guidelines.`
          },
          {
            role: "user",
            content: `Generate a Korean IND application for ${diseaseData.disease_name} clinical trial in South Korea.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet MFDS requirements for clinical trial authorization in South Korea.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIND_KR:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Korean NDA Application
   */
  generateNDA_KR: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Korean New Drug Applications for MFDS submission.
            Your task is to generate a comprehensive Korean NDA summary.

            STRUCTURE FOR KOREAN NDA:
            1. 행정 정보 및 제품 정보 요약 (Administrative Information and Product Information Summary)
               1.1. 신청 개요 (Application Overview)
               1.2. 제안된 제품 정보 (Proposed Product Information)
            2. 품질 정보 요약 (Quality Information Summary)
               2.1. 원료의약품 요약 (Drug Substance Summary)
               2.2. 완제의약품 요약 (Drug Product Summary)
            3. 비임상 정보 요약 (Non-clinical Information Summary)
               3.1. 약리학 및 약동학 요약 (Pharmacology and Pharmacokinetics Summary)
               3.2. 독성학 요약 (Toxicology Summary)
            4. 임상 정보 요약 (Clinical Information Summary)
               4.1. 임상 개요 (Clinical Overview)
               4.2. 임상 유효성 요약 (Clinical Efficacy Summary)
               4.3. 임상 안전성 요약 (Clinical Safety Summary)
               4.4. 한국 인구에 대한 이익-위험 평가 (Benefit-Risk Assessment for Korean Population)
            5. 한국 특별 고려사항 (Korea-Specific Considerations)

            Use plain text formatting only - NO MARKDOWN.
            Reference Korean regulatory framework and MFDS requirements.`
          },
          {
            role: "user",
            content: `Generate a Korean NDA summary for MFDS approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This NDA summary must meet MFDS expectations for Korean marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_KR:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Korean GMP Certificate
   */
  generateKGMP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert specializing in Korean GMP certification requirements for MFDS.
            Your task is to generate supporting documentation for Korean GMP certificate application.

            STRUCTURE FOR KOREAN GMP CERTIFICATE:
            1. 제조업체 일반 정보 (General Manufacturing Information)
               1.1. 제조시설 정보 (Manufacturing Facility Information)
               1.2. 조직 구조 (Organizational Structure)
               1.3. 품질 시스템 (Quality System)
            2. 제조 공정 (Manufacturing Processes)
               2.1. 제조 공정 설명 (Manufacturing Process Description)
               2.2. 품질 관리 (Quality Control)
               2.3. 공정 검증 (Process Validation)
            3. 한국 GMP 요구사항 준수 (Korean GMP Requirements Compliance)
               3.1. 한국 표준 준수 (Compliance with Korean Standards)
               3.2. 문서화 시스템 (Documentation System)
               3.3. 인력 교육 (Personnel Training)
            4. 검사 및 심사 계획 (Inspection and Audit Plan)

            Use plain text formatting only - NO MARKDOWN.
            Reference Korean GMP requirements and MFDS manufacturing standards.`
          },
          {
            role: "user",
            content: `Generate Korean GMP Certificate supporting documentation for manufacturing authorization of ${diseaseData.disease_name} treatment in South Korea.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support Korean GMP certification requirements for MFDS manufacturing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateKGMP:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // AUSTRALIA DOCUMENTS
  // =============================================================================

  /**
   * Australian Clinical Trial Notification (CTN)
   */
  generateCTN_AU: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Australian Clinical Trial Notifications (CTN) for submission to the TGA.
            Your task is to generate KEY SECTIONS of an Australian CTN. This is a notification scheme, primarily requiring ethics approval and notification to TGA.

            KEY SECTIONS FOR AN AUSTRALIAN CTN SUMMARY:
            1.  TRIAL IDENTIFICATION
                1.1. Protocol Title
                1.2. Investigational Product(s) Name / Code
                1.3. Sponsor / Australian Sponsor Information
                1.4. Phase of Trial
            2.  TRIAL OVERVIEW
                2.1. Brief Rationale for the Trial
                2.2. Study Objectives
                2.3. Study Design Synopsis (e.g., randomized, placebo-controlled)
                2.4. Target Population in Australia (Number of participants)
            3.  INVESTIGATIONAL PRODUCT(S) SUMMARY
                3.1. Brief Description (Type, class, proposed indication)
                3.2. Manufacturing and Supply (GMP compliance, importation details if applicable)
            4.  ETHICS COMMITTEE (HREC) INFORMATION
                4.1. Name of Approving HREC
                4.2. Date of HREC Approval
            5.  PRINCIPAL INVESTIGATOR(S) AND SITE(S) (Illustrative list of Australian sites)
            
            Use plain text formatting only - NO MARKDOWN.`
          },
          {
            role: "user",
            content: `Generate key sections for an Australian Clinical Trial Notification (CTN) summary for a trial on ${diseaseData.disease_name}.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            Generate concise content for key Australian CTN informational sections reflecting TGA's CTN scheme requirements.`
          }
        ],
        temperature: 0.2, max_tokens: 2500
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTN_AU:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Australian Submission for ARTG
   */
  generateAUS: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in preparing submissions for registration on the Australian Register of Therapeutic Goods (ARTG) with the TGA.
            Your task is to generate an AUSTRALIAN SUBMISSION SUMMARY document. This should highlight key information, structured similarly to the CTD, for a TGA evaluation.

            STRUCTURE (CTD-based, with TGA considerations):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED PRODUCT INFORMATION (PI) SUMMARY
            2. QUALITY OVERALL SUMMARY (CTD Module 2.3)
            3. NONCLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.4 & 2.6)
            4. CLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.5 & 2.7 - EMPHASIZE RELEVANCE TO AUSTRALIAN POPULATION)
            5. KEY CLINICAL STUDY REPORT SUMMARIES (Pivotal trials supporting the submission)

            Use plain text formatting only - NO MARKDOWN.
            Reference TGA guidelines and demonstrate data applicability to the Australian population.`
          },
          {
            role: "user",
            content: `Generate a comprehensive AUSTRALIAN SUBMISSION SUMMARY document for ${diseaseData.disease_name}, for TGA evaluation and ARTG registration.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This Australian Submission Summary must be DETAILED and meet TGA expectations for an ARTG application dossier summary.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateAUS:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * TGA GMP Certificate
   */
  generateTGA_GMP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert specializing in TGA GMP certification requirements for Australian manufacturing authorization.
            Your task is to generate supporting documentation for TGA GMP certificate application.

            STRUCTURE FOR TGA GMP CERTIFICATE:
            1. MANUFACTURING FACILITY OVERVIEW
               1.1. Facility Information and Location
               1.2. Organizational Structure and Responsibilities
               1.3. Quality Management System
            2. MANUFACTURING OPERATIONS
               2.1. Manufacturing Process Description
               2.2. Quality Control Operations
               2.3. Process Validation and Qualification
            3. AUSTRALIAN GMP COMPLIANCE
               3.1. Compliance with Australian Manufacturing Standards
               3.2. Documentation and Record Systems
               3.3. Personnel Qualifications and Training
            4. INSPECTION READINESS AND COMPLIANCE MONITORING

            Use plain text formatting only - NO MARKDOWN.
            Reference Australian GMP requirements and TGA manufacturing standards.`
          },
          {
            role: "user",
            content: `Generate TGA GMP Certificate supporting documentation for Australian manufacturing authorization of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support TGA GMP certification requirements for Australian manufacturing license.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateTGA_GMP:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // SINGAPORE DOCUMENTS
  // =============================================================================

  /**
   * Singapore Clinical Trial Certificate (HSA)
   */
  generateCTA_SG: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Singapore Clinical Trial Certificates for HSA submission.
            Your task is to generate key sections for a Singapore clinical trial application.

            STRUCTURE FOR SINGAPORE CLINICAL TRIAL CERTIFICATE:
            1. APPLICATION OVERVIEW
               1.1. Clinical Trial Information
               1.2. Sponsor and Principal Investigator Details
               1.3. Singapore Trial Sites and Patient Numbers
            2. INVESTIGATIONAL PRODUCT INFORMATION
               2.1. Product Description and Classification
               2.2. Quality and Manufacturing Information
               2.3. Non-clinical Safety Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SUMMARY
               3.1. Study Objectives and Design
               3.2. Singapore Patient Population
               3.3. Treatment Protocol and Duration
               3.4. Safety and Efficacy Assessments
            4. SINGAPORE REGULATORY COMPLIANCE
               4.1. HSA Requirements Compliance
               4.2. Ethics Committee Approval Status
               4.3. Good Clinical Practice Compliance

            Use plain text formatting only - NO MARKDOWN.
            Reference Singapore regulatory requirements and HSA guidelines.`
          },
          {
            role: "user",
            content: `Generate a Singapore Clinical Trial Certificate application for ${diseaseData.disease_name} research.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet HSA requirements for clinical trial authorization in Singapore.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_SG:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Singapore Product License
   */
  generatePRODUCT_LICENSE_SG: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Singapore product licensing for HSA marketing authorization.
            Your task is to generate a comprehensive Singapore product license summary.

            STRUCTURE FOR SINGAPORE PRODUCT LICENSE:
            1. ADMINISTRATIVE INFORMATION AND PRODUCT INFORMATION
               1.1. Application Overview
               1.2. Proposed Singapore Product Information
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary
               2.3. Singapore Manufacturing or Import Considerations
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for Singapore Population
            5. SINGAPORE-SPECIFIC CONSIDERATIONS

            Use plain text formatting only - NO MARKDOWN.
            Reference Singapore regulatory framework and HSA requirements.`
          },
          {
            role: "user",
            content: `Generate a Singapore Product License summary for HSA marketing authorization of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet HSA expectations for Singapore marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generatePRODUCT_LICENSE_SG:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // INDIA DOCUMENTS
  // =============================================================================

  /**
   * Indian Clinical Trial Permission (CDSCO)
   */
  generateCTA_IN: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Indian clinical trial permissions for CDSCO submission.
            Your task is to generate key sections for an Indian clinical trial permission application.

            STRUCTURE FOR INDIAN CLINICAL TRIAL PERMISSION:
            1. APPLICATION OVERVIEW
               1.1. Clinical Trial Information
               1.2. Sponsor and Principal Investigator Information
               1.3. Indian Trial Sites and Subject Numbers
            2. INVESTIGATIONAL PRODUCT INFORMATION
               2.1. Drug Description and Classification
               2.2. Quality Information and Manufacturing
               2.3. Non-clinical Data Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS
               3.1. Study Objectives and Design
               3.2. Indian Patient Population and Eligibility
               3.3. Treatment Plan and Study Procedures
               3.4. Efficacy and Safety Evaluations
            4. INDIAN REGULATORY COMPLIANCE
               4.1. CDSCO Requirements Compliance
               4.2. Ethics Committee Approvals
               4.3. Good Clinical Practice Compliance
               4.4. Compensation and Insurance Provisions

            Use plain text formatting only - NO MARKDOWN.
            Reference Indian regulatory requirements and CDSCO guidelines.`
          },
          {
            role: "user",
            content: `Generate an Indian Clinical Trial Permission application for ${diseaseData.disease_name} research in India.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet CDSCO requirements for clinical trial permission in India.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateCTA_IN:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Indian New Drug Application
   */
  generateNDA_IN: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Indian New Drug Applications for CDSCO marketing approval.
            Your task is to generate a comprehensive Indian NDA summary.

            STRUCTURE FOR INDIAN NEW DRUG APPLICATION:
            1. ADMINISTRATIVE INFORMATION AND PROPOSED LABELING
               1.1. Application Overview
               1.2. Proposed Indian Package Insert
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary
               2.3. Indian Manufacturing or Import Information
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary (Indian and Global Data)
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for Indian Population
            5. INDIAN-SPECIFIC REGULATORY CONSIDERATIONS

            Use plain text formatting only - NO MARKDOWN.
            Reference Indian regulatory framework and CDSCO requirements.`
          },
          {
            role: "user",
            content: `Generate an Indian New Drug Application summary for CDSCO marketing approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This NDA summary must meet CDSCO expectations for Indian marketing approval.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_IN:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Indian Import License
   */
  generateIMPORT_LICENSE_IN: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Indian drug import licenses for CDSCO authorization.
            Your task is to generate supporting documentation for Indian import license application.

            STRUCTURE FOR INDIAN IMPORT LICENSE:
            1. IMPORT LICENSE APPLICATION OVERVIEW
               1.1. Importer Information
               1.2. Product Information and Classification
               1.3. Import Authorization Request
            2. PRODUCT QUALITY AND COMPLIANCE
               2.1. Manufacturing Site Information
               2.2. Quality Specifications and Testing
               2.3. GMP Compliance Certification
            3. REGULATORY STATUS AND APPROVALS
               3.1. Marketing Authorization Status (India/Foreign)
               3.2. Clinical Trial or Commercial Use Declaration
               3.3. Regulatory Compliance Certificates
            4. IMPORT LOGISTICS AND DISTRIBUTION
               4.1. Import Quantities and Frequency
               4.2. Storage and Distribution Plans
               4.3. Pharmacovigilance and Safety Reporting
            5. INDIAN REGULATORY COMPLIANCE

            Use plain text formatting only - NO MARKDOWN.
            Reference Indian import regulations and CDSCO requirements.`
          },
          {
            role: "user",
            content: `Generate Indian Import License supporting documentation for import authorization of ${diseaseData.disease_name} treatment into India.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support import license requirements for Indian drug importation.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIMPORT_LICENSE_IN:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // TAIWAN DOCUMENTS
  // =============================================================================

  /**
   * Taiwan IND Application
   */
  generateIND_TW: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Taiwan Investigational New Drug (IND) applications for TFDA submission.
            Your task is to generate key sections for a Taiwan IND application.

            STRUCTURE FOR TAIWAN IND:
            1. 試驗計畫概述 (Trial Plan Overview)
               1.1. 試驗藥物資訊 (Investigational Drug Information)
               1.2. 申請人及主持人資訊 (Applicant and Principal Investigator Information)
               1.3. 台灣臨床試驗概要 (Taiwan Clinical Trial Summary)
            2. 試驗藥物資訊 (Investigational Product Information)
               2.1. 藥物描述及分類 (Drug Description and Classification)
               2.2. 品質資訊摘要 (Quality Information Summary)
               2.3. 非臨床資訊摘要 (Non-clinical Information Summary)
               2.4. 先前臨床經驗 (Previous Clinical Experience)
            3. 臨床試驗計畫書概要 (Clinical Trial Protocol Synopsis)
               3.1. 研究目標及設計 (Study Objectives and Design)
               3.2. 台灣病患族群 (Taiwan Patient Population)
               3.3. 治療計畫 (Treatment Plan)
               3.4. 療效及安全性評估 (Efficacy and Safety Assessment)
            4. 台灣法規考量 (Taiwan Regulatory Considerations)

            Use plain text formatting only - NO MARKDOWN.
            Reference Taiwan regulatory requirements and TFDA guidelines.`
          },
          {
            role: "user",
            content: `Generate a Taiwan IND application for ${diseaseData.disease_name} clinical trial.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet TFDA requirements for clinical trial authorization in Taiwan.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateIND_TW:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Taiwan NDA Application
   */
  generateNDA_TW: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Taiwan New Drug Applications for TFDA approval.
            Your task is to generate a comprehensive Taiwan NDA summary.

            STRUCTURE FOR TAIWAN NDA:
            1. 行政資訊及產品資訊摘要 (Administrative Information and Product Information Summary)
               1.1. 申請概述 (Application Overview)
               1.2. 建議產品資訊 (Proposed Product Information)
            2. 品質資訊摘要 (Quality Information Summary)
               2.1. 原料藥摘要 (Drug Substance Summary)
               2.2. 製劑摘要 (Drug Product Summary)
            3. 非臨床資訊摘要 (Non-clinical Information Summary)
               3.1. 藥理學及藥物動力學摘要 (Pharmacology and Pharmacokinetics Summary)
               3.2. 毒理學摘要 (Toxicology Summary)
            4. 臨床資訊摘要 (Clinical Information Summary)
               4.1. 臨床概述 (Clinical Overview)
               4.2. 臨床療效摘要 (Clinical Efficacy Summary)
               4.3. 臨床安全性摘要 (Clinical Safety Summary)
               4.4. 台灣族群效益風險評估 (Benefit-Risk Assessment for Taiwan Population)
            5. 台灣特殊考量 (Taiwan-Specific Considerations)

            Use plain text formatting only - NO MARKDOWN.
            Reference Taiwan regulatory framework and TFDA requirements.`
          },
          {
            role: "user",
            content: `Generate a Taiwan NDA summary for TFDA approval of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This NDA summary must meet TFDA expectations for Taiwan marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateNDA_TW:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // LATIN AMERICA DOCUMENTS
  // =============================================================================

  /**
   * Brazilian ANVISA Clinical Trial Authorization
   */
  generateANVISA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Brazilian ANVISA clinical trial authorizations.
            Your task is to generate key sections for a Brazilian clinical trial authorization application.

            STRUCTURE FOR ANVISA CLINICAL TRIAL AUTHORIZATION:
            1. INFORMAÇÕES ADMINISTRATIVAS (Administrative Information)
               1.1. Informações do Estudo (Study Information)
               1.2. Patrocinador e Investigador Principal (Sponsor and Principal Investigator)
               1.3. Centros de Pesquisa no Brasil (Research Centers in Brazil)
            2. INFORMAÇÕES DO PRODUTO INVESTIGACIONAL
               2.1. Descrição do Produto (Product Description)
               2.2. Informações de Qualidade (Quality Information)
               2.3. Informações Não-Clínicas (Non-clinical Information)
               2.4. Experiência Clínica Prévia (Previous Clinical Experience)
            3. PROTOCOLO DE PESQUISA CLÍNICA
               3.1. Objetivos e Desenho do Estudo (Study Objectives and Design)
               3.2. População Brasileira e Critérios de Seleção (Brazilian Population and Selection Criteria)
               3.3. Plano de Tratamento (Treatment Plan)
               3.4. Avaliações de Eficácia e Segurança (Efficacy and Safety Evaluations)
            4. CONSIDERAÇÕES REGULATÓRIAS BRASILEIRAS

            Use plain text formatting only - NO MARKDOWN.
            Reference Brazilian regulatory requirements and ANVISA guidelines.`
          },
          {
            role: "user",
            content: `Generate a Brazilian ANVISA Clinical Trial Authorization for ${diseaseData.disease_name} research in Brazil.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet ANVISA requirements for clinical trial authorization in Brazil.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANVISA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Brazilian ANVISA Drug Registration
   */
  generateANVISA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Brazilian ANVISA drug registration.
            Your task is to generate a comprehensive ANVISA registration summary.

            STRUCTURE FOR ANVISA DRUG REGISTRATION:
            1. INFORMAÇÕES ADMINISTRATIVAS E BULA
               1.1. Resumo da Solicitação (Application Summary)
               1.2. Bula Proposta (Proposed Package Insert)
            2. INFORMAÇÕES DE QUALIDADE
               2.1. Resumo do Fármaco (Drug Substance Summary)
               2.2. Resumo do Medicamento (Drug Product Summary)
               2.3. Fabricação no Brasil ou Importação (Brazilian Manufacturing or Import)
            3. INFORMAÇÕES NÃO-CLÍNICAS
               3.1. Farmacologia e Farmacocinética
               3.2. Toxicologia
            4. INFORMAÇÕES CLÍNICAS
               4.1. Resumo Clínico (Clinical Overview)
               4.2. Eficácia Clínica (Clinical Efficacy)
               4.3. Segurança Clínica (Clinical Safety)
               4.4. Avaliação Benefício-Risco para População Brasileira
            5. CONSIDERAÇÕES ESPECIAIS PARA O BRASIL

            Use plain text formatting only - NO MARKDOWN.
            Reference Brazilian regulatory framework and ANVISA requirements.`
          },
          {
            role: "user",
            content: `Generate a Brazilian ANVISA Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Brazil.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration summary must meet ANVISA requirements for Brazilian marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANVISA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Brazilian ANVISA GMP Certificate
   */
  generateANVISA_GMP: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a quality assurance expert specializing in Brazilian ANVISA GMP certification requirements.
            Your task is to generate supporting documentation for ANVISA GMP certificate application.

            STRUCTURE FOR ANVISA GMP CERTIFICATE:
            1. INFORMAÇÕES GERAIS DE FABRICAÇÃO (General Manufacturing Information)
               1.1. Informações da Unidade Fabril (Manufacturing Unit Information)
               1.2. Estrutura Organizacional (Organizational Structure)
               1.3. Sistema de Qualidade (Quality System)
            2. PROCESSOS DE FABRICAÇÃO (Manufacturing Processes)
               2.1. Descrição do Processo de Fabricação (Manufacturing Process Description)
               2.2. Controle de Qualidade (Quality Control)
               2.3. Validação de Processos (Process Validation)
            3. CONFORMIDADE COM BPF BRASILEIRAS
               3.1. Conformidade com Normas Brasileiras (Compliance with Brazilian Standards)
               3.2. Sistema de Documentação (Documentation System)
               3.3. Treinamento de Pessoal (Personnel Training)
            4. PLANO DE INSPEÇÃO E AUDITORIA

            Use plain text formatting only - NO MARKDOWN.
            Reference Brazilian GMP requirements and ANVISA manufacturing standards.`
          },
          {
            role: "user",
            content: `Generate Brazilian ANVISA GMP Certificate supporting documentation for manufacturing authorization of ${diseaseData.disease_name} treatment in Brazil.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This documentation must support ANVISA GMP certification requirements for Brazilian manufacturing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANVISA_GMP:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // ADDITIONAL LATIN AMERICA DOCUMENTS (Argentina, Colombia, Chile)
  // =============================================================================

  /**
   * Argentine ANMAT Clinical Trial Authorization
   */
  generateANMAT_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Argentine ANMAT clinical trial authorizations.
            Your task is to generate key sections for an Argentine clinical trial authorization.

            STRUCTURE FOR ANMAT CLINICAL TRIAL AUTHORIZATION:
            1. INFORMACIÓN ADMINISTRATIVA
               1.1. Información del Estudio
               1.2. Patrocinador e Investigador Principal
               1.3. Centros de Investigación en Argentina
            2. INFORMACIÓN DEL PRODUCTO EN INVESTIGACIÓN
               2.1. Descripción del Producto
               2.2. Información de Calidad
               2.3. Información No-Clínica
               2.4. Experiencia Clínica Previa
            3. PROTOCOLO DE INVESTIGACIÓN CLÍNICA
               3.1. Objetivos y Diseño del Estudio
               3.2. Población Argentina y Criterios de Selección
               3.3. Plan de Tratamiento
               3.4. Evaluaciones de Eficacia y Seguridad
            4. CONSIDERACIONES REGULATORIAS ARGENTINAS

            Use plain text formatting only - NO MARKDOWN.
            Reference Argentine regulatory requirements and ANMAT guidelines.`
          },
          {
            role: "user",
            content: `Generate an Argentine ANMAT Clinical Trial Authorization for ${diseaseData.disease_name} research in Argentina.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet ANMAT requirements for clinical trial authorization in Argentina.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANMAT_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Argentine ANMAT Drug Registration
   */
  generateANMAT_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Argentine ANMAT drug registration.
            Your task is to generate a comprehensive ANMAT registration summary.

            STRUCTURE FOR ANMAT DRUG REGISTRATION:
            1. INFORMACIÓN ADMINISTRATIVA Y PROSPECTO
            2. INFORMACIÓN DE CALIDAD
            3. INFORMACIÓN NO-CLÍNICA
            4. INFORMACIÓN CLÍNICA
            5. CONSIDERACIONES ESPECIALES PARA ARGENTINA

            Use plain text formatting only - NO MARKDOWN.
            Reference Argentine regulatory framework and ANMAT requirements.`
          },
          {
            role: "user",
            content: `Generate an Argentine ANMAT Drug Registration summary for ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration summary must meet ANMAT requirements for Argentine marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateANMAT_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // Additional generators for Colombia (INVIMA) and Chile (ISP) would follow similar patterns...

  // =============================================================================
  // AFRICA & MIDDLE EAST DOCUMENTS
  // =============================================================================

  /**
   * South African SAHPRA Clinical Trial Authorization
   */
  generateSAHPRA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in South African SAHPRA clinical trial authorizations.
            Your task is to generate key sections for a South African clinical trial authorization.

            STRUCTURE FOR SAHPRA CLINICAL TRIAL AUTHORIZATION:
            1. APPLICATION OVERVIEW
               1.1. Clinical Trial Information
               1.2. Sponsor and Principal Investigator Information
               1.3. South African Trial Sites and Patient Numbers
            2. INVESTIGATIONAL PRODUCT INFORMATION
               2.1. Product Description and Classification
               2.2. Quality Information and Manufacturing
               2.3. Non-clinical Safety Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS
               3.1. Study Objectives and Design
               3.2. South African Patient Population
               3.3. Treatment Protocol and Duration
               3.4. Safety and Efficacy Assessments
            4. SOUTH AFRICAN REGULATORY COMPLIANCE
               4.1. SAHPRA Requirements Compliance
               4.2. Ethics Committee Approval Status
               4.3. Good Clinical Practice Compliance

            Use plain text formatting only - NO MARKDOWN.
            Reference South African regulatory requirements and SAHPRA guidelines.`
          },
          {
            role: "user",
            content: `Generate a South African SAHPRA Clinical Trial Authorization for ${diseaseData.disease_name} research.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This application must meet SAHPRA requirements for clinical trial authorization in South Africa.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSAHPRA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * South African SAHPRA Medicine Registration
   */
  generateSAHPRA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in South African SAHPRA medicine registration.
            Your task is to generate a comprehensive SAHPRA medicine registration summary.

            STRUCTURE FOR SAHPRA MEDICINE REGISTRATION:
            1. ADMINISTRATIVE INFORMATION AND PRODUCT INFORMATION
               1.1. Application Overview
               1.2. Proposed South African Product Information
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary
               2.3. South African Manufacturing or Import Considerations
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for South African Population
            5. SOUTH AFRICAN-SPECIFIC CONSIDERATIONS

            Use plain text formatting only - NO MARKDOWN.
            Reference South African regulatory framework and SAHPRA requirements.`
          },
          {
            role: "user",
            content: `Generate a South African SAHPRA Medicine Registration summary for marketing authorization of ${diseaseData.disease_name} treatment.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet SAHPRA expectations for South African marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSAHPRA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // COLOMBIA DOCUMENTS (INVIMA)
  // =============================================================================

  /**
   * Colombian INVIMA Clinical Trial Permit
   */
  generateINVIMA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Colombian INVIMA clinical trial permits.
            Your task is to generate key sections for a Colombian clinical trial permit application.

            STRUCTURE FOR INVIMA CLINICAL TRIAL PERMIT:
            1. INFORMACIÓN ADMINISTRATIVA (Administrative Information)
               1.1. Información del Ensayo Clínico (Clinical Trial Information)
               1.2. Patrocinador e Investigador Principal (Sponsor and Principal Investigator)
               1.3. Centros de Investigación en Colombia (Colombian Research Centers)
            2. INFORMACIÓN DEL PRODUCTO EN INVESTIGACIÓN
               2.1. Descripción del Producto (Product Description)
               2.2. Información de Calidad (Quality Information)
               2.3. Información No-Clínica (Non-clinical Information)
               2.4. Experiencia Clínica Previa (Previous Clinical Experience)
            3. PROTOCOLO DE INVESTIGACIÓN CLÍNICA
               3.1. Objetivos y Diseño del Estudio (Study Objectives and Design)
               3.2. Población Colombiana y Criterios de Selección (Colombian Population and Selection Criteria)
               3.3. Plan de Tratamiento (Treatment Plan)
               3.4. Evaluaciones de Eficacia y Seguridad (Efficacy and Safety Evaluations)
            4. CONSIDERACIONES REGULATORIAS COLOMBIANAS

            Use plain text formatting only - NO MARKDOWN.
            Reference Colombian regulatory requirements and INVIMA guidelines.`
          },
          {
            role: "user",
            content: `Generate a Colombian INVIMA Clinical Trial Permit for ${diseaseData.disease_name} research in Colombia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This permit application must meet INVIMA requirements for clinical trial authorization in Colombia.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateINVIMA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Colombian INVIMA Drug Registration
   */
  generateINVIMA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Colombian INVIMA drug registration.
            Your task is to generate a comprehensive INVIMA drug registration summary.

            STRUCTURE FOR INVIMA DRUG REGISTRATION:
            1. INFORMACIÓN ADMINISTRATIVA Y REGISTRO SANITARIO
               1.1. Resumen de la Solicitud (Application Summary)
               1.2. Registro Sanitario Propuesto (Proposed Sanitary Registration)
            2. INFORMACIÓN DE CALIDAD
               2.1. Resumen del Principio Activo (Active Ingredient Summary)
               2.2. Resumen del Producto Terminado (Finished Product Summary)
               2.3. Fabricación en Colombia o Importación (Colombian Manufacturing or Import)
            3. INFORMACIÓN NO-CLÍNICA
               3.1. Farmacología y Farmacocinética
               3.2. Toxicología
            4. INFORMACIÓN CLÍNICA
               4.1. Resumen Clínico (Clinical Overview)
               4.2. Eficacia Clínica (Clinical Efficacy)
               4.3. Seguridad Clínica (Clinical Safety)
               4.4. Evaluación Beneficio-Riesgo para Población Colombiana
            5. CONSIDERACIONES ESPECIALES PARA COLOMBIA

            Use plain text formatting only - NO MARKDOWN.
            Reference Colombian regulatory framework and INVIMA requirements.`
          },
          {
            role: "user",
            content: `Generate a Colombian INVIMA Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Colombia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration summary must meet INVIMA requirements for Colombian marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateINVIMA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // CHILE DOCUMENTS (ISP)
  // =============================================================================

  /**
   * Chilean ISP Clinical Trial Authorization
   */
  generateISP_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Chilean ISP clinical trial authorizations.
            Your task is to generate key sections for a Chilean clinical trial authorization application.

            STRUCTURE FOR ISP CLINICAL TRIAL AUTHORIZATION:
            1. INFORMACIÓN ADMINISTRATIVA (Administrative Information)
               1.1. Información del Protocolo (Protocol Information)
               1.2. Patrocinador e Investigador Principal (Sponsor and Principal Investigator)
               1.3. Centros de Investigación en Chile (Chilean Research Centers)
            2. INFORMACIÓN DEL PRODUCTO EN INVESTIGACIÓN
               2.1. Descripción del Producto (Product Description)
               2.2. Información de Calidad (Quality Information)
               2.3. Información No-Clínica (Non-clinical Information)
               2.4. Experiencia Clínica Previa (Previous Clinical Experience)
            3. PROTOCOLO DE INVESTIGACIÓN CLÍNICA
               3.1. Objetivos y Diseño del Estudio (Study Objectives and Design)
               3.2. Población Chilena y Criterios de Selección (Chilean Population and Selection Criteria)
               3.3. Plan de Tratamiento (Treatment Plan)
               3.4. Evaluaciones de Eficacia y Seguridad (Efficacy and Safety Evaluations)
            4. CONSIDERACIONES REGULATORIAS CHILENAS

            Use plain text formatting only - NO MARKDOWN.
            Reference Chilean regulatory requirements and ISP guidelines.`
          },
          {
            role: "user",
            content: `Generate a Chilean ISP Clinical Trial Authorization for ${diseaseData.disease_name} research in Chile.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This authorization application must meet ISP requirements for clinical trial approval in Chile.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateISP_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Chilean ISP Drug Registration
   */
  generateISP_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Chilean ISP drug registration.
            Your task is to generate a comprehensive ISP drug registration summary.

            STRUCTURE FOR ISP DRUG REGISTRATION:
            1. INFORMACIÓN ADMINISTRATIVA Y REGISTRO SANITARIO
               1.1. Resumen de la Solicitud (Application Summary)
               1.2. Registro Sanitario Propuesto (Proposed Sanitary Registration)
            2. INFORMACIÓN DE CALIDAD
               2.1. Resumen del Principio Activo (Active Ingredient Summary)
               2.2. Resumen del Producto Terminado (Finished Product Summary)
               2.3. Fabricación en Chile o Importación (Chilean Manufacturing or Import)
            3. INFORMACIÓN NO-CLÍNICA
               3.1. Farmacología y Farmacocinética
               3.2. Toxicología
            4. INFORMACIÓN CLÍNICA
               4.1. Resumen Clínico (Clinical Overview)
               4.2. Eficacia Clínica (Clinical Efficacy)
               4.3. Seguridad Clínica (Clinical Safety)
               4.4. Evaluación Beneficio-Riesgo para Población Chilena
            5. CONSIDERACIONES ESPECIALES PARA CHILE

            Use plain text formatting only - NO MARKDOWN.
            Reference Chilean regulatory framework and ISP requirements.`
          },
          {
            role: "user",
            content: `Generate a Chilean ISP Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Chile.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This registration summary must meet ISP requirements for Chilean marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateISP_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // ISRAEL DOCUMENTS (MOH)
  // =============================================================================

  /**
   * Israeli MOH Clinical Trial Permit
   */
  generateMOH_ISRAEL_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Israeli Ministry of Health (MOH) clinical trial permits.
            Your task is to generate key sections for an Israeli clinical trial permit application.

            STRUCTURE FOR ISRAELI MOH CLINICAL TRIAL PERMIT:
            1. APPLICATION OVERVIEW
               1.1. Clinical Trial Information
               1.2. Sponsor and Principal Investigator Information
               1.3. Israeli Trial Sites and Patient Numbers
            2. INVESTIGATIONAL PRODUCT INFORMATION
               2.1. Product Description and Classification
               2.2. Quality Information and Manufacturing
               2.3. Non-clinical Safety Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS
               3.1. Study Objectives and Design
               3.2. Israeli Patient Population
               3.3. Treatment Protocol and Duration
               3.4. Safety and Efficacy Assessments
            4. ISRAELI REGULATORY COMPLIANCE
               4.1. MOH Requirements Compliance
               4.2. Ethics Committee Approval Status
               4.3. Good Clinical Practice Compliance

            Use plain text formatting only - NO MARKDOWN.
            Reference Israeli regulatory requirements and MOH guidelines.`
          },
          {
            role: "user",
            content: `Generate an Israeli MOH Clinical Trial Permit for ${diseaseData.disease_name} research in Israel.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This permit application must meet Israeli MOH requirements for clinical trial authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMOH_ISRAEL_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Israeli Drug Registration
   */
  generateMOH_ISRAEL_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Israeli drug registration with the Ministry of Health.
            Your task is to generate a comprehensive Israeli drug registration summary.

            STRUCTURE FOR ISRAELI DRUG REGISTRATION:
            1. ADMINISTRATIVE INFORMATION AND PRODUCT INFORMATION
               1.1. Application Overview
               1.2. Proposed Israeli Product Information
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary
               2.3. Israeli Manufacturing or Import Considerations
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for Israeli Population
            5. ISRAELI-SPECIFIC CONSIDERATIONS

            Use plain text formatting only - NO MARKDOWN.
            Reference Israeli regulatory framework and MOH requirements.`
          },
          {
            role: "user",
            content: `Generate an Israeli Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Israel.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet Israeli MOH expectations for marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMOH_ISRAEL_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // SAUDI ARABIA DOCUMENTS (SFDA)
  // =============================================================================

  /**
   * Saudi SFDA Clinical Trial Authorization
   */
  generateSFDA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Saudi Food and Drug Authority (SFDA) clinical trial authorizations.
            Your task is to generate key sections for a Saudi clinical trial authorization application.

            STRUCTURE FOR SFDA CLINICAL TRIAL AUTHORIZATION:
            1. APPLICATION OVERVIEW
               1.1. Clinical Trial Information
               1.2. Sponsor and Principal Investigator Information
               1.3. Saudi Trial Sites and Patient Numbers
            2. INVESTIGATIONAL PRODUCT INFORMATION
               2.1. Product Description and Classification
               2.2. Quality Information and Manufacturing
               2.3. Non-clinical Safety Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS
               3.1. Study Objectives and Design
               3.2. Saudi Patient Population
               3.3. Treatment Protocol and Duration
               3.4. Safety and Efficacy Assessments
            4. SAUDI REGULATORY COMPLIANCE
               4.1. SFDA Requirements Compliance
               4.2. Ethics Committee Approval Status
               4.3. Good Clinical Practice Compliance

            Use plain text formatting only - NO MARKDOWN.
            Reference Saudi regulatory requirements and SFDA guidelines.`
          },
          {
            role: "user",
            content: `Generate a Saudi SFDA Clinical Trial Authorization for ${diseaseData.disease_name} research in Saudi Arabia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This authorization application must meet SFDA requirements for clinical trial approval in Saudi Arabia.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSFDA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Saudi SFDA Drug Registration
   */
  generateSFDA_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in Saudi SFDA drug registration.
            Your task is to generate a comprehensive SFDA drug registration summary.

            STRUCTURE FOR SFDA DRUG REGISTRATION:
            1. ADMINISTRATIVE INFORMATION AND PRODUCT INFORMATION
               1.1. Application Overview
               1.2. Proposed Saudi Product Information
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary
               2.3. Saudi Manufacturing or Import Considerations
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for Saudi Population
            5. SAUDI-SPECIFIC CONSIDERATIONS

            Use plain text formatting only - NO MARKDOWN.
            Reference Saudi regulatory framework and SFDA requirements.`
          },
          {
            role: "user",
            content: `Generate a Saudi SFDA Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in Saudi Arabia.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet SFDA expectations for Saudi marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateSFDA_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // UAE DOCUMENTS (DHA/MOH)
  // =============================================================================

  /**
   * UAE DHA Clinical Trial Permit
   */
  generateDHA_CTA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in UAE Dubai Health Authority (DHA) clinical trial permits.
            Your task is to generate key sections for a UAE clinical trial permit application.

            STRUCTURE FOR DHA CLINICAL TRIAL PERMIT:
            1. APPLICATION OVERVIEW
               1.1. Clinical Trial Information
               1.2. Sponsor and Principal Investigator Information
               1.3. UAE Trial Sites and Patient Numbers
            2. INVESTIGATIONAL PRODUCT INFORMATION
               2.1. Product Description and Classification
               2.2. Quality Information and Manufacturing
               2.3. Non-clinical Safety Summary
               2.4. Previous Clinical Experience
            3. CLINICAL TRIAL PROTOCOL SYNOPSIS
               3.1. Study Objectives and Design
               3.2. UAE Patient Population
               3.3. Treatment Protocol and Duration
               3.4. Safety and Efficacy Assessments
            4. UAE REGULATORY COMPLIANCE
               4.1. DHA Requirements Compliance
               4.2. Ethics Committee Approval Status
               4.3. Good Clinical Practice Compliance

            Use plain text formatting only - NO MARKDOWN.
            Reference UAE regulatory requirements and DHA guidelines.`
          },
          {
            role: "user",
            content: `Generate a UAE DHA Clinical Trial Permit for ${diseaseData.disease_name} research in the United Arab Emirates.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This permit application must meet DHA requirements for clinical trial authorization in the UAE.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateDHA_CTA:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * UAE Drug Registration
   */
  generateMOH_UAE_NDA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in UAE drug registration with the Ministry of Health.
            Your task is to generate a comprehensive UAE drug registration summary.

            STRUCTURE FOR UAE DRUG REGISTRATION:
            1. ADMINISTRATIVE INFORMATION AND PRODUCT INFORMATION
               1.1. Application Overview
               1.2. Proposed UAE Product Information
            2. QUALITY INFORMATION SUMMARY
               2.1. Drug Substance Summary
               2.2. Drug Product Summary
               2.3. UAE Manufacturing or Import Considerations
            3. NON-CLINICAL INFORMATION SUMMARY
               3.1. Pharmacology and Pharmacokinetics Summary
               3.2. Toxicology Summary
            4. CLINICAL INFORMATION SUMMARY
               4.1. Clinical Overview
               4.2. Clinical Efficacy Summary
               4.3. Clinical Safety Summary
               4.4. Benefit-Risk Assessment for UAE Population
            5. UAE-SPECIFIC CONSIDERATIONS

            Use plain text formatting only - NO MARKDOWN.
            Reference UAE regulatory framework and MOH requirements.`
          },
          {
            role: "user",
            content: `Generate a UAE Drug Registration summary for marketing authorization of ${diseaseData.disease_name} treatment in the United Arab Emirates.
            
            ${Object.entries(diseaseData.additional_parameters || {}).map(([key, value]) => 
              value ? `- ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}` : ''
            ).filter(Boolean).join('\n')}

            This summary must meet UAE MOH expectations for marketing authorization.`
          }
        ],
        temperature: 0.2, max_tokens: 4000
      });
      return { document_content: response.data.choices[0].message.content.trim() };
    } catch (error) {
      console.error('Error in generateMOH_UAE_NDA:', error.response?.data || error.message);
      throw error;
    }
  },

  // =============================================================================
  // QUERY ASSISTANT
  // =============================================================================

  queryAssistant: async (queryData) => {
    try {
      // First, ask GPT if the question is relevant to clinical/regulatory topics
      const relevanceCheck = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a relevance checker. Determine if a question is related to clinical trials, medical protocols, regulatory affairs, pharmaceutical development, or healthcare research.

              Respond with ONLY one word:
              - "RELEVANT" if the question is about clinical trials, medical research, drug development, regulatory submissions, medical conditions, treatments, or pharmaceutical topics
              - "IRRELEVANT" if the question is about cooking, weather, entertainment, sports, travel, technology, politics, or other non-medical topics`
            },
            {
              role: "user",
              content: queryData.question
            }
          ],
          temperature: 0,
          max_tokens: 10
        }
      );

      const relevance = relevanceCheck.data.choices[0].message.content.trim();

      // If irrelevant, return standardized response
      if (relevance === "IRRELEVANT") {
        return {
          answer: `CLINICAL ASSISTANT - OFF-TOPIC QUERY

I'm Lumina™, your specialized clinical protocol assistant. Your question appears to be outside my area of clinical and regulatory expertise.

MY SPECIALIZED CAPABILITIES:
- Clinical trial protocol design and optimization
- Regulatory document generation (IND, NDA, BLA, CTD, eCTD)
- Endpoint selection and statistical considerations
- Patient population definitions and inclusion/exclusion criteria
- Safety monitoring and adverse event assessment
- Regulatory compliance guidance (FDA, EMA, ICH guidelines)

EXAMPLES OF RELEVANT QUESTIONS:
- "What are appropriate primary endpoints for a Phase 2 atopic dermatitis trial?"
- "How should I structure inclusion criteria for a lung cancer study?"
- "What safety assessments are required for immunotherapy trials?"
- "How do I design a bioequivalence study?"

Please ask a question related to clinical trials, protocols, or regulatory affairs, and I'll provide detailed, professional guidance.`
        };
      }

      // If relevant, proceed with normal OpenAI response
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a clinical protocol and regulatory expert providing precise, well-structured, and professionally formatted answers.
              Your expertise spans all aspects of clinical trial design, regulatory submissions, and pharmaceutical development.
              
              CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
              - Use ONLY plain text - NO markdown, NO asterisks (*), NO bold (**), NO italics, NO special characters
              - Do NOT use ** for bold text or * for bullet points
              - Use simple dashes (-) or numbers (1., 2., 3.) for lists
              - Use ALL CAPS only for major section headings
              - Use normal text with clear line breaks and indentation for structure
              - No formatting symbols whatsoever - treat this as if you're writing in a basic text editor
              
              CONTENT RULES:
              - Structure responses with clear paragraphing and indentation
              - Be precise and direct - avoid unnecessary filler text
              - If the question involves a specific disease or protocol, tailor the answer accordingly
              - If asked about endpoints, list them clearly and explain their relevance
              - If asked about regulatory strategy, provide actionable advice
              - Cite relevant guidelines (ICH, FDA, EMA) when appropriate`
            },
            {
              role: "user",
              content: `Question: ${queryData.question}
              ${queryData.disease_context ? `Disease Context: ${queryData.disease_context}` : ''}
              ${queryData.protocol_id ? `Reference Protocol ID: ${queryData.protocol_id}` : ''}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }
      );
      
      return {
        answer: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in queryAssistant:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default openaiService;