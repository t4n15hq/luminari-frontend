import openaiService from './openaiService';
import dossierService from './dossierService';
import axios from 'axios';

// Backend prediction endpoint
const BACKEND_URL = 'https://luminari-uic-skin-disease-detection.hf.space/predict/';

// In-memory protocol storage for listProtocols
const protocolHistory = [];

const apiService = {
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

  generateIndModule: openaiService.generateIndModule,

  queryAssistant: openaiService.queryAssistant,

  listProtocols: async () => {
    return protocolHistory;
  },

  predictSkinDisease: async (formData) => {
    try {
      const response = await axios.post(BACKEND_URL, formData, {
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