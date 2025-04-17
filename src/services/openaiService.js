import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

const openaiService = {
  generateProtocol: async (diseaseData) => {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
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
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        protocol_id: `prot-${Date.now()}`,
        protocol: response.data.choices[0].message.content
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  },
  
  generateIndModule: async (diseaseData) => {
    try {
      // Make sure we have consistent section headers in both prompt and parsing
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a Principal Investigator and Clinical Trial Design Expert with 25+ years of experience in pharmaceutical development.
              Your task is to generate a comprehensive, regulatory-compliant MAIN DOCUMENT with detailed study design that meets professional industry standards.
              
              STRICT FORMATTING REQUIREMENTS:
              - Format according to ICH E6(R2) Good Clinical Practice and FDA/EMA guidelines
              - The document MUST be structured EXACTLY into these sections with this numbering:
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
              
              GUIDANCE FOR IN-DEPTH STUDY DESIGN CONTENT:
              
              CMC SECTION: (Chemistry, Manufacturing, and Controls)
              Start with a detailed CMC section that includes:
              
              1. Drug Substance Description:
                 - Chemical structure and properties
                 - Synthesis route summary
                 - Impurity profile
                 - Reference standards
              
              2. Drug Product Description:
                 - Formulation composition with exact quantities
                 - Dosage form specifications
                 - Excipient justification
                 - Manufacturing process overview
              
              3. Analytical Methods:
                 - Assay methodology with validation parameters
                 - Dissolution testing approach
                 - Impurity analysis methods
                 - Physical property testing
              
              4. Stability Data:
                 - Long-term stability conditions and results
                 - Accelerated stability data
                 - In-use stability for applicable products
                 - Photostability findings
              
              5. Container Closure System:
                 - Primary packaging specifications
                 - Secondary packaging specifications
                 - Compatibility studies
                 - Integrity testing results
              
              CLINICAL SECTION:
              For each of the numbered sections, include the following level of detail:
              
              1. INTRO / BACKGROUND:
                 - Comprehensive disease overview with epidemiology
                 - Detailed pathophysiology
                 - Current treatment landscape analysis
                 - Investigational product development history
                 - Preclinical data summary (pharmacology, toxicology)
                 - Previous clinical experience summary
                 - Scientific rationale for current development
              
              2. OBJECTIVES / HYPOTHESES / ENDPOINTS:
                 - Primary objective with specific hypothesis
                 - Secondary objectives with hypotheses
                 - Exploratory objectives
                 - Detailed endpoint definitions with assessment methodologies
                 - Endpoint justification with references to regulatory precedent
                 - Timing of assessments with specific study days/weeks
                 - Clinically meaningful differences defined
              
              3. STUDY DESIGN & SAMPLE SIZE:
                 - Detailed study design with schematic diagram description
                 - Treatment arms with exact dosing regimens
                 - Study duration with specific periods defined
                 - Randomization method and ratio
                 - Blinding approach and maintenance
                 - Sample size calculation with detailed assumptions
                 - Power calculations for primary and key secondary endpoints
                 - Dropout rate assumptions with justification
              
              4. POPULATIONS & BASELINE:
                 - Detailed inclusion criteria (10-15 specific criteria)
                 - Detailed exclusion criteria (15-20 specific criteria)
                 - Screening procedures with timing
                 - Baseline assessments and timing
                 - Definition of analysis populations (ITT, PP, Safety)
                 - Demographic requirements
                 - Permitted/prohibited medications with specifics
                 - Withdrawal criteria and processes
              
              5. STATISTICAL METHODS & DATA HANDLING:
                 - Statistical analysis plan overview
                 - Analysis populations defined
                 - Handling of missing data with specific approach
                 - Multiplicity adjustment methods
                 - Subgroup analyses planned
                 - Sensitivity analyses
                 - Interim analyses with stopping rules
                 - Data monitoring committee structure
                 - Statistical software to be used
              
              6. EFFICACY ANALYSIS:
                 - Primary efficacy analysis methodology
                 - Secondary efficacy analyses
                 - Exploratory efficacy evaluations
                 - Statistical models specified with formulas
                 - Covariates to be included
                 - Handling of multicenter effects
                 - Subgroup analyses for efficacy
                 - Multiple comparisons approach
              
              7. SAFETY ANALYSIS:
                 - Adverse event collection and reporting
                 - Coding dictionaries (MedDRA version)
                 - Laboratory parameter evaluation method
                 - Vital signs analysis approach
                 - ECG analysis methods
                 - Physical examination reporting
                 - Special safety assessments
                 - Safety monitoring procedures
                 - Independent safety monitoring committee details
              
              8. PHARMACOKINETIC / EXPLORATORY:
                 - PK sampling schedule with timepoints
                 - PK parameters to be calculated
                 - Population PK analysis plan
                 - PK/PD relationships to be explored
                 - Biomarker analyses planned
                 - Exploratory endpoint analyses
                 - Pharmacogenomic assessments if applicable
                 - Special population analyses
              
              9. INTERIM & OTHER SPECIAL ANALYSES:
                 - Interim analysis timing and purpose
                 - Stopping rules with specific boundaries
                 - Alpha spending function specified
                 - DMC composition and charter reference
                 - Special analyses for regulatory purposes
                 - Post-hoc analyses considerations
                 - Adaptive design elements if applicable
                 - Risk-based monitoring approach
              
              10. REFERENCES & APPENDICES:
                  - Comprehensive literature citations
                  - Study procedures flow chart
                  - Schedule of assessments table
                  - Laboratory parameter ranges
                  - Case report form descriptions
                  - Informed consent process
                  - Ethical considerations
                  - Good Clinical Practice statement
              
              Include relevant numerical values where appropriate including but not limited to:
              - Exact dosing amounts (e.g., 100 mg BID)
              - Treatment durations (e.g., 52 weeks)
              - Visit windows (e.g., ±3 days)
              - Laboratory parameter ranges (e.g., ALT ≤ 2.5 × ULN)
              - Statistical thresholds (e.g., two-sided alpha of 0.05)
              
              Reference relevant industry guidance documents and precedent protocols whenever possible.
              
              Use established methodologies and frameworks appropriate to the therapeutic area:
              - Oncology: RECIST criteria, CTCAE for AE grading
              - Neurology: EDSS, UPDRS, or other validated scales
              - Psychiatry: PANSS, HAM-D, or similar validated instruments
              - Rheumatology: ACR, EULAR response criteria
              - Diabetes: HbA1c goals based on ADA guidelines
              - Cardiovascular: MACE endpoints as defined in similar CVOTs
              - Dermatology: PASI, IGA, EASI scores
              - Respiratory: FEV1, ACQ, AQLQ
              
              Consider the full range of cases from common to outlier conditions, and simplify complex concepts while maintaining technical accuracy. Use templates from similar clinical trials as a reference.
              
              Your response MUST ALSO contain these two clearly marked sections: "CMC SECTION:" and "CLINICAL SECTION:"
              Place these section headers on separate lines before and after the 10 numbered sections.`  
            },
            {
              role: "user",
              content: `Generate a comprehensive, regulation-compliant MAIN DOCUMENT for a Phase 2 Clinical Trial for ${diseaseData.disease_name} with the following format:

              First include a "CMC SECTION:" containing Chemistry, Manufacturing, and Controls information including:
                - Detailed drug substance specifications with specific parameters
                - Comprehensive manufacturing process with critical control points
                - Validated analytical methods with acceptance criteria
                - Stability data with storage conditions and shelf-life
                ${diseaseData.additional_parameters.drug_class ? `- Detailed information on the ${diseaseData.additional_parameters.drug_class} classification including pharmacological properties` : ''}
                - Quality control procedures with specifications
              
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
              1. This document must be EXTREMELY DETAILED and meet professional industry standards
              2. Include comprehensive information in each section with specific numerical values
              3. Do NOT use markdown formatting such as ## for headers or ** for emphasis
              4. Do NOT use bullet points with * or - characters; use standard numbers or letters instead
              5. Use ONLY plain text with proper indentation and spacing
              6. No special characters or markdown syntax whatsoever
              7. Include specific numerical values and concrete details for:
                 - Dosing regimens (specific amounts, frequencies, routes)
                 - Visit schedules (specific week numbers)
                 - Assessment timepoints
                 - Inclusion/exclusion criteria (with numerical parameters)
                 - Statistical thresholds and power calculations

              Include these specific elements in the appropriate sections:
                - ${diseaseData.additional_parameters.population ? `Detailed population information for: ${diseaseData.additional_parameters.population}, including specific inclusion/exclusion criteria with numerical parameters` : 'Comprehensive patient eligibility criteria with specific parameters'}
                - ${diseaseData.additional_parameters.treatment_duration ? `Detailed treatment plan for duration: ${diseaseData.additional_parameters.treatment_duration}, including specific visit schedule and assessment timepoints` : 'Comprehensive treatment schedule with specific timepoints'}
                - ${diseaseData.additional_parameters.mechanism ? `Detailed mechanism of action: ${diseaseData.additional_parameters.mechanism}, including pharmacodynamic parameters and biomarkers` : ''}
                - ${diseaseData.additional_parameters.clinical_info ? `Relevant clinical information: ${diseaseData.additional_parameters.clinical_info}, integrated throughout the appropriate sections` : ''}
                
              This MAIN DOCUMENT must meet professional pharmaceutical industry standards for regulatory submission. Follow the structure EXACTLY as specified and include disease-specific endpoints and assessments appropriate for ${diseaseData.disease_name}.
              
              IMPORTANT: Reference previous established protocols in this therapeutic area and include specific numerical parameters at every opportunity.`  
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const fullResponse = response.data.choices[0].message.content;
      console.log("Full response from OpenAI:", fullResponse);

      // Extract sections - use a more robust approach
      let cmcSection = '';
      let clinicalSection = '';
      
      // Look for the exact section headers
      const cmcMatch = fullResponse.match(/CMC SECTION:([\s\S]*?)(?=CLINICAL SECTION:|$)/i);
      const clinicalMatch = fullResponse.match(/CLINICAL SECTION:([\s\S]*?)$/i);
      
      if (cmcMatch && cmcMatch[1]) {
        cmcSection = cmcMatch[1].trim();
      }
      
      if (clinicalMatch && clinicalMatch[1]) {
        clinicalSection = clinicalMatch[1].trim();
      }
      
      console.log("Extracted CMC section length:", cmcSection.length);
      console.log("Extracted Clinical section length:", clinicalSection.length);

      // Fallback if sections aren't found
      if (!cmcSection && !clinicalSection) {
        // If no sections were found, try the old method
        const sections = fullResponse.split(/CLINICAL SECTION:/i);
        cmcSection = sections[0].replace(/CMC SECTION:/i, '').trim();
        clinicalSection = sections.length > 1 ? sections[1].trim() : '';
        console.log("Used fallback parsing method");
      }

      // If clinical section is still empty, try to locate any content that looks like clinical info
      if (!clinicalSection && fullResponse.toLowerCase().includes("clinical")) {
        const clinicalContent = fullResponse.substring(
          fullResponse.toLowerCase().indexOf("clinical")
        );
        clinicalSection = clinicalContent.trim();
        console.log("Used backup clinical content extraction");
      }

      return {
        cmc_section: cmcSection || "CMC section could not be extracted properly.",
        clinical_section: clinicalSection || "Clinical section could not be extracted properly."
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  },

  queryAssistant: async (queryData) => {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a clinical protocol and regulatory expert providing precise, well-structured, and professionally formatted answers.
              Your expertise spans all aspects of clinical trial design, regulatory submissions, and pharmaceutical development.
              
              IMPORTANT RULES:
              - Respond ONLY in plain text with NO markdown symbols.
              - Use ALL CAPS sparingly for emphasis (e.g., section titles).
              - Structure responses with indentation and clear paragraphing.
              - Avoid unnecessary filler text—be precise and professional.
              - Include specific numerical values and concrete examples whenever possible.
              - Reference relevant regulatory guidelines, precedent protocols, or methodological frameworks.
              - Provide detailed, technically accurate information while keeping explanations accessible.
              - For complex topics, include examples from approved protocols or regulatory precedents.
              - Consider both standard and edge cases in your responses.
              - When discussing clinical endpoints or assessments, reference validated instruments appropriate to the therapeutic area.`  
            },
            {
              role: "user",
              content: `${queryData.disease_context 
                ? `Regarding ${queryData.disease_context}: ${queryData.question}`
                : queryData.question}
              
              Please provide a detailed, comprehensive response that includes specific examples, numerical parameters, and references to regulatory precedents where applicable. Ensure the response is clear, structured, and well-formatted without any markdown symbols.`  
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        answer: response.data.choices[0].message.content
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
};

export default openaiService;