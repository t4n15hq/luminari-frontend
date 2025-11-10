import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_DOCUMENTS_API_URL || 'https://luminari-be.onrender.com';

/**
 * Document Service - Helper functions for saving and retrieving documents
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }
  return null;
};

/**
 * Save a protocol document
 */
export const saveProtocol = async ({
  title,
  description,
  disease,
  content,
  formData,
  studyDesign
}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/documents`,
      {
        type: 'PROTOCOL',
        title,
        description,
        disease,
        content,
        formData,
        studyDesign,
        userId: getUserId(),
        tags: [disease, 'protocol'].filter(Boolean)
      },
      getAuthHeaders()
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Save protocol error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save a regulatory document
 */
export const saveRegulatoryDocument = async ({
  title,
  description,
  disease,
  country,
  region,
  documentType,
  content,
  sections,
  cmcSection,
  clinicalSection
}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/documents`,
      {
        type: 'REGULATORY',
        title,
        description,
        disease,
        country,
        region,
        documentType,
        content,
        sections,
        cmcSection,
        clinicalSection,
        userId: getUserId(),
        tags: [disease, country, documentType].filter(Boolean)
      },
      getAuthHeaders()
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Save regulatory document error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save a conversation (Ask Lumina)
 */
export const saveConversation = async ({
  title,
  description,
  messages,
  tags = []
}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/my-conversations`,
      {
        title,
        description,
        messages,
        tags
      },
      getAuthHeaders()
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Save conversation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's documents
 */
export const getMyDocuments = async (type = null, starred = false) => {
  try {
    let url = `${API_BASE_URL}/my-documents`;
    const params = new URLSearchParams();

    if (type) params.append('type', type);
    if (starred) params.append('starred', 'true');

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, getAuthHeaders());
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get documents error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's conversations
 */
export const getMyConversations = async (starred = false) => {
  try {
    let url = `${API_BASE_URL}/my-conversations`;
    if (starred) url += '?starred=true';

    const response = await axios.get(url, getAuthHeaders());
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get conversations error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle star status
 */
export const toggleDocumentStar = async (documentId, starred, isConversation = false) => {
  try {
    const endpoint = isConversation
      ? `/my-conversations/${documentId}/star`
      : `/my-documents/${documentId}/star`;

    const response = await axios.patch(
      `${API_BASE_URL}${endpoint}`,
      { starred },
      getAuthHeaders()
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Toggle star error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  saveProtocol,
  saveRegulatoryDocument,
  saveConversation,
  getMyDocuments,
  getMyConversations,
  toggleDocumentStar
};
