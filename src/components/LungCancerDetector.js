import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FileUpload from './FileUpload';
import apiService from '../services/api';

const LungCancerDetector = () => {
  // Text/Audio analysis states
  const [transcript, setTranscript] = useState('');
  const [textPrediction, setTextPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleTextPredict = async () => {
    if (!transcript.trim()) {
      alert('Please provide text to analyze.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Analyzing text for cancer detection...');

    // Set timeout message for cold start
    const timeout = setTimeout(() => {
      setLoadingMessage('Starting up analysis service, please wait...');
    }, 5000);

    try {
      const response = await apiService.predictLungCancerText({
        text: transcript
      });
      
      clearTimeout(timeout);
      
      setTextPrediction({
        prediction: response.prediction,
        probability: response.probability,
        detected: response.probability >= 0.35
      });

      // Store for other components
      localStorage.setItem('detectedDisease', 'Lung Cancer Detection Analysis');
      localStorage.setItem('metadata', JSON.stringify({ analysisText: transcript }));

    } catch (error) {
      clearTimeout(timeout);
      console.error('Text prediction error:', error);
      setTextPrediction({
        prediction: null,
        probability: 0,
        detected: false,
        error: 'Unable to analyze text. Please try again.'
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const resetAnalysis = () => {
    setTranscript('');
    setTextPrediction(null);
    setIsLoading(false);
    setLoadingMessage('');
  };

  const goToPage = (path) => {
    if (textPrediction) {
      localStorage.setItem('detectedDisease', 'Lung Cancer Detection Analysis');
    }
    window.location.href = path;
  };

  return (
    <div className="lung-cancer-detector">
      {/* Top Navigation Section */}
      <div className="page-navigation">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
          <Link to="/diagnosis">Disease Diagnosis</Link>
          <span className="separator">/</span>
          <span>Pulmonology</span>
        </div>
        
        <Link to="/diagnosis" className="back-to-specialties">
          Back to Specialties
        </Link>
      </div>

      {/* Page Header Section */}
      <div className="page-header">
        <h1>Lung Cancer Detector</h1>
        <p>Analyze medical text or audio recordings for potential lung cancer indicators</p>
      </div>

      {/* Analysis Content */}
      <div className="analysis-content">
        {/* Upload Card for Audio Files */}
        <div className="upload-card">
          <h3>Upload Audio File</h3>
          <FileUpload onTranscript={setTranscript} />
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginTop: '10px' }}>
            Upload MP3, WAV, or other audio files containing medical consultations or patient interviews
          </p>
        </div>

        {/* Manual Text Input */}
        <div className="upload-card" style={{ marginTop: '20px' }}>
          <h3>Or Enter Medical Text</h3>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Enter clinical notes, patient history, medical consultation transcript, or any medical text related to respiratory symptoms..."
            rows={8}
            style={{
              width: '100%',
              padding: '15px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              resize: 'vertical',
              minHeight: '150px'
            }}
          />
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginTop: '10px' }}>
            Paste medical text, consultation notes, or patient descriptions of symptoms
          </p>
        </div>

        {/* Analysis Button and Results */}
        {transcript && (
          <div className="transcript-container">
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', marginBottom: '20px' }}>
              <button
                onClick={handleTextPredict}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '15px 20px',
                  backgroundColor: isLoading ? '#ccc' : '#4c51bf',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? loadingMessage || 'Analyzing...' : 'Analyze for Lung Cancer'}
              </button>
              
              <button
                onClick={resetAnalysis}
                disabled={isLoading}
                style={{
                  padding: '15px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                Reset
              </button>
            </div>

            {/* Text Preview */}
            <div className="transcript-box" style={{ marginBottom: '20px' }}>
              <h4>Text to Analyze:</h4>
              <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #e9ecef'
              }}>
                <pre className="transcript-text" style={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  margin: 0
                }}>
                  {transcript}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {textPrediction && (
          <div className="prediction-results" style={{ marginTop: 30 }}>
            <div style={{ 
              backgroundColor: '#ffffff',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                textAlign: 'center', 
                marginBottom: 20, 
                color: '#2d3748', 
                fontSize: '1.5rem', 
                fontWeight: 'bold' 
              }}>
                Analysis Results
              </h3>
              
              {textPrediction.error ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#dc2626', 
                  padding: '20px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <h4>❌ Analysis Error</h4>
                  <p>{textPrediction.error}</p>
                </div>
              ) : (
                <>
                  {/* Main Result */}
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: '30px',
                    padding: '25px',
                    backgroundColor: textPrediction.detected ? '#fef2f2' : '#f0fdf4',
                    borderRadius: '12px',
                    border: `2px solid ${textPrediction.detected ? '#fecaca' : '#bbf7d0'}`
                  }}>
                    <div style={{ 
                      fontSize: '4rem', 
                      marginBottom: '15px' 
                    }}>
                      {textPrediction.detected ? '⚠️' : '✅'}
                    </div>
                    
                    <h2 style={{ 
                      margin: '0 0 10px 0',
                      color: textPrediction.detected ? '#dc2626' : '#16a34a',
                      fontSize: '1.8rem'
                    }}>
                      {textPrediction.detected ? 'Cancer Indicators Detected' : 'No Cancer Indicators Detected'}
                    </h2>
                    
                    <p style={{ 
                      fontSize: '1.2rem', 
                      margin: '10px 0',
                      color: '#4b5563'
                    }}>
                      <strong>Confidence:</strong> {(textPrediction.probability * 100).toFixed(1)}%
                    </p>
                    
                    <p style={{ 
                      fontSize: '0.95rem', 
                      color: '#6b7280',
                      fontStyle: 'italic',
                      marginTop: '15px'
                    }}>
                      {textPrediction.detected 
                        ? 'The analysis suggests potential lung cancer indicators in the provided text. Please consult with a healthcare professional for proper evaluation.'
                        : 'The analysis did not find significant lung cancer indicators in the provided text. This does not replace professional medical evaluation.'
                      }
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div style={{ 
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '25px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>
                      📋 Recommendation:
                    </h4>
                    <p style={{ margin: 0, lineHeight: '1.6', color: '#4b5563' }}>
                      {textPrediction.detected 
                        ? 'Given the detected indicators, it is recommended to schedule an immediate consultation with an oncologist or pulmonologist for further diagnostic imaging and evaluation.'
                        : 'Continue routine healthcare monitoring. If new symptoms develop or existing symptoms worsen, consult with your healthcare provider.'
                      }
                    </p>
                  </div>

                  {/* Next Steps */}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                    <h4 style={{ textAlign: 'center', marginBottom: '15px', color: '#374151' }}>
                      Next Steps:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button 
                        onClick={() => goToPage('/protocol')} 
                        style={nextBtnStyle('#ebf8ff', '#2b6cb0')}
                      >
                        📋 Generate Clinical Protocol
                      </button>
                      <button 
                        onClick={() => goToPage('/ind-modules')} 
                        style={nextBtnStyle('#f0fff4', '#276749')}
                      >
                        📄 Generate Regulatory Document
                      </button>
                      <button 
                        onClick={() => goToPage('/query')} 
                        style={nextBtnStyle('#faf5ff', '#553c9a')}
                      >
                        ❓ Ask Clinical Question
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Information Box */}
        {!textPrediction && (
          <div className="info-box" style={{ marginTop: '30px' }}>
            <h4>💡 How It Works</h4>
            <p>
              This AI-powered tool analyzes medical text and audio recordings to identify potential lung cancer indicators. 
              The system evaluates symptoms, medical history, and clinical language patterns to provide an assessment.
            </p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>Text Analysis:</strong> Paste medical notes, consultation transcripts, or patient descriptions</li>
              <li><strong>Audio Processing:</strong> Upload MP3/WAV files of medical consultations or patient interviews</li>
              <li><strong>AI Assessment:</strong> Advanced natural language processing identifies cancer-related indicators</li>
              <li><strong>Clinical Integration:</strong> Results can be used to generate protocols and regulatory documents</li>
            </ul>

          </div>
        )}
      </div>
    </div>
  );
};

const nextBtnStyle = (bg, color) => ({
  padding: '12px 20px',
  backgroundColor: bg,
  color,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  textAlign: 'center'
});

export default LungCancerDetector;