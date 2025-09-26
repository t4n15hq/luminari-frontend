import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Use your deployed backend server
const API_BASE_URL = process.env.REACT_APP_DOCUMENTS_API_URL || 'https://luminari-be.onrender.com';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Global protocol state that persists across all pages
  const [globalProtocolResult, setGlobalProtocolResult] = useState(null);
  const [globalStudyDesign, setGlobalStudyDesign] = useState(null);
  const [globalProtocolFormData, setGlobalProtocolFormData] = useState({
    disease: '',
    population: '',
    treatment: '',
    drugClass: '',
    mechanism: '',
    clinicalInfo: '',
    studyType: 'clinical',
    trialPhase: '',
    trialType: '',
    randomization: '',
    blinding: '',
    controlGroupType: '',
    sampleSize: '',
    minAge: '',
    maxAge: '',
    gender: '',
    inclusionCriteria: '',
    exclusionCriteria: '',
    routeOfAdministration: '',
    dosingFrequency: '',
    comparatorDrug: '',
    primaryEndpoints: '',
    secondaryEndpoints: '',
    outcomeMeasurementTool: '',
    statisticalPower: '80',
    significanceLevel: '0.05',
    studyDuration: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
    
    // Load global protocol state from localStorage
    loadGlobalProtocolState();
  }, []);

  const loadGlobalProtocolState = () => {
    try {
      const savedProtocolResult = localStorage.getItem('globalProtocolResult');
      const savedStudyDesign = localStorage.getItem('globalStudyDesign');
      const savedFormData = localStorage.getItem('globalProtocolFormData');
      
      if (savedProtocolResult) {
        setGlobalProtocolResult(JSON.parse(savedProtocolResult));
      }
      if (savedStudyDesign) {
        setGlobalStudyDesign(JSON.parse(savedStudyDesign));
      }
      if (savedFormData) {
        setGlobalProtocolFormData(JSON.parse(savedFormData));
      }
    } catch (error) {
      console.error('Error loading global protocol state:', error);
    }
  };

  const saveGlobalProtocolState = (protocolResult, studyDesign, formData) => {
    try {
      if (protocolResult) {
        localStorage.setItem('globalProtocolResult', JSON.stringify(protocolResult));
        setGlobalProtocolResult(protocolResult);
      }
      if (studyDesign) {
        localStorage.setItem('globalStudyDesign', JSON.stringify(studyDesign));
        setGlobalStudyDesign(studyDesign);
      }
      if (formData) {
        localStorage.setItem('globalProtocolFormData', JSON.stringify(formData));
        setGlobalProtocolFormData(formData);
      }
    } catch (error) {
      console.error('Error saving global protocol state:', error);
    }
  };

  const clearGlobalProtocolState = () => {
    localStorage.removeItem('globalProtocolResult');
    localStorage.removeItem('globalStudyDesign');
    localStorage.removeItem('globalProtocolFormData');
    setGlobalProtocolResult(null);
    setGlobalStudyDesign(null);
    setGlobalProtocolFormData({
      disease: '',
      population: '',
      treatment: '',
      drugClass: '',
      mechanism: '',
      clinicalInfo: '',
      studyType: 'clinical',
      trialPhase: '',
      trialType: '',
      randomization: '',
      blinding: '',
      controlGroupType: '',
      sampleSize: '',
      minAge: '',
      maxAge: '',
      gender: '',
      inclusionCriteria: '',
      exclusionCriteria: '',
      routeOfAdministration: '',
      dosingFrequency: '',
      comparatorDrug: '',
      primaryEndpoints: '',
      secondaryEndpoints: '',
      outcomeMeasurementTool: '',
      statisticalPower: '80',
      significanceLevel: '0.05',
      studyDuration: ''
    });
  };

  const verifyToken = async (token) => {
    try {
      const response = await apiClient.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.valid) {
        setIsAuthenticated(true);
        setUser(response.data.user);
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('Attempting login to:', API_BASE_URL);
      const response = await apiClient.post('/auth/login', {
        username,
        password
      });

      const { token, user: userData } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      console.error('Full error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    clearGlobalProtocolState(); // Clear protocol data on logout
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    // Global protocol state and functions
    globalProtocolResult,
    globalStudyDesign,
    globalProtocolFormData,
    setGlobalProtocolResult,
    setGlobalStudyDesign,
    setGlobalProtocolFormData,
    saveGlobalProtocolState,
    clearGlobalProtocolState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};