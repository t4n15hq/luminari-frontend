// src/services/api.js

import openaiService from './openaiService';
import dossierService from './dossierService';
import axios from 'axios';

// Backend prediction endpoint
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://luminari-uic-skin-disease-detection.hf.space';

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

  // Enhanced to act as a router for all regulatory documents
  generateIndModule: async (data) => {
    try {
      const documentTypeName = data.additional_parameters?.document_type || "IND (Investigational New Drug)";
      const country = data.additional_parameters?.country;
      const lowerDocName = documentTypeName.toLowerCase();

      console.log(`Routing document generation for: "${documentTypeName}", Country: "${country}"`);

      // Specific Document Types
      if (documentTypeName === "BLA (Biologics License Application)") {
        console.log('Calling openaiService.generateBLA');
        return await openaiService.generateBLA(data);
      } else if (documentTypeName === "NDA (New Drug Application)" && (!country || country.toLowerCase() === 'usa')) {
        console.log('Calling openaiService.generateNDA for USA');
        return await openaiService.generateNDA(data);
      } else if (documentTypeName === "CTA (Clinical Trial Application)") { // Primarily EU
        console.log('Calling openaiService.generateCTA');
        return await openaiService.generateCTA(data);
      } else if (documentTypeName === "MAA (Marketing Authorization Application)") { // EU MAA
        console.log('Calling openaiService.generateMAA');
        return await openaiService.generateMAA(data);
      } else if (documentTypeName === "IMPD (Investigational Medicinal Product Dossier)") { // EU IMPD
        console.log('Calling openaiService.generateIMPD');
        return await openaiService.generateIMPD(data);
      } else if (documentTypeName === "Clinical Trial Notification (CTN)" && country?.toLowerCase() === 'japan') {
        console.log('Calling openaiService.generateCTN_JP');
        return await openaiService.generateCTN_JP(data);
      } else if (documentTypeName === "J-NDA (New Drug Application)") { // Japan J-NDA
        console.log('Calling openaiService.generateJNDA');
        return await openaiService.generateJNDA(data);
      } else if (documentTypeName === "IND" && country?.toLowerCase() === 'china') {
        console.log('Calling openaiService.generateIND_CH');
        return await openaiService.generateIND_CH(data);
      } else if (documentTypeName === "NDA" && country?.toLowerCase() === 'china') {
        console.log('Calling openaiService.generateNDA_CH');
        return await openaiService.generateNDA_CH(data);
      } else if (documentTypeName === "CTN (Clinical Trial Notification)" && country?.toLowerCase() === 'australia') {
        console.log('Calling openaiService.generateCTN_AU');
        return await openaiService.generateCTN_AU(data);
      } else if (documentTypeName === "AUS (Australian Submission)") { // Australia AUS
        console.log('Calling openaiService.generateAUS');
        return await openaiService.generateAUS(data);
      } else if (documentTypeName === "IND (Investigational New Drug)") { // Default US IND
        console.log('Calling openaiService.generateIndModule for US IND');
        return await openaiService.generateIndModule(data);
      }
      // Fallbacks for generic names if country helps disambiguate
      else if (lowerDocName.includes("ind")) {
        if (country?.toLowerCase() === 'china') {
          console.log('Fallback: Calling openaiService.generateIND_CH for China IND');
          return await openaiService.generateIND_CH(data);
        }
        console.log('Fallback: Calling openaiService.generateIndModule for generic IND');
        return await openaiService.generateIndModule(data); // Default to US IND structure
      } else if (lowerDocName.includes("nda")) {
         if (country?.toLowerCase() === 'china') {
            console.log('Fallback: Calling openaiService.generateNDA_CH for China NDA');
            return await openaiService.generateNDA_CH(data);
        } else if (country?.toLowerCase() === 'japan') {
            console.log('Fallback: Calling openaiService.generateJNDA for Japan NDA');
            return await openaiService.generateJNDA(data);
        }
        console.log('Fallback: Calling openaiService.generateNDA for generic NDA');
        return await openaiService.generateNDA(data); // Default to US NDA structure
      }
      // Add more fallbacks for CTA, MAA, etc. if necessary

      // Final fallback
      else {
        console.warn(`Unrecognized document type "${documentTypeName}" with country "${country}", defaulting to US IND Module generation.`);
        return await openaiService.generateIndModule(data);
      }
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

  // Compile clinical dossier
  compileDossier: dossierService.compileDossier
};

export default apiService;