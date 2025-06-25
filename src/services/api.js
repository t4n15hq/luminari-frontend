// src/services/api.js - UPDATED WITH COMPLETE ROUTING FOR ALL DOCUMENTS

import openaiService from './openaiService';
import dossierService from './dossierService';
import axios from 'axios';

// Backend prediction endpoints
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://luminari-uic-skin-disease-detection.hf.space';
const LUNG_CANCER_API_URL = process.env.REACT_APP_LUNG_CANCER_API_URL || 'https://lung-cancer-backend-n84h.onrender.com';

// In-memory protocol storage for listProtocols
const protocolHistory = [];

const apiService = {
  // Existing methods
  generateProtocol: async (diseaseData) => {
    try {
      const result = await openaiService.generateProtocol(diseaseData);
      protocolHistory.push({
        protocol_id: result.protocol_id,
        disease_name: diseaseData.disease_name,
        generation_date: new Date().toISOString(),
        protocol_type: "Phase 2"
      });
      return result;
    } catch (error) {
      console.error('Error generating protocol:', error);
      throw error;
    }
  },

  // ENHANCED COMPREHENSIVE ROUTING FOR ALL REGULATORY DOCUMENTS
  generateIndModule: async (data) => {
    try {
      const documentTypeName = data.additional_parameters?.document_type || "IND (Investigational New Drug)";
      const country = data.additional_parameters?.country;
      const lowerDocName = documentTypeName.toLowerCase();

      console.log(`Routing document generation for: "${documentTypeName}", Country: "${country}"`);

      // =============================================================================
      // UNITED STATES DOCUMENTS
      // =============================================================================
      if (documentTypeName === "IND (Investigational New Drug)" || 
          (lowerDocName.includes("ind") && (!country || country.toLowerCase() === 'united states' || country.toLowerCase() === 'usa'))) {
        console.log('Calling openaiService.generateIndModule for US IND');
        return await openaiService.generateIndModule(data);
      }
      
      if (documentTypeName === "NDA (New Drug Application)" || 
          (lowerDocName.includes("nda") && (!country || country.toLowerCase() === 'united states' || country.toLowerCase() === 'usa'))) {
        console.log('Calling openaiService.generateNDA for US NDA');
        return await openaiService.generateNDA(data);
      }
      
      if (documentTypeName === "BLA (Biologics License Application)") {
        console.log('Calling openaiService.generateBLA');
        return await openaiService.generateBLA(data);
      }

      // =============================================================================
      // CANADA DOCUMENTS
      // =============================================================================
      if (documentTypeName === "Clinical Trial Application (Health Canada)" || 
          (lowerDocName.includes("cta") && country?.toLowerCase() === 'canada')) {
        console.log('Calling openaiService.generateCTA_CA');
        return await openaiService.generateCTA_CA(data);
      }
      
      if (documentTypeName === "New Drug Submission (NDS)") {
        console.log('Calling openaiService.generateNDS');
        return await openaiService.generateNDS(data);
      }
      
      if (documentTypeName === "Notice of Compliance (NOC)") {
        console.log('Calling openaiService.generateNOC');
        return await openaiService.generateNOC(data);
      }

      // =============================================================================
      // MEXICO DOCUMENTS
      // =============================================================================
      if (documentTypeName === "COFEPRIS Clinical Trial Authorization") {
        console.log('Calling openaiService.generateCOFEPRIS_CTA');
        return await openaiService.generateCOFEPRIS_CTA(data);
      }
      
      if (documentTypeName === "COFEPRIS New Drug Registration") {
        console.log('Calling openaiService.generateCOFEPRIS_NDA');
        return await openaiService.generateCOFEPRIS_NDA(data);
      }

      // =============================================================================
      // EUROPEAN UNION DOCUMENTS
      // =============================================================================
      if (documentTypeName === "CTA (Clinical Trial Application)" || 
          (lowerDocName.includes("cta") && (country?.toLowerCase() === 'european union' || country?.toLowerCase() === 'eu'))) {
        console.log('Calling openaiService.generateCTA for EU');
        return await openaiService.generateCTA(data);
      }
      
      if (documentTypeName === "MAA (Marketing Authorization Application)") {
        console.log('Calling openaiService.generateMAA');
        return await openaiService.generateMAA(data);
      }
      
      if (documentTypeName === "IMPD (Investigational Medicinal Product Dossier)") {
        console.log('Calling openaiService.generateIMPD');
        return await openaiService.generateIMPD(data);
      }

      // =============================================================================
      // UNITED KINGDOM DOCUMENTS
      // =============================================================================
      if (documentTypeName === "Clinical Trial Authorisation (UK)" || 
          (lowerDocName.includes("cta") && country?.toLowerCase() === 'united kingdom')) {
        console.log('Calling openaiService.generateCTA_UK');
        return await openaiService.generateCTA_UK(data);
      }
      
      if (documentTypeName === "Marketing Authorisation (UK)") {
        console.log('Calling openaiService.generateMA_UK');
        return await openaiService.generateMA_UK(data);
      }
      
      if (documentTypeName === "Voluntary Scheme for Branded Medicines Pricing") {
        console.log('Calling openaiService.generateVIE');
        return await openaiService.generateVIE(data);
      }

      // =============================================================================
      // SWITZERLAND DOCUMENTS
      // =============================================================================
      if (documentTypeName === "Clinical Trial Authorisation (Swissmedic)" || 
          (lowerDocName.includes("cta") && country?.toLowerCase() === 'switzerland')) {
        console.log('Calling openaiService.generateCTA_CH');
        return await openaiService.generateCTA_CH(data);
      }
      
      if (documentTypeName === "Marketing Authorisation (Switzerland)") {
        console.log('Calling openaiService.generateMA_CH');
        return await openaiService.generateMA_CH(data);
      }

      // =============================================================================
      // RUSSIA DOCUMENTS
      // =============================================================================
      if (documentTypeName === "Clinical Trial Permit (Roszdravnadzor)" || 
          (lowerDocName.includes("cta") && country?.toLowerCase() === 'russia')) {
        console.log('Calling openaiService.generateCTA_RU');
        return await openaiService.generateCTA_RU(data);
      }
      
      if (documentTypeName === "Registration Dossier (Russia)") {
        console.log('Calling openaiService.generateRD_RU');
        return await openaiService.generateRD_RU(data);
      }
      
      if (documentTypeName === "Russian GMP Certificate") {
        console.log('Calling openaiService.generateGMP_RU');
        return await openaiService.generateGMP_RU(data);
      }

      // =============================================================================
      // JAPAN DOCUMENTS
      // =============================================================================
      if (documentTypeName === "Clinical Trial Notification (CTN)" && country?.toLowerCase() === 'japan') {
        console.log('Calling openaiService.generateCTN_JP');
        return await openaiService.generateCTN_JP(data);
      }
      
      if (documentTypeName === "J-NDA (New Drug Application)") {
        console.log('Calling openaiService.generateJNDA');
        return await openaiService.generateJNDA(data);
      }
      
      if (documentTypeName === "PMDA Scientific Advice") {
        console.log('Calling openaiService.generatePMDA_CONSULTATION');
        return await openaiService.generatePMDA_CONSULTATION(data);
      }

      // =============================================================================
      // CHINA DOCUMENTS
      // =============================================================================
      if (documentTypeName === "IND (China)" || 
          (lowerDocName.includes("ind") && country?.toLowerCase() === 'china')) {
        console.log('Calling openaiService.generateIND_CH');
        return await openaiService.generateIND_CH(data);
      }
      
      if (documentTypeName === "NDA (China)" || 
          (lowerDocName.includes("nda") && country?.toLowerCase() === 'china')) {
        console.log('Calling openaiService.generateNDA_CH');
        return await openaiService.generateNDA_CH(data);
      }
      
      if (documentTypeName === "Drug Registration Certificate") {
        console.log('Calling openaiService.generateDRUG_LICENSE_CH');
        return await openaiService.generateDRUG_LICENSE_CH(data);
      }

      // =============================================================================
      // SOUTH KOREA DOCUMENTS
      // =============================================================================
      if (documentTypeName === "IND (Korea)" || 
          (lowerDocName.includes("ind") && country?.toLowerCase() === 'south korea')) {
        console.log('Calling openaiService.generateIND_KR');
        return await openaiService.generateIND_KR(data);
      }
      
      if (documentTypeName === "NDA (Korea)" || 
          (lowerDocName.includes("nda") && country?.toLowerCase() === 'south korea')) {
        console.log('Calling openaiService.generateNDA_KR');
        return await openaiService.generateNDA_KR(data);
      }
      
      if (documentTypeName === "Korean GMP Certificate") {
        console.log('Calling openaiService.generateKGMP');
        return await openaiService.generateKGMP(data);
      }

      // =============================================================================
      // AUSTRALIA DOCUMENTS
      // =============================================================================
      if (documentTypeName === "CTN (Clinical Trial Notification)" && country?.toLowerCase() === 'australia') {
        console.log('Calling openaiService.generateCTN_AU');
        return await openaiService.generateCTN_AU(data);
      }
      
      if (documentTypeName === "AUS (Australian Submission)") {
        console.log('Calling openaiService.generateAUS');
        return await openaiService.generateAUS(data);
      }
      
      if (documentTypeName === "TGA GMP Certificate") {
        console.log('Calling openaiService.generateTGA_GMP');
        return await openaiService.generateTGA_GMP(data);
      }

      // =============================================================================
      // SINGAPORE DOCUMENTS
      // =============================================================================
      if (documentTypeName === "Clinical Trial Certificate (HSA)" || 
          (lowerDocName.includes("cta") && country?.toLowerCase() === 'singapore')) {
        console.log('Calling openaiService.generateCTA_SG');
        return await openaiService.generateCTA_SG(data);
      }
      
      if (documentTypeName === "Product License (Singapore)") {
        console.log('Calling openaiService.generatePRODUCT_LICENSE_SG');
        return await openaiService.generatePRODUCT_LICENSE_SG(data);
      }

      // =============================================================================
      // INDIA DOCUMENTS
      // =============================================================================
      if (documentTypeName === "Clinical Trial Permission (CDSCO)" || 
          (lowerDocName.includes("cta") && country?.toLowerCase() === 'india')) {
        console.log('Calling openaiService.generateCTA_IN');
        return await openaiService.generateCTA_IN(data);
      }
      
      if (documentTypeName === "New Drug Application (India)" || 
          (lowerDocName.includes("nda") && country?.toLowerCase() === 'india')) {
        console.log('Calling openaiService.generateNDA_IN');
        return await openaiService.generateNDA_IN(data);
      }
      
      if (documentTypeName === "Import License") {
        console.log('Calling openaiService.generateIMPORT_LICENSE_IN');
        return await openaiService.generateIMPORT_LICENSE_IN(data);
      }

      // =============================================================================
      // TAIWAN DOCUMENTS
      // =============================================================================
      if (documentTypeName === "IND (Taiwan)" || 
          (lowerDocName.includes("ind") && country?.toLowerCase() === 'taiwan')) {
        console.log('Calling openaiService.generateIND_TW');
        return await openaiService.generateIND_TW(data);
      }
      
      if (documentTypeName === "NDA (Taiwan)" || 
          (lowerDocName.includes("nda") && country?.toLowerCase() === 'taiwan')) {
        console.log('Calling openaiService.generateNDA_TW');
        return await openaiService.generateNDA_TW(data);
      }

      // =============================================================================
      // LATIN AMERICA DOCUMENTS
      // =============================================================================
      if (documentTypeName === "ANVISA Clinical Trial Authorization") {
        console.log('Calling openaiService.generateANVISA_CTA');
        return await openaiService.generateANVISA_CTA(data);
      }
      
      if (documentTypeName === "ANVISA Registration Dossier") {
        console.log('Calling openaiService.generateANVISA_NDA');
        return await openaiService.generateANVISA_NDA(data);
      }
      
      if (documentTypeName === "ANVISA GMP Certificate") {
        console.log('Calling openaiService.generateANVISA_GMP');
        return await openaiService.generateANVISA_GMP(data);
      }
      
      if (documentTypeName === "ANMAT Clinical Trial Authorization") {
        console.log('Calling openaiService.generateANMAT_CTA');
        return await openaiService.generateANMAT_CTA(data);
      }
      
      if (documentTypeName === "ANMAT Drug Registration") {
        console.log('Calling openaiService.generateANMAT_NDA');
        return await openaiService.generateANMAT_NDA(data);
      }

      // =============================================================================
      // AFRICA & MIDDLE EAST DOCUMENTS
      // =============================================================================
      if (documentTypeName === "SAHPRA Clinical Trial Authorization") {
        console.log('Calling openaiService.generateSAHPRA_CTA');
        return await openaiService.generateSAHPRA_CTA(data);
      }

      // =============================================================================
      // FALLBACK LOGIC FOR GENERIC NAMES
      // =============================================================================
      
      // Generic IND routing
      if (lowerDocName.includes("ind")) {
        if (country?.toLowerCase() === 'china') {
          console.log('Fallback: Calling openaiService.generateIND_CH for China IND');
          return await openaiService.generateIND_CH(data);
        } else if (country?.toLowerCase() === 'south korea') {
          console.log('Fallback: Calling openaiService.generateIND_KR for Korea IND');
          return await openaiService.generateIND_KR(data);
        } else if (country?.toLowerCase() === 'taiwan') {
          console.log('Fallback: Calling openaiService.generateIND_TW for Taiwan IND');
          return await openaiService.generateIND_TW(data);
        }
        console.log('Fallback: Calling openaiService.generateIndModule for generic IND');
        return await openaiService.generateIndModule(data); // Default to US IND structure
      }
      
      // Generic NDA routing
      if (lowerDocName.includes("nda")) {
        if (country?.toLowerCase() === 'china') {
          console.log('Fallback: Calling openaiService.generateNDA_CH for China NDA');
          return await openaiService.generateNDA_CH(data);
        } else if (country?.toLowerCase() === 'japan') {
          console.log('Fallback: Calling openaiService.generateJNDA for Japan NDA');
          return await openaiService.generateJNDA(data);
        } else if (country?.toLowerCase() === 'south korea') {
          console.log('Fallback: Calling openaiService.generateNDA_KR for Korea NDA');
          return await openaiService.generateNDA_KR(data);
        } else if (country?.toLowerCase() === 'taiwan') {
          console.log('Fallback: Calling openaiService.generateNDA_TW for Taiwan NDA');
          return await openaiService.generateNDA_TW(data);
        } else if (country?.toLowerCase() === 'india') {
          console.log('Fallback: Calling openaiService.generateNDA_IN for India NDA');
          return await openaiService.generateNDA_IN(data);
        }
        console.log('Fallback: Calling openaiService.generateNDA for generic NDA');
        return await openaiService.generateNDA(data); // Default to US NDA structure
      }
      
      // Generic CTA routing
      if (lowerDocName.includes("cta") || lowerDocName.includes("clinical trial")) {
        if (country?.toLowerCase() === 'canada') {
          console.log('Fallback: Calling openaiService.generateCTA_CA for Canada CTA');
          return await openaiService.generateCTA_CA(data);
        } else if (country?.toLowerCase() === 'united kingdom' || country?.toLowerCase() === 'uk') {
          console.log('Fallback: Calling openaiService.generateCTA_UK for UK CTA');
          return await openaiService.generateCTA_UK(data);
        } else if (country?.toLowerCase() === 'switzerland') {
          console.log('Fallback: Calling openaiService.generateCTA_CH for Switzerland CTA');
          return await openaiService.generateCTA_CH(data);
        } else if (country?.toLowerCase() === 'russia') {
          console.log('Fallback: Calling openaiService.generateCTA_RU for Russia CTA');
          return await openaiService.generateCTA_RU(data);
        } else if (country?.toLowerCase() === 'singapore') {
          console.log('Fallback: Calling openaiService.generateCTA_SG for Singapore CTA');
          return await openaiService.generateCTA_SG(data);
        } else if (country?.toLowerCase() === 'india') {
          console.log('Fallback: Calling openaiService.generateCTA_IN for India CTA');
          return await openaiService.generateCTA_IN(data);
        }
        console.log('Fallback: Calling openaiService.generateCTA for EU CTA');
        return await openaiService.generateCTA(data); // Default to EU CTA structure
      }

      // Generic CTN routing
      if (lowerDocName.includes("ctn") || lowerDocName.includes("notification")) {
        if (country?.toLowerCase() === 'japan') {
          console.log('Fallback: Calling openaiService.generateCTN_JP for Japan CTN');
          return await openaiService.generateCTN_JP(data);
        } else if (country?.toLowerCase() === 'australia') {
          console.log('Fallback: Calling openaiService.generateCTN_AU for Australia CTN');
          return await openaiService.generateCTN_AU(data);
        }
      }

      // Generic MAA routing
      if (lowerDocName.includes("maa") || lowerDocName.includes("marketing authorization") || lowerDocName.includes("marketing authorisation")) {
        if (country?.toLowerCase() === 'united kingdom' || country?.toLowerCase() === 'uk') {
          console.log('Fallback: Calling openaiService.generateMA_UK for UK MA');
          return await openaiService.generateMA_UK(data);
        } else if (country?.toLowerCase() === 'switzerland') {
          console.log('Fallback: Calling openaiService.generateMA_CH for Switzerland MA');
          return await openaiService.generateMA_CH(data);
        }
        console.log('Fallback: Calling openaiService.generateMAA for EU MAA');
        return await openaiService.generateMAA(data); // Default to EU MAA structure
      }

      // =============================================================================
      // FINAL FALLBACK
      // =============================================================================
      console.warn(`Unrecognized document type "${documentTypeName}" with country "${country}", defaulting to US IND Module generation.`);
      return await openaiService.generateIndModule(data);
      
    } catch (error) {
      console.error('Error in API routing for regulatory document:', error);
      throw error;
    }
  },

  // This specific function might become redundant if generateIndModule handles all routing.
  // Kept for now if there's a direct call path, but ideally consolidate.
  generateRegulatoryDocument: async (data) => {
    // This function can delegate to the enhanced generateIndModule which now handles routing
    return await apiService.generateIndModule({
        disease_name: data.disease,
        additional_parameters: {
            drug_class: data.drugClass || undefined,
            mechanism: data.mechanism || undefined,
            country: data.country || undefined,
            document_type: data.documentType || undefined
        }
    });
  },

  // Pass through methods from openaiService
  queryAssistant: openaiService.queryAssistant,
  diagnoseConversation: openaiService.diagnoseConversation,
  transcribeAudio: openaiService.transcribeAudio,

  // List saved protocols
  listProtocols: async () => {
    return protocolHistory;
  },

  // SKIN DISEASE PREDICTION METHODS
  
  // Predict skin disease from image
  predictSkinDisease: async (formData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/predict/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Prediction API error:', error);
      throw error;
    }
  },

  // LUNG CANCER PREDICTION METHODS
  
  // Predict lung cancer risk from clinical data
  predictLungCancerClinical: async (clinicalData) => {
    try {
      console.log('Calling lung cancer clinical prediction API with data:', clinicalData);
      
      const response = await axios.post(`${LUNG_CANCER_API_URL}/predict`, clinicalData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 second timeout for cold starts
      });
      
      console.log('Lung cancer clinical prediction response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Lung cancer clinical prediction API error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },

  // Predict lung cancer risk from text
  predictLungCancerText: async (textData) => {
    try {
      console.log('Calling lung cancer text prediction API with data:', textData);
      
      const response = await axios.post(`${LUNG_CANCER_API_URL}/predict_text`, textData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 second timeout for cold starts
      });
      
      console.log('Lung cancer text prediction response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Lung cancer text prediction API error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },

  // Check lung cancer API health
  checkLungCancerApiHealth: async () => {
    try {
      const response = await axios.get(`${LUNG_CANCER_API_URL}/health`, {
        timeout: 30000 // 30 second timeout
      });
      return response.data;
    } catch (error) {
      console.error('Lung cancer API health check failed:', error);
      throw error;
    }
  },

  // Get lung cancer API model status
  getLungCancerModelStatus: async () => {
    try {
      const response = await axios.get(`${LUNG_CANCER_API_URL}/model/status`, {
        timeout: 30000 // 30 second timeout
      });
      return response.data;
    } catch (error) {
      console.error('Lung cancer model status check failed:', error);
      throw error;
    }
  },

  // UTILITY METHODS
  
  // Test all API connections
  testApiConnections: async () => {
    const results = {
      skinDisease: false,
      lungCancer: false,
      timestamp: new Date().toISOString()
    };

    // Test skin disease API
    try {
      await axios.get(`${BACKEND_URL}/`, { timeout: 10000 });
      results.skinDisease = true;
    } catch (error) {
      console.warn('Skin disease API not available:', error.message);
    }

    // Test lung cancer API
    try {
      await apiService.checkLungCancerApiHealth();
      results.lungCancer = true;
    } catch (error) {
      console.warn('Lung cancer API not available:', error.message);
    }

    return results;
  },

  // Compile clinical dossier
  compileDossier: dossierService.compileDossier
};

export default apiService;