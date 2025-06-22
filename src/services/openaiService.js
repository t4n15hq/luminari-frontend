// src/services/openaiService.js

import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// Create an Axios instance for OpenAI API
const openaiApi = axios.create({
  baseURL: 'https://api.openai.com/v1/',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json', // Default content type for most OpenAI chat/completion calls
  },
});

const openaiService = {
  /**
   * Transcribes audio files via OpenAI Whisper.
   * @param {File} file - An audio File object (mp3, wav, etc.)
   * @returns {Promise<string>} - The transcribed text
   */
  transcribeAudio: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-1"); // Using whisper-1 model

    try {
      const response = await openaiApi.post(
        "audio/transcriptions",
        formData,
        {
          headers: {
            // Override default Content-Type for FormData
            // Axios will correctly set multipart/form-data with boundary
            'Content-Type': undefined, 
          },
        }
      );
      return response.data.text;
    } catch (error) {
      console.error("Error in transcribeAudio:", error.response?.data || error.message);
      throw error; // Re-throw for the caller (api.js) to handle
    }
  },

  /**
   * Given a doctor–patient transcript, suggest the most likely diagnosis.
   * @param {string} transcript - Full text of the conversation.
   * @returns {Promise<string>} - GPT’s diagnostic suggestion.
   */
  diagnoseConversation: async (transcript) => {
    try {
      const response = await openaiApi.post( // Uses instance baseURL and default headers
        "chat/completions",
        {
          model: "gpt-4o-mini", // Current recommended model, good balance of capability and cost
          messages: [
            {
              role: "system",
              content: `
You are a board-certified medical specialist with extensive clinical experience across multiple disciplines including dermatology, neurology, cardiology, pulmonology, and gastroenterology. You will receive a raw transcript of patient symptoms and descriptions.

1) Identify the medical specialty most relevant to the symptoms described (dermatology, neurology, cardiology, pulmonology, or gastroenterology).

2) Write a single, informative paragraph that includes:
   - A clear diagnosis based on the symptoms described
   - Scientific information about this medical condition (pathophysiology, prevalence, epidemiology)
   - Brief explanation of why this diagnosis fits the symptoms
   - Use appropriate medical terminology while ensuring it remains understandable to patients

3) Then, on a new line, write EXACTLY these seven lines (with real newline characters, one field per line). Do NOT wrap them in quotes or commas:

Extracted Metadata:
Age: <value or Unknown>
Gender: <value or Unknown>
Race: <value or Unknown>
Skin Color: <value or Unknown> (only if dermatological)
Skin Type: <value or Unknown> (only if dermatological)
Condition Description: <brief summary of chief complaint and key symptoms>

For different specialties, focus on the following:

DERMATOLOGY - Pay attention to:
- Appearance, distribution, and behavior of lesions or rashes
- Skin type, history of allergies, exacerbating factors
- Family history of skin conditions

NEUROLOGY - Pay attention to:
- Pattern and progression of symptoms
- Sensory, motor, cognitive or speech changes
- Triggers, relief factors, family history

CARDIOLOGY - Pay attention to:
- Character of chest pain/discomfort if present
- Associated symptoms (shortness of breath, palpitations, syncope)
- Risk factors (hypertension, diabetes, family history)

PULMONOLOGY - Pay attention to:
- Breathing difficulties, cough characteristics
- Environmental exposures, smoking history
- Duration and progression of symptoms

GASTROENTEROLOGY - Pay attention to:
- Location and character of abdominal pain
- Changes in bowel habits, appetite, weight
- Relationship to food intake, family history

Example of desired output format (Dermatology):

Based on your symptoms, you likely have atopic dermatitis, a chronic inflammatory skin condition affecting approximately 15-20% of children and 1-3% of adults worldwide. The condition involves a defective skin barrier function and dysregulation of the immune system, particularly involving Th2 cytokines and IgE-mediated responses. Your description of recurrent intense itching, redness, and family history of allergies strongly supports this diagnosis.

Extracted Metadata:
Age: 34
Gender: Female
Race: Caucasian
Skin Color: Light
Skin Type: Dry
Condition Description: Recurrent itchy, red patches in elbow creases and behind knees, worse in winter, family history of asthma

Example of desired output format (Neurology):

Based on your symptoms, you likely have migraine with aura, a common neurological condition affecting approximately 12% of the population worldwide. This condition involves complex pathophysiology including cortical spreading depression, trigeminovascular activation, and neurogenic inflammation. Your description of recurrent, throbbing headaches preceded by visual disturbances, accompanied by nausea and photophobia, and triggered by stress and lack of sleep strongly supports this diagnosis.

Extracted Metadata:
Age: 29
Gender: Female
Race: Asian
Skin Color: Unknown
Skin Type: Unknown
Condition Description: Recurrent throbbing headaches preceded by zigzag lines in vision, with nausea and sensitivity to light, triggered by stress`
            },
            {
              role: "user",
              content: transcript
            }
          ],
          temperature: 0.2, // Lower temperature for more deterministic medical output
          max_tokens: 500 // Adjusted based on expected output length
        }
        // Default headers from openaiApi instance are used
      );
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error in diagnoseConversation:", error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Generates an executive summary protocol for a given disease.
   * @param {object} diseaseData - { disease_name: string, additional_parameters: object }
   * @returns {Promise<{protocol_id: string, protocol: string}>}
   */
  generateProtocol: async (diseaseData) => {
    try {
      const response = await openaiApi.post(
        'chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a senior regulatory affairs expert with 20+ years of experience in writing clinical study protocols.
              Your task is to generate a highly professional, ICH/FDA/EMA-compliant protocol EXECUTIVE SUMMARY for a clinical trial.
              The document must be in clean, plain text format—NO markdown, symbols, or special characters.

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
              - Use Title Case for subsection headings
              - Include appropriate clinical trial identifiers and version control
              - Follow standard clinical protocol document structure
              - DO NOT use markdown formatting like ## for headers or ** for emphasis
              - DO NOT use bullet points with * or - symbols; use regular numbers or letters for lists

              GUIDANCE FOR IN-DEPTH PROTOCOL CONTENT:
              
              For each section, include the following level of detail:
              
              1. PROTOCOL SUMMARY / SYNOPSIS:
                 - Full study title with phase designation
                 - Concise study rationale
                 - Primary and secondary objectives clearly stated
                 - Study design summary with randomization details
                 - Treatment arms and dosing regimens
                 - Key inclusion/exclusion criteria
                 - Sample size with justification
                 - Duration of study with detailed timeline
              
              2. INTRODUCTION & BACKGROUND:
                 - Disease epidemiology with prevalence statistics
                 - Current treatment landscape
                 - Unmet medical needs
                 - Investigational product background
                 - Preclinical data summary
                 - Previous clinical experience
                 - Rationale for current study design
              
              3. OBJECTIVES & ENDPOINTS:
                 - Primary objective with corresponding primary endpoint
                 - Secondary objectives with corresponding endpoints
                 - Exploratory objectives if applicable
                 - Definition of each endpoint with measurement method
                 - Timing of assessments
                 
              4. STUDY DESIGN & INVESTIGATIONAL PLAN:
                 - Study design diagram or detailed description
                 - Randomization methodology
                 - Blinding procedures
                 - Treatment allocation ratio
                 - Study timeline with specific periods
                 - Visit schedule
                 - Dose modification guidelines
                 
              5. STUDY POPULATION & ELIGIBILITY:
                 - Detailed inclusion criteria (minimum 5-7 criteria)
                 - Detailed exclusion criteria (minimum 8-10 criteria)
                 - Demographic requirements
                 - Permitted and prohibited concomitant medications
                 - Withdrawal criteria and procedures
                 
              6. INTERVENTIONS / TREATMENTS:
                 - Study drug description
                 - Formulation details
                 - Dosage and administration
                 - Packaging and labeling
                 - Storage conditions
                 - Dose modification guidelines
                 - Treatment compliance monitoring
                 
              7. ASSESSMENTS & PROCEDURES:
                 - Detailed schedule of assessments
                 - Screening procedures
                 - Efficacy assessments with validated instruments
                 - Safety assessments
                 - Laboratory assessments
                 - Patient-reported outcomes
                 - Follow-up procedures
                 
              8. STATISTICAL CONSIDERATIONS & DATA ANALYSIS:
                 - Sample size calculation with assumptions
                 - Analysis populations (ITT, PP, safety)
                 - Statistical methods for primary and secondary endpoints
                 - Interim analysis plan
                 - Missing data handling
                 - Multiplicity adjustments
                 
              9. OUTCOME ANALYSIS:
                 - Definition of treatment success
                 - Efficacy analysis methodology
                 - Safety monitoring approach
                 - Adverse event reporting and categorization
                 - Risk-benefit assessment
                 - DSMB/DMC structure and responsibilities
                 
              10. REFERENCES & APPENDICES:
                  - Key literature citations
                  - Supplementary materials
                  - Schedule of assessments table
                  - Study flow diagram
              
              Include relevant numerical values where appropriate including but not limited to:
              - Specific dosing amounts (e.g., 50 mg BID)
              - Treatment durations (e.g., 12 weeks)
              - Visit windows (e.g., ±3 days)
              - Laboratory parameter ranges (e.g., ALT < 2.5 × ULN)
              - Statistical thresholds (e.g., two-sided alpha of 0.05)
              
              Always reference a specific example of a comparable approved protocol when possible, such as "Following the precedent established in the CANTOS trial for inflammatory conditions..."
              
              For rare conditions or specialized protocols, incorporate established methodological frameworks like RECIST criteria for oncology or EULAR response criteria for rheumatology.
              
              IMPORTANT: Always consider how templates would apply to outlier cases - extremely rare diseases, pediatric populations, or complex comorbidities. Provide specific guidance for these edge cases.`
            },
            {
              role: "user",
              content: `Generate a highly professional and comprehensive Phase 2 Clinical Study Protocol EXECUTIVE SUMMARY for the treatment of ${diseaseData.disease_name}.
              ${diseaseData.additional_parameters.population ? `Target population: ${diseaseData.additional_parameters.population}.` : ''}
              ${diseaseData.additional_parameters.treatment_duration ? `Treatment duration: ${diseaseData.additional_parameters.treatment_duration}.` : ''}
              ${diseaseData.additional_parameters.drug_class ? `Drug class: ${diseaseData.additional_parameters.drug_class}.` : ''}
              ${diseaseData.additional_parameters.mechanism ? `Mechanism of action: ${diseaseData.additional_parameters.mechanism}.` : ''}
              ${diseaseData.additional_parameters.clinical_info ? `Additional clinical information: ${diseaseData.additional_parameters.clinical_info}.` : ''}

              REQUIREMENTS:
              1. This EXECUTIVE SUMMARY must be EXTREMELY DETAILED and meet professional industry standards and regulatory expectations
              2. Include comprehensive details across all required 10 sections
              3. Follow EXACTLY the section numbering and structure provided in the formatting requirements
              4. Include specific numerical values and concrete details for:
                 - Dosing regimens (specific amounts, frequencies, routes)
                 - Visit schedules (specific week numbers and timepoints)
                 - Assessment timepoints
                 - Inclusion/exclusion criteria (with specific parameters)
                 - Statistical thresholds and power calculations
              5. Include version number, date, and appropriate document control elements
              6. Use appropriate clinical and medical terminology
              7. DO NOT use any markdown formatting like ## for headers or ** for emphasis
              8. Use plain text formatting only - NO special characters or markdown
              9. Reference precedent protocols or methodological frameworks where applicable
              10. For ${diseaseData.disease_name}, include disease-specific assessment methods and endpoints

              The executive summary should be extremely detailed while remaining well-organized for busy executives and regulators to review.`  
            }
          ],
          temperature: 0.2,
          max_tokens: 4000 // Ensure enough tokens for detailed output
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
  
  // Generates CMC and Clinical sections for an IND submission
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
              
              STRICT FORMATTING REQUIREMENTS:
              - Format according to ICH E6(R2) Good Clinical Practice and FDA guidelines for IND submissions.
              - The document MUST be structured EXACTLY into these sections with this numbering for the clinical part:
                1. Intro / Background
                2. Objectives / Hypotheses / Endpoints
                3. Study Design & Sample Size
                4. Populations & Baseline
                5. Statistical Methods & Data Handling
                6. Efficacy Analysis
                7. Safety Analysis
                8. Pharmacokinetic / Exploratory
                9. Interim & Other Special Analyses
                10. References & Appendices
              - Format with appropriate document control elements (version control, dates, etc.)
              - Use ALL CAPS for main numbered headings 
              - Use Title Case for subheadings with appropriate numbering (e.g., 1.1, 1.1.1)
              - DO NOT use markdown formatting (such as ## for headers or ** for emphasis)
              - DO NOT use bullet points with * or - characters; use standard numbers or letters instead
              - Absolutely NO markdown or special formatting characters in the output
              - Use plain text with proper indentation and spacing only
              
              GUIDANCE FOR IN-DEPTH IND CONTENT:
              
              CMC SECTION: (Chemistry, Manufacturing, and Controls) - Critical for IND
              Start with a detailed CMC section that includes:
              
              1. Drug Substance Description:
                 - Chemical structure and properties, physical characteristics
                 - Method of preparation/synthesis route summary
                 - Impurity profile and characterization
                 - Specifications and reference standards
              
              2. Drug Product Description:
                 - Formulation composition with exact quantities of all components
                 - Dosage form specifications (appearance, strength, etc.)
                 - Justification of formulation and excipients
                 - Manufacturing process overview and controls
              
              3. Analytical Methods:
                 - Description of analytical procedures for drug substance and product (e.g., identity, assay, purity, dissolution)
                 - Validation summary or reference to validation reports
              
              4. Stability Data:
                 - Summary of stability studies (conditions, duration, results) for drug substance and product
                 - Proposed storage conditions and retest period/shelf-life
              
              5. Container Closure System:
                 - Description of primary packaging components
                 - Suitability for protection and compatibility

              6. Placebo Composition (if applicable)

              7. Labeling:
                 - Draft labeling for investigational drug product
              
              CLINICAL SECTION (IND Focus - often for Phase 1/2 studies):
              For each of the numbered sections, include the following level of detail:
              
              1. INTRO / BACKGROUND:
                 - Comprehensive disease overview and unmet need
                 - Investigational product: mechanism of action, class
                 - Summary of preclinical pharmacology and toxicology studies supporting human trials
                 - Previous human experience (if any)
                 - Scientific rationale for the proposed study and IND
              
              2. OBJECTIVES / HYPOTHESES / ENDPOINTS:
                 - Primary objective (often safety and tolerability for early phase INDs)
                 - Secondary objectives (e.g., PK, PD, preliminary efficacy signals)
                 - Detailed endpoint definitions, especially for safety and PK
              
              3. STUDY DESIGN & SAMPLE SIZE:
                 - Phase of study (e.g., Phase 1, Phase 2a)
                 - Detailed study design (e.g., dose escalation, single ascending dose, multiple ascending dose, randomized controlled)
                 - Treatment arms, dosing regimens, route of administration
                 - Study duration per subject and overall
                 - Sample size justification (often based on feasibility for early phase)
              
              4. POPULATIONS & BASELINE:
                 - Target patient population or healthy volunteers
                 - Detailed inclusion and exclusion criteria specific to early phase studies
                 - Screening and baseline assessments
              
              5. STATISTICAL METHODS & DATA HANDLING:
                 - Primarily descriptive statistics for safety and PK
                 - Data collection and management procedures
                 - AE coding (MedDRA)
              
              6. EFFICACY ANALYSIS (if applicable for the phase, may be exploratory):
                 - Exploratory efficacy endpoints and analysis methods
              
              7. SAFETY ANALYSIS:
                 - AE monitoring, grading (CTCAE), and reporting procedures
                 - Safety stopping rules or dose escalation criteria
                 - Laboratory safety tests, vital signs, ECGs
              
              8. PHARMACOKINETIC / EXPLORATORY:
                 - PK sampling schedule and parameters to be assessed
                 - PD biomarker plan, if applicable
              
              9. INTERIM & OTHER SPECIAL ANALYSES:
                 - Plans for interim safety reviews (e.g., by a Safety Monitoring Committee)
              
              10. REFERENCES & APPENDICES:
                  - Key preclinical and clinical references
                  - Investigator's Brochure reference
              
              Include relevant numerical values where appropriate.
              Reference relevant FDA guidance documents for IND submissions.
              
              Your response MUST ALSO contain these two clearly marked sections: "CMC SECTION:" and "CLINICAL SECTION:"
              Place these section headers on separate lines before and after the 10 numbered sections.`
            },
            {
              role: "user",
              content: `Generate a comprehensive, FDA-compliant MAIN DOCUMENT for an Investigational New Drug (IND) application for ${diseaseData.disease_name}.
              This document is intended for a Phase 1 or early Phase 2 clinical trial.
              Country: ${diseaseData.additional_parameters.country || 'USA'}
              Document Type: ${diseaseData.additional_parameters.document_type || 'IND'}

              First include a "CMC SECTION:" containing Chemistry, Manufacturing, and Controls information including:
                - Detailed drug substance specifications
                - Comprehensive drug product manufacturing process
                - Validated analytical methods
                - Stability data summary
                ${diseaseData.additional_parameters.drug_class ? `- Detailed information on the ${diseaseData.additional_parameters.drug_class} including pharmacological properties` : ''}
                - Quality control procedures
              
              Then include a "CLINICAL SECTION:" that follows EXACTLY this numbered structure:
                1. INTRO / BACKGROUND
                2. OBJECTIVES / HYPOTHESES / ENDPOINTS
                3. STUDY DESIGN & SAMPLE SIZE
                4. POPULATIONS & BASELINE
                5. STATISTICAL METHODS & DATA HANDLING
                6. EFFICACY ANALYSIS
                7. SAFETY ANALYSIS
                8. PHARMACOKINETIC / EXPLORATORY
                9. INTERIM & OTHER SPECIAL ANALYSES
                10. REFERENCES & APPENDICES
              
              IMPORTANT REQUIREMENTS:
              1. This document must be EXTREMELY DETAILED and meet professional industry standards for an IND submission to the FDA.
              2. Include comprehensive information in each section with specific numerical values relevant to an early phase trial.
              3. Do NOT use markdown formatting.
              4. Do NOT use bullet points with * or - characters.
              5. Use ONLY plain text with proper indentation and spacing.
              6. Include these specific elements in the appropriate sections:
                - ${diseaseData.additional_parameters.population ? `Detailed population information for: ${diseaseData.additional_parameters.population}` : 'Comprehensive patient/volunteer eligibility criteria'}
                - ${diseaseData.additional_parameters.treatment_duration ? `Detailed treatment plan for duration: ${diseaseData.additional_parameters.treatment_duration}` : 'Comprehensive treatment schedule'}
                - ${diseaseData.additional_parameters.mechanism ? `Detailed mechanism of action: ${diseaseData.additional_parameters.mechanism}` : ''}
                - ${diseaseData.additional_parameters.clinical_info ? `Relevant clinical information: ${diseaseData.additional_parameters.clinical_info}` : ''}
                
              This MAIN DOCUMENT must be suitable for an IND submission. Focus on safety, PK, and early signals of activity appropriate for ${diseaseData.disease_name}.
              Reference FDA guidance for INDs and preclinical data supporting the trial.
              IMPORTANT: Ensure the CMC section is robust as it's a cornerstone of an IND.`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000 // Max tokens for comprehensive output
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
      if (!clinicalSection && fullResponse.toLowerCase().includes("clinical")) {
         const clinicalContentIndex = fullResponse.toLowerCase().indexOf("clinical section:");
         if (clinicalContentIndex !== -1) {
            clinicalSection = fullResponse.substring(clinicalContentIndex + "clinical section:".length).trim();
         } else {
            const genericClinicalIndex = fullResponse.toLowerCase().indexOf("clinical");
            if (genericClinicalIndex !== -1) {
                 clinicalSection = fullResponse.substring(genericClinicalIndex).trim();
            }
         }
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
  
  // Generates an NDA Summary
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
              The document must be in clean, plain text format—NO markdown, symbols, or special characters.

              STRICT FORMATTING REQUIREMENTS:
              - Format according to FDA guidelines for NDA submissions, reflecting the Common Technical Document (CTD) structure.
              - Focus on generating key summary sections of an NDA, structured similarly to CTD Module 2 and incorporating pivotal data from Module 5.
              - Example High-Level Structure (adaptable based on CTD modules):
                1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY
                   1.1. Application Summary
                   1.2. Proposed Labeling Highlights (Key sections of Prescribing Information)
                2. OVERALL SUMMARY OF QUALITY (Based on CTD Module 2.3)
                   2.1. Introduction to Quality
                   2.2. Drug Substance Summary (Manufacture, Characterization, Control, Stability)
                   2.3. Drug Product Summary (Description, Formulation, Manufacture, Control, Stability)
                3. NONCLINICAL OVERVIEW AND SUMMARY (Based on CTD Modules 2.4 & 2.6)
                   3.1. Nonclinical Overview
                   3.2. Pharmacology Summary (Primary, Secondary, Safety Pharmacology)
                   3.3. Pharmacokinetics Summary (Nonclinical - ADME)
                   3.4. Toxicology Summary (Single-dose, Repeat-dose, Genotoxicity, Carcinogenicity, Reproductive Tox)
                4. CLINICAL OVERVIEW AND SUMMARY (Based on CTD Modules 2.5 & 2.7)
                   4.1. Clinical Overview (Product Development Rationale, Biopharmaceutics, Clinical Pharmacology - PK/PD, Immunogenicity)
                   4.2. Summary of Clinical Efficacy (Pivotal studies, study designs, populations, primary/secondary endpoints, key results with statistical significance, subgroup analyses)
                   4.3. Summary of Clinical Safety (Extent of exposure, AEs, deaths, SAEs, AEs of special interest, laboratory findings, vital signs, ECGs, overall safety assessment)
                   4.4. Benefits and Risks Conclusions
                5. KEY CLINICAL STUDY REPORT SUMMARIES (Brief highlights from pivotal Phase 3 trials from Module 5)
                   5.1. Pivotal Study 1 (e.g., [Study Identifier]): Brief Design, Key Efficacy Results, Key Safety Findings
                   5.2. Pivotal Study 2 (e.g., [Study Identifier]): Brief Design, Key Efficacy Results, Key Safety Findings
              - Use ALL CAPS for main section headings.
              - Use Title Case for subsection headings with appropriate numbering.
              - DO NOT use markdown formatting. Provide clean plain text.

              GUIDANCE FOR NDA SUMMARY CONTENT:
              - Emphasize pivotal trial results supporting efficacy and safety for the proposed indication: ${diseaseData.disease_name}.
              - Clearly articulate the drug's benefit-risk profile.
              - Summarize pharmacology, pharmacokinetics (clinical and nonclinical), and toxicology for the drug class: ${diseaseData.additional_parameters.drug_class || 'N/A'}.
              - Detail the quality aspects of the drug substance and drug product.
              - Include proposed labeling concepts and how data support them.
              - Reference specific data, p-values, effect sizes, and patient numbers from clinical trials.
              - The focus is on a SUMMARY document, not the full detailed reports.
              Your response MUST be a single, coherent document.
              `
            },
            {
              role: "user",
              content: `Generate a comprehensive NDA SUMMARY document for the treatment of ${diseaseData.disease_name}.
              Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
              Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
              Country for Submission: USA (NDA for FDA)
              Document Type: ${diseaseData.additional_parameters.document_type || 'NDA Summary'}
              Key Clinical Trial Data Summary (assume successful Phase 3 data for pivotal trials): ${diseaseData.additional_parameters.clinical_info || 'Pivotal Phase 3 trials demonstrated statistically significant and clinically meaningful efficacy with a manageable safety profile.'}

              REQUIREMENTS:
              1. This NDA SUMMARY must be EXTREMELY DETAILED and meet FDA expectations for such a summary document, focusing on Module 2 content.
              2. Include comprehensive details across all relevant CTD Module 2 summary sections and key findings from Module 5.
              3. Follow EXACTLY the section structure and formatting requirements provided in the system prompt.
              4. Include specific (even if illustrative) numerical values: p-values, confidence intervals, effect sizes, patient numbers, key safety event rates.
              5. Use plain text formatting only. NO MARKDOWN.
              6. The document should be structured as a cohesive NDA Summary, suitable for regulatory review.
              Output only the generated document content.
              `
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

  // Generates key sections for a European CTA
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
              The document must be in clean, plain text format—NO markdown, symbols, or special characters.

              STRICT FORMATTING REQUIREMENTS:
              - Format according to EU CTR requirements for CTA submissions via CTIS.
              - Focus on generating content for key sections of the CTA dossier, such as:
                A. COVER LETTER AND APPLICATION FORM HIGHLIGHTS (e.g., trial title, EudraCT number if transitional, key contacts, list of MS concerned)
                B. PROTOCOL SUMMARY (Key elements: title, objectives, design, population, endpoints, IMP dosage, duration. Not the full protocol.)
                C. INVESTIGATOR'S BROCHURE (IB) SUMMARY (Key preclinical and clinical findings, risk assessment. Not the full IB.)
                D. GMP COMPLIANCE AND IMPD (Investigational Medicinal Product Dossier) - KEY SUMMARIES
                   D.1. IMP Quality Data Summary (IMPD-Q like summary: brief description of substance, product, placebo, manufacturing site(s) and QP certification, stability highlights)
                   D.2. IMP Non-Clinical Data Summary (IMPD-S like summary: key pharmacology, toxicology findings relevant to human safety)
                   D.3. IMP Clinical Data Summary (Previous human experience, if any, relevant to the proposed trial)
                E. AUXILIARY MEDICINAL PRODUCTS (if any, brief description and justification)
                F. SCIENTIFIC ADVICE AND PIP (Pediatric Investigation Plan) - (Summary of relevant advice or PIP status)
                G. MANUFACTURING AND IMPORTATION AUTHORIZATIONS (Statement of MIA holder for IMP release in EU)
              - Use ALL CAPS for main section headings.
              - Use Title Case for subsection headings with appropriate lettering/numbering.
              - DO NOT use markdown formatting. Provide clean plain text.

              GUIDANCE FOR CTA CONTENT:
              - The IMPD-Q summary (D.1) should briefly cover drug substance, drug product, placebo (if used), manufacturing, and stability highlights sufficient for a CTA.
              - The IMPD-S/P summary (D.2, D.3) should concisely present non-clinical and any prior clinical findings relevant to the trial.
              - For ${diseaseData.disease_name}, ensure the summaries align with typical requirements for a trial in this indication in the EU.
              - This is about generating KEY SECTIONS/SUMMARIES, not the entirety of all documents. The full documents would be attached in CTIS.
              Your response MUST be a single, coherent document representing these key CTA section summaries.
              `
            },
            {
              role: "user",
              content: `Generate key section summaries for a European Clinical Trial Application (CTA) for a trial on ${diseaseData.disease_name}.
              Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
              Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
              Target EU Countries (for context): ${diseaseData.additional_parameters.country || 'Germany, France, Spain'}
              Trial Phase (for context): ${diseaseData.additional_parameters.clinical_info || 'Phase II'}
              Document Type: ${diseaseData.additional_parameters.document_type || 'CTA Summary'}


              REQUIREMENTS:
              1. Generate content for the key CTA section summaries outlined in the system prompt, especially protocol, IB, and IMPD summaries.
              2. The content must be detailed enough for a CTA summary and meet EU CTR expectations for these sections.
              3. Follow EXACTLY the section structure and formatting requirements.
              4. Use plain text formatting only. NO MARKDOWN.
              5. Focus on IMP-related information (Quality, Non-clinical, Clinical summaries) and trial essentials.
              Output only the generated document content.
              `
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

  // Generates an MAA Summary
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
              The document must be in clean, plain text format—NO markdown, symbols, or special characters.

              STRICT FORMATTING REQUIREMENTS:
              - Format according to EMA guidelines for MAA submissions, reflecting the CTD structure.
              - Focus on generating key summary sections of an MAA:
                1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY (SmPC Highlights)
                   1.1. Application Overview (Product name, indication, applicant)
                   1.2. Summary of Product Characteristics (SmPC) - Key Sections Summary (e.g., 4.1 Therapeutic indications, 4.2 Posology, 4.3 Contraindications, 4.4 Special warnings, 4.8 Undesirable effects, 5.1 Pharmacodynamic properties)
                2. QUALITY OVERALL SUMMARY (QOS - CTD Module 2.3)
                   2.1. Introduction to Quality
                   2.2. Drug Substance (S) Summary (Manufacture, Characterisation, Control, Stability)
                   2.3. Drug Product (P) Summary (Description, Formulation, Manufacture, Control, Stability)
                3. NON-CLINICAL OVERVIEW AND WRITTEN SUMMARIES (CTD Modules 2.4 & 2.6)
                   3.1. Non-Clinical Overview
                   3.2. Pharmacology Written Summary (Primary, Secondary, Safety Pharmacology)
                   3.3. Pharmacokinetics Written Summary (Non-Clinical - ADME)
                   3.4. Toxicology Written Summary (Single-dose, Repeat-dose, Genotoxicity, Carcinogenicity, Reproductive Tox)
                4. CLINICAL OVERVIEW AND SUMMARY OF CLINICAL EFFICACY & SAFETY (CTD Modules 2.5 & 2.7)
                   4.1. Clinical Overview (Product Development Rationale, Clinical Pharmacology, Biopharmaceutics, PK/PD)
                   4.2. Summary of Clinical Efficacy (Pivotal studies, study designs, populations, primary/secondary endpoints, key results with statistical significance, subgroup analyses, discussion of clinical relevance)
                   4.3. Summary of Clinical Safety (Patient exposure, AEs, SAEs, specific safety findings, risk management highlights, safety in special populations)
                   4.4. Benefit-Risk Assessment (Clear articulation of benefits vs. risks)
                5. PIVOTAL CLINICAL STUDY REPORT SUMMARIES (Key findings from pivotal Phase 3 trials - Module 5 highlights)
                   5.1. Pivotal Efficacy/Safety Study 1 ([Study ID]): Brief Design, Population, Key Endpoints, Efficacy Results, Safety Results
                   5.2. Pivotal Efficacy/Safety Study 2 ([Study ID]): Brief Design, Population, Key Endpoints, Efficacy Results, Safety Results
              - Use ALL CAPS for main section headings.
              - Use Title Case for subsection headings with appropriate numbering.
              - DO NOT use markdown formatting. Provide clean plain text.

              GUIDANCE FOR MAA SUMMARY CONTENT:
              - Clearly demonstrate Positive Benefit-Risk Balance for ${diseaseData.disease_name}.
              - Summarize pivotal clinical trial data (efficacy and safety) for the proposed indication.
              - Detail quality, non-clinical pharmacology, PK, and toxicology for drug class: ${diseaseData.additional_parameters.drug_class || 'N/A'}.
              - Articulate how the SmPC is supported by the data.
              - Include information on Risk Management Plan (RMP) highlights if applicable.
              - Ensure the summary is tailored to European regulatory expectations.
              Your response MUST be a single, coherent document.
              `
            },
            {
              role: "user",
              content: `Generate a comprehensive MAA SUMMARY document for the treatment of ${diseaseData.disease_name}, for submission to the EMA.
              Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
              Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
              Proposed Indication: Treatment of ${diseaseData.disease_name}
              Country for Submission: European Union (MAA for EMA)
              Document Type: ${diseaseData.additional_parameters.document_type || 'MAA Summary'}
              Key Clinical Trial Data Summary (assume robust, positive Phase 3 data): ${diseaseData.additional_parameters.clinical_info || 'Pivotal Phase 3 trials met primary and key secondary endpoints with statistical significance and clinical relevance. Safety profile was acceptable and consistent with the drug class.'}

              REQUIREMENTS:
              1. This MAA SUMMARY must be EXTREMELY DETAILED and meet EMA CTD standards for summary documents (Module 2 focus).
              2. Include comprehensive details for all relevant CTD Module 2 summaries and pivotal Module 5 findings.
              3. Follow EXACTLY the section structure and formatting requirements.
              4. Include specific (even if illustrative) numerical data: efficacy outcomes (e.g. mean change, response rates), p-values, confidence intervals, safety event rates, patient numbers.
              5. Use plain text formatting only. NO MARKDOWN.
              6. The document should be a cohesive MAA Summary.
              Output only the generated document content.
              `
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

  // Generates an IMPD (Investigational Medicinal Product Dossier)
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
              Your task is to generate a well-structured IMPD, focusing on Quality (IMPD-Q) and relevant summaries for Safety/Efficacy (IMPD-S/E if simplified IMPD is requested or for context).
              The document must be in clean, plain text format—NO markdown, symbols, or special characters.

              STRICT FORMATTING REQUIREMENTS (IMPD-Q focus):
              - Structure based on EMA guidelines for IMPD Quality section.
              - Key Sections for IMPD-Q:
                1. INTRODUCTION (Brief overview of the IMP, its intended use in the trial for ${diseaseData.disease_name}, and dosage form: ${diseaseData.additional_parameters.clinical_info || 'Not specified'})
                2. DRUG SUBSTANCE (S)
                   2.1. General Information (Nomenclature, CAS, structure, general properties)
                   2.2. Manufacture (Manufacturer(s), brief description of manufacturing process and controls)
                   2.3. Characterisation (Elucidation of structure and other characteristics, impurities summary)
                   2.4. Control of Drug Substance (Specifications table, brief description of analytical procedures and validation, batch analyses summary)
                   2.5. Reference Standards or Materials
                   2.6. Container Closure System for Drug Substance
                   2.7. Stability (Summary of stability studies, conclusions, proposed re-test period)
                3. DRUG PRODUCT (P)
                   3.1. Description and Composition (Description of dosage form, composition table with function of excipients)
                   3.2. Pharmaceutical Development (Brief summary of formulation development, compatibility with container closure)
                   3.3. Manufacture (Manufacturer(s), brief description of manufacturing process and controls, process validation summary)
                   3.4. Control of Excipients (Specifications for critical excipients)
                   3.5. Control of Drug Product (Specifications table, brief description of analytical procedures and validation, batch analyses summary)
                   3.6. Reference Standards or Materials
                   3.7. Container Closure System for Drug Product
                   3.8. Stability (Summary of stability studies, conclusions, proposed shelf-life)
                4. PLACEBO (if applicable - structure similar to Drug Product, detailing composition and controls)
                5. APPENDICES (List of potential appendices, e.g., Facilities and Equipment, Adventitious Agents Safety, Novel Excipients)
              (Optional Brief Summaries for IMPD-S and IMPD-E, if this is for a simplified IMPD or context requires it):
                6. NON-CLINICAL SUMMARY (IMPD-S) (Brief overview of key non-clinical pharmacology, PK, toxicology studies. Reference to IB.)
                7. CLINICAL SUMMARY (IMPD-E) (Brief overview of any previous human experience, including PK, PD, efficacy, safety. Reference to IB.)
              - Use ALL CAPS for main section headings.
              - Use Title Case for subsection headings with appropriate numbering (e.g., 2.1, 2.1.1).
              - DO NOT use markdown formatting. Provide clean plain text.

              GUIDANCE FOR IMPD CONTENT:
              - The IMPD-Q section must be detailed, covering all aspects from drug substance to finished product, including manufacturing, controls, and stability, appropriate for the trial phase: ${diseaseData.additional_parameters.clinical_info || 'Phase I/II'}.
              - For ${diseaseData.disease_name}, ensure details are consistent with an IMP for this type of condition.
              - If providing IMPD-S/E summaries, these should be brief and reference the full IB or other relevant documents.
              Your response MUST be a single, coherent document representing the IMPD.
              `
            },
            {
              role: "user",
              content: `Generate an Investigational Medicinal Product Dossier (IMPD) for a clinical trial concerning ${diseaseData.disease_name}. Focus primarily on the IMPD-Quality (IMPD-Q) section.
              Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
              Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
              Dosage Form (for context): ${diseaseData.additional_parameters.clinical_info || 'Oral tablet'}
              Trial Phase (for context): ${diseaseData.additional_parameters.clinical_info || 'Phase I/II'}
              Country for Submission: ${diseaseData.additional_parameters.country || 'European Union'}
              Document Type: ${diseaseData.additional_parameters.document_type || 'IMPD'}


              REQUIREMENTS:
              1. Generate a detailed IMPD-Q section as outlined in the system prompt. Include illustrative details for specifications (e.g., Appearance: White crystalline powder; Assay: 98.0-102.0%).
              2. Include specific (even if illustrative) details for manufacturing, controls, specifications, and stability.
              3. If brief IMPD-S (Non-clinical Summary) and IMPD-E (Clinical Summary - previous human experience) sections are appropriate for context, include them concisely at the end.
              4. Follow EXACTLY the section structure and formatting requirements.
              5. Use plain text formatting only. NO MARKDOWN.
              6. The document should be a cohesive IMPD.
              Output only the generated document content.
              `
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

  // New specific document generators:

  generateBLA: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with 25+ years of experience preparing Biologics License Applications (BLAs) for FDA submission.
            Your task is to generate a comprehensive BLA SUMMARY document, analogous to an NDA summary but with a focus on biologics-specific considerations. This document should highlight key information from CTD Modules 2 and 5.
            The document must be in clean, plain text format—NO markdown.

            KEY BLA-SPECIFIC CONSIDERATIONS:
            - Manufacturing process for biologics (cell lines, fermentation/culture, purification).
            - Characterization of the biologic (structure, purity, potency, heterogeneity, immunogenicity).
            - Comparability assessments (if manufacturing changes occurred).
            - Stability of the biologic.
            - Adventitious agent safety.
            - Immunogenicity assessment and impact.

            STRUCTURE (similar to NDA summary, with biologics emphasis):
            1. ADMINISTRATIVE INFORMATION AND PRESCRIBING INFORMATION SUMMARY
               1.1. Application Summary (Product name, indication, applicant)
               1.2. Proposed Labeling Highlights (Key sections of Prescribing Information, emphasizing biologics aspects like immunogenicity warnings)
            2. OVERALL SUMMARY OF QUALITY (CTD Module 2.3 - BIOLOGICS FOCUS)
               2.1. Introduction to Quality of the Biologic
               2.2. Drug Substance (Active Biological Substance) Summary (Manufacture, Characterization, Control, Stability, Comparability)
               2.3. Drug Product (Finished Biological Product) Summary (Description, Formulation, Manufacture, Control, Stability, Container Closure, Delivery Device if applicable)
            3. NONCLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.4 & 2.6)
               3.1. Nonclinical Overview
               3.2. Pharmacology Summary (Primary, Secondary, Safety Pharmacology)
               3.3. Pharmacokinetics Summary (Nonclinical - ADME, immunogenicity)
               3.4. Toxicology Summary (including immunotoxicology)
            4. CLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.5 & 2.7)
               4.1. Clinical Overview (Product Development Rationale, Clinical Pharmacology - PK/PD, Immunogenicity)
               4.2. Summary of Clinical Efficacy (Pivotal studies, study designs, populations, primary/secondary endpoints, key results with statistical significance, subgroup analyses)
               4.3. Summary of Clinical Safety (Exposure, AEs, SAEs, immunogenicity-related events, infusion reactions, overall safety assessment)
               4.4. Benefits and Risks Conclusions
            5. KEY CLINICAL STUDY REPORT SUMMARIES (Brief highlights from pivotal Phase 3 trials)
            
            Use ALL CAPS for main section headings. Use Title Case for subsections. Provide clean plain text.
            Focus on ${diseaseData.disease_name} and drug class ${diseaseData.additional_parameters.drug_class || 'Biologic'}.
            Reference the Public Health Service Act where relevant for biologics.
            Your response MUST be a single, coherent document.
            `
          },
          {
            role: "user",
            content: `Generate a comprehensive BLA SUMMARY document for a biologic treatment for ${diseaseData.disease_name}.
            Drug Class: ${diseaseData.additional_parameters.drug_class || 'Monoclonal Antibody'}
            Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Targets specific inflammatory pathway'}
            Country for Submission: USA (BLA for FDA)
            Document Type: ${diseaseData.additional_parameters.document_type || 'BLA Summary'}
            Key Clinical Trial Data Summary: ${diseaseData.additional_parameters.clinical_info || 'Pivotal Phase 3 trials demonstrated significant efficacy and a manageable safety profile, including immunogenicity assessment.'}

            REQUIREMENTS:
            1. This BLA SUMMARY must be DETAILED and meet FDA expectations for a biologic, focusing on Module 2 content.
            2. Emphasize biologics-specific aspects (manufacturing, characterization, immunogenicity, comparability).
            3. Follow the specified section structure and formatting requirements.
            4. Include specific (illustrative) numerical data for efficacy, safety, and immunogenicity.
            5. Use plain text formatting only. NO MARKDOWN.
            Output only the generated document content.
            `
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

  generateCTN_JP: async (diseaseData) => { // Clinical Trial Notification - Japan
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Japanese Clinical Trial Notifications (CTNs) for submission to the PMDA.
            Your task is to generate KEY SECTIONS of a Japanese CTN. This is a notification, not a full application dossier like an IND.
            The document must be in clean, plain text format—NO markdown.

            KEY SECTIONS FOR A JAPANESE CTN SUMMARY:
            1.  NOTIFICATION OVERVIEW
                1.1. Trial Title (Japanese and English if available)
                1.2. Investigational Product Name / Code
                1.3. Sponsor Information
                1.4. Phase of Trial
                1.5. Planned Number of Sites and Subjects in Japan
            2.  INVESTIGATIONAL PRODUCT INFORMATION SUMMARY
                2.1. Brief Description (Type, class, proposed indication: ${diseaseData.disease_name})
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

            Use ALL CAPS for main section headings. Use Title Case for subsections. Provide clean plain text.
            Focus on concise information required for a notification.
            Your response MUST be a single, coherent document.
            `
          },
          {
            role: "user",
            content: `Generate key sections for a Japanese Clinical Trial Notification (CTN) for a trial on ${diseaseData.disease_name}.
            Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
            Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
            Trial Phase: ${diseaseData.additional_parameters.clinical_info || 'Phase II'}
            Country for Submission: Japan
            Document Type: ${diseaseData.additional_parameters.document_type || 'CTN (Japan) Summary'}

            REQUIREMENTS:
            1. Generate concise yet informative content for the key CTN sections.
            2. Reflect requirements for a Japanese PMDA submission.
            3. Follow the specified section structure and formatting.
            4. Use plain text formatting only. NO MARKDOWN.
            Output only the generated document content.
            `
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

  generateJNDA: async (diseaseData) => { // Japanese New Drug Application
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing Japanese New Drug Applications (J-NDAs) for submission to the PMDA/MHLW.
            Your task is to generate a J-NDA SUMMARY document. This should highlight key information structured similarly to the CTD, but with consideration for Japanese regulatory expectations (e.g., data from Japanese patients if available, bridging studies).
            The document must be in clean, plain text format—NO markdown.

            STRUCTURE (CTD-based, with J-NDA considerations):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED PACKAGE INSERT SUMMARY (Japanese 'Tensu-Bunsho')
               1.1. Application Summary
               1.2. Proposed Package Insert Highlights (Key sections, warnings specific to Japanese population if relevant)
            2. GAIYOU (OVERALL SUMMARY OF QUALITY - CTD Module 2.3)
               2.1. Introduction to Quality
               2.2. Drug Substance Summary
               2.3. Drug Product Summary
            3. NONCLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.4 & 2.6)
               3.1. Nonclinical Overview
               3.2. Pharmacology, PK, Toxicology Summaries
            4. CLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.5 & 2.7 - EMPHASIZE JAPANESE DATA)
               4.1. Clinical Overview (Rationale, Clinical Pharmacology - including data in Japanese subjects, bridging strategy if applicable)
               4.2. Summary of Clinical Efficacy (Pivotal studies, emphasis on results in Japanese population or bridging evidence)
               4.3. Summary of Clinical Safety (Exposure in Japanese patients, AEs, specific safety concerns for Japanese population)
               4.4. Benefits and Risks Conclusions (in context of Japanese medical practice)
            5. KEY JAPANESE CLINICAL STUDY REPORT SUMMARIES (or pivotal global studies with Japanese patient data)

            Use ALL CAPS for main headings. Use Title Case for subsections. Provide clean plain text.
            Focus on ${diseaseData.disease_name} and drug class ${diseaseData.additional_parameters.drug_class || 'N/A'}.
            Reference Japanese regulatory guidelines or practices where appropriate.
            Your response MUST be a single, coherent document.
            `
          },
          {
            role: "user",
            content: `Generate a comprehensive J-NDA SUMMARY document for ${diseaseData.disease_name}.
            Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
            Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
            Country for Submission: Japan (J-NDA for PMDA/MHLW)
            Document Type: ${diseaseData.additional_parameters.document_type || 'J-NDA Summary'}
            Key Clinical Trial Data: ${diseaseData.additional_parameters.clinical_info || 'Global Phase 3 trials included Japanese patients and showed consistent efficacy and safety. Specific bridging study conducted.'}

            REQUIREMENTS:
            1. This J-NDA SUMMARY must be DETAILED and meet PMDA expectations.
            2. Emphasize data relevant to the Japanese population and any bridging strategies.
            3. Follow the specified section structure and formatting.
            4. Use plain text formatting only. NO MARKDOWN.
            Output only the generated document content.
            `
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
  
  // This will generate key sections for a Chinese IND, distinct from the US IND module structure.
  generateIND_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Chinese Investigational New Drug (IND) applications for submission to the NMPA.
            Your task is to generate KEY SECTIONS of a Chinese IND application. The structure may differ from US INDs, focusing on specific NMPA requirements.
            The document must be in clean, plain text format—NO markdown.

            KEY SECTIONS FOR A CHINESE IND SUMMARY (Illustrative, adapt based on NMPA guidelines):
            1.  APPLICATION OVERVIEW
                1.1. Drug Name (Chinese and English if available), Dosage Form, Strength
                1.2. Applicant Information
                1.3. Proposed Indication: ${diseaseData.disease_name}
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
            5.  ETHICS COMMITTEE APPROVAL STATUS (Statement or placeholder)
            
            Use ALL CAPS for main section headings. Use Title Case for subsections. Provide clean plain text.
            Focus on concise information required for an NMPA IND.
            Your response MUST be a single, coherent document.
            `
          },
          {
            role: "user",
            content: `Generate key sections for a Chinese IND application for a trial on ${diseaseData.disease_name}.
            Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
            Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
            Trial Phase: ${diseaseData.additional_parameters.clinical_info || 'Phase I/II'}
            Country for Submission: China (for NMPA)
            Document Type: ${diseaseData.additional_parameters.document_type || 'IND (China) Summary'}

            REQUIREMENTS:
            1. Generate content for key Chinese IND sections, reflecting NMPA expectations.
            2. Highlight any aspects relevant to the Chinese context (e.g., local data, specific guidelines).
            3. Follow the specified section structure and formatting.
            4. Use plain text formatting only. NO MARKDOWN.
            Output only the generated document content.
            `
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

  generateNDA_CH: async (diseaseData) => {
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with extensive experience in preparing Chinese New Drug Applications (NDAs) for submission to the NMPA.
            Your task is to generate a Chinese NDA SUMMARY document. This should be structured according to NMPA expectations, which may draw from CTD principles but have local nuances.
            The document must be in clean, plain text format—NO markdown.

            STRUCTURE (CTD-based, with NMPA considerations):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED DRUG INSERT SUMMARY
               1.1. Application Overview
               1.2. Proposed Drug Insert Highlights (Key sections, reflecting Chinese labeling requirements)
            2. QUALITY INFORMATION SUMMARY (CMC)
               2.1. Drug Substance Summary (Local manufacturing/testing considerations if applicable)
               2.2. Drug Product Summary (Local manufacturing/testing considerations if applicable)
            3. NONCLINICAL STUDY SUMMARY
               3.1. Pharmacology, PK, Toxicology Summaries (Highlighting data relevant/acceptable to NMPA)
            4. CLINICAL STUDY SUMMARY (EMPHASIZE DATA IN CHINESE PATIENTS)
               4.1. Clinical Overview (Rationale, Clinical Pharmacology - including data in Chinese subjects, ethnic sensitivity analysis)
               4.2. Summary of Clinical Efficacy (Pivotal studies, emphasis on results in Chinese population or bridging evidence. Consistency with foreign data.)
               4.3. Summary of Clinical Safety (Exposure in Chinese patients, AEs, specific safety concerns for Chinese population. Comparison with foreign data.)
               4.4. Benefit-Risk Assessment (in context of Chinese medical practice and approved alternatives)
            5. KEY CLINICAL TRIAL SUMMARIES (Trials conducted in China, or pivotal global trials with significant Chinese cohort)

            Use ALL CAPS for main headings. Use Title Case for subsections. Provide clean plain text.
            Focus on ${diseaseData.disease_name} and drug class ${diseaseData.additional_parameters.drug_class || 'N/A'}.
            Reference Chinese regulatory guidelines or practices where appropriate.
            Your response MUST be a single, coherent document.
            `
          },
          {
            role: "user",
            content: `Generate a comprehensive Chinese NDA SUMMARY document for ${diseaseData.disease_name}.
            Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
            Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
            Country for Submission: China (NDA for NMPA)
            Document Type: ${diseaseData.additional_parameters.document_type || 'NDA (China) Summary'}
            Key Clinical Trial Data: ${diseaseData.additional_parameters.clinical_info || 'Global Phase 3 trials included a substantial cohort of Chinese patients and showed positive results. Local Phase 3 trial also conducted.'}

            REQUIREMENTS:
            1. This Chinese NDA SUMMARY must be DETAILED and meet NMPA expectations.
            2. Emphasize data from Chinese patients and alignment with NMPA guidelines.
            3. Follow the specified section structure and formatting.
            4. Use plain text formatting only. NO MARKDOWN.
            Output only the generated document content.
            `
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

  generateCTN_AU: async (diseaseData) => { // Clinical Trial Notification - Australia
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a regulatory affairs expert specializing in Australian Clinical Trial Notifications (CTN) for submission to the TGA.
            Your task is to generate KEY SECTIONS of an Australian CTN. This is a notification scheme, primarily requiring ethics approval and notification to TGA.
            The document must be in clean, plain text format—NO markdown.

            KEY SECTIONS FOR AN AUSTRALIAN CTN SUMMARY (for internal documentation/summary, as actual submission is form-based):
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
                3.1. Brief Description (Type, class, proposed indication: ${diseaseData.disease_name})
                3.2. Manufacturing and Supply (GMP compliance, importation details if applicable)
            4.  ETHICS COMMITTEE (HREC) INFORMATION
                4.1. Name of Approving HREC
                4.2. Date of HREC Approval
            5.  PRINCIPAL INVESTIGATOR(S) AND SITE(S) (Illustrative list of Australian sites)
            
            Use ALL CAPS for main section headings. Use Title Case for subsections. Provide clean plain text.
            Focus on concise information required for notification and HREC oversight.
            Your response MUST be a single, coherent document.
            `
          },
          {
            role: "user",
            content: `Generate key sections for an Australian Clinical Trial Notification (CTN) summary for a trial on ${diseaseData.disease_name}.
            Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
            Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
            Trial Phase: ${diseaseData.additional_parameters.clinical_info || 'Phase III'}
            Country for Submission: Australia (for TGA)
            Document Type: ${diseaseData.additional_parameters.document_type || 'CTN (Australia) Summary'}

            REQUIREMENTS:
            1. Generate concise content for key Australian CTN informational sections.
            2. Reflect TGA's CTN scheme requirements (notification post-HREC approval).
            3. Follow the specified section structure and formatting.
            4. Use plain text formatting only. NO MARKDOWN.
            Output only the generated document content.
            `
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

  generateAUS: async (diseaseData) => { // Australian Submission for ARTG
    try {
      const response = await openaiApi.post('chat/completions', {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a senior regulatory affairs expert with experience in preparing submissions for registration on the Australian Register of Therapeutic Goods (ARTG) with the TGA.
            Your task is to generate an AUSTRALIAN SUBMISSION SUMMARY document. This should highlight key information, structured similarly to the CTD, for a TGA evaluation.
            The document must be in clean, plain text format—NO markdown.

            STRUCTURE (CTD-based, with TGA considerations):
            1. ADMINISTRATIVE INFORMATION AND PROPOSED PRODUCT INFORMATION (PI) SUMMARY
               1.1. Application Overview (Product name, indication, sponsor)
               1.2. Proposed Product Information (PI) Highlights (Key sections, warnings, consistent with Australian PI format)
            2. QUALITY OVERALL SUMMARY (CTD Module 2.3)
               2.1. Introduction to Quality
               2.2. Drug Substance Summary
               2.3. Drug Product Summary (Including Australian-specific packaging/labeling if relevant)
            3. NONCLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.4 & 2.6)
               3.1. Nonclinical Overview
               3.2. Pharmacology, PK, Toxicology Summaries
            4. CLINICAL OVERVIEW AND SUMMARY (CTD Modules 2.5 & 2.7 - EMPHASIZE RELEVANCE TO AUSTRALIAN POPULATION)
               4.1. Clinical Overview (Rationale, Clinical Pharmacology - including any data relevant to Australian population or bridging)
               4.2. Summary of Clinical Efficacy (Pivotal studies, applicability of data to Australian context)
               4.3. Summary of Clinical Safety (Exposure, AEs, safety in Australian patients if data available, Risk Management Plan summary)
               4.4. Benefits and Risks Conclusions (for Australian context)
            5. KEY CLINICAL STUDY REPORT SUMMARIES (Pivotal trials supporting the submission)

            Use ALL CAPS for main headings. Use Title Case for subsections. Provide clean plain text.
            Focus on ${diseaseData.disease_name} and drug class ${diseaseData.additional_parameters.drug_class || 'N/A'}.
            Reference TGA guidelines or practices where appropriate.
            Your response MUST be a single, coherent document.
            `
          },
          {
            role: "user",
            content: `Generate a comprehensive AUSTRALIAN SUBMISSION SUMMARY document for ${diseaseData.disease_name}, for TGA evaluation and ARTG registration.
            Drug Class: ${diseaseData.additional_parameters.drug_class || 'Not specified'}
            Mechanism of Action: ${diseaseData.additional_parameters.mechanism || 'Not specified'}
            Country for Submission: Australia (for TGA ARTG registration)
            Document Type: ${diseaseData.additional_parameters.document_type || 'AUS Summary for TGA'}
            Key Clinical Trial Data: ${diseaseData.additional_parameters.clinical_info || 'Global Phase 3 trials demonstrated efficacy and safety, with data considered applicable to the Australian population.'}

            REQUIREMENTS:
            1. This Australian Submission Summary must be DETAILED and meet TGA expectations for an ARTG application dossier summary.
            2. Emphasize data applicability to the Australian population and PI consistency.
            3. Follow the specified section structure and formatting.
            4. Use plain text formatting only. NO MARKDOWN.
            Output only the generated document content.
            `
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
            - "IRRELEVANT" if the question is about cooking, weather, entertainment, sports, travel, technology, politics, or other non-medical topics

            Examples:
            - "What are efficacy endpoints for psoriasis?" → RELEVANT
            - "Key endpoints for banana bread?" → IRRELEVANT  
            - "How to design inclusion criteria?" → RELEVANT
            - "What's the weather today?" → IRRELEVANT`
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
            - Cite relevant guidelines (ICH, FDA, EMA) when appropriate
            
            EXAMPLE FORMAT (NO ASTERISKS):
            KEY EFFICACY ENDPOINTS FOR PSORIASIS TRIALS:
            
            PRIMARY ENDPOINTS:
                1. PASI 75 Response Rate at Week 16
                   - Definition: Proportion achieving 75% reduction in PASI score
                   - Relevance: Standard regulatory endpoint
            
            SECONDARY ENDPOINTS:
                1. Static Physician Global Assessment (sPGA)
                   - Clear (0) or Almost Clear (1) skin
                   - Physician assessment of overall improvement`
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
