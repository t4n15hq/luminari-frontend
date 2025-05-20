// Update to src/services/api.js

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

  // Enhanced IND Module generation to support more document types
  generateIndModule: async (data) => {
    try {
      // Get document type info
      const documentType = data.additional_parameters?.document_type || "IND Module";
      const country = data.additional_parameters?.country;
      
      console.log('Generating document:', documentType, 'for country:', country);
      
      // Determine which generation method to use based on document type
      if (documentType.includes("IND") || documentType.includes("Module")) {
        return await openaiService.generateIndModule(data);
      } 
      else if (documentType.includes("NDA") || documentType.includes("New Drug Application")) {
        return await openaiService.generateNDA(data);
      }
      else if (documentType.includes("CTA") || documentType.includes("Clinical Trial")) {
        return await openaiService.generateCTA(data);
      }
      else if (documentType.includes("MAA") || documentType.includes("Marketing Authorization")) {
        return await openaiService.generateMAA(data);
      }
      else if (documentType.includes("IMPD") || documentType.includes("Investigational Medicinal Product")) {
        return await openaiService.generateIMPD(data);
      }
      else {
        // Default to IND Module if document type not recognized
        console.log('Document type not specifically handled, using IND Module generation');
        return await openaiService.generateIndModule(data);
      }
    } catch (error) {
      console.error('Error generating regulatory document:', error);
      throw error;
    }
  },

  // Generate a specific regulatory document by type
  generateRegulatoryDocument: async (data) => {
    try {
      const { documentType, country, disease, drugClass, mechanism } = data;
      
      // Convert to format expected by OpenAI service
      const requestData = {
        disease_name: disease,
        additional_parameters: {
          drug_class: drugClass || undefined,
          mechanism: mechanism || undefined,
          country: country || undefined,
          document_type: documentType || "Regulatory Document"
        }
      };
      
      return await apiService.generateIndModule(requestData);
    } catch (error) {
      console.error('Error generating specific regulatory document:', error);
      throw error;
    }
  },

  queryAssistant: openaiService.queryAssistant,

  listProtocols: async () => {
    return protocolHistory;
  },

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

  compileDossier: dossierService.compileDossier
};

export default apiService;