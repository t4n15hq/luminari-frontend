import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FileUpload from './FileUpload';
import apiService from '../services/api';

const LungCancerDetector = () => {
  // Analysis mode state - 'single' or 'batch'
  const [analysisMode, setAnalysisMode] = useState('single');

  // Single analysis states
  const [transcript, setTranscript] = useState('');
  const [textPrediction, setTextPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Batch processing states
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');

  const handleBatchFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    const batchItems = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'pending',
      prediction: null,
      transcript: '',
      error: null
    }));
    
    setBatchFiles(batchItems);
    setBatchResults([]);
  };

  const addManualText = () => {
    const textEntry = {
      id: Date.now(),
      file: null,
      name: `Manual Text Entry ${batchFiles.length + 1}`,
      type: 'text/plain',
      size: 0,
      status: 'pending',
      prediction: null,
      transcript: '',
      error: null,
      isManual: true
    };
    
    setBatchFiles(prev => [...prev, textEntry]);
  };

  const updateBatchText = (id, text) => {
    setBatchFiles(prev => prev.map(item => 
      item.id === id ? { ...item, transcript: text } : item
    ));
  };

  const removeBatchFile = (id) => {
    setBatchFiles(prev => prev.filter(item => item.id !== id));
  };

  const processBatch = async () => {
    setBatchLoading(true);
    setBatchProgress(0);
    setProcessingStatus('Starting batch processing...');
    
    const results = [];
    
    for (let i = 0; i < batchFiles.length; i++) {
      const item = batchFiles[i];
      setProcessingStatus(`Processing ${item.name} (${i + 1}/${batchFiles.length})`);
      
      try {
        // Update status to processing
        setBatchFiles(prev => prev.map(file => 
          file.id === item.id ? { ...file, status: 'processing' } : file
        ));

        let textToAnalyze = '';
        
        if (item.isManual) {
          // Use manually entered text
          textToAnalyze = item.transcript;
        } else if (item.file) {
          // Process file based on type
          if (item.type.startsWith('text') || item.name.endsWith('.txt')) {
            textToAnalyze = await item.file.text();
          } else if (item.type.startsWith('audio')) {
            // Use OpenAI Whisper for audio transcription
            const openaiService = await import('../services/openaiService');
            textToAnalyze = await openaiService.default.transcribeAudio(item.file);
          } else {
            throw new Error('Unsupported file type');
          }
        }

        if (!textToAnalyze.trim()) {
          throw new Error('No text content to analyze');
        }

        // Analyze text for lung cancer
        const response = await apiService.predictLungCancerText({
          text: textToAnalyze
        });

        const result = {
          ...item,
          status: 'completed',
          prediction: {
            prediction: response.prediction,
            probability: response.probability,
            detected: response.probability >= 0.35
          },
          transcript: textToAnalyze,
          confidence: response.probability
        };

        results.push(result);
        
        // Update individual file status
        setBatchFiles(prev => prev.map(file => 
          file.id === item.id ? result : file
        ));

      } catch (error) {
        console.error(`Error processing ${item.name}:`, error);
        const errorResult = {
          ...item,
          status: 'error',
          error: error.message || 'Processing failed',
          prediction: null
        };
        results.push(errorResult);
        
        setBatchFiles(prev => prev.map(file => 
          file.id === item.id ? errorResult : file
        ));
      }
      
      setBatchProgress(((i + 1) / batchFiles.length) * 100);
    }
    
    setBatchResults(results);
    setBatchLoading(false);
    setProcessingStatus('Batch processing completed!');
  };

  const exportBatchResults = () => {
    const csvContent = [
      ['File Name', 'Type', 'Cancer Detected', 'Confidence (%)', 'Status', 'Text Preview', 'Error'],
      ...batchResults.map(result => [
        result.name,
        result.isManual ? 'Manual Text' : result.type,
        result.prediction?.detected ? 'Yes' : 'No',
        result.prediction?.probability ? (result.prediction.probability * 100).toFixed(1) : 'N/A',
        result.status,
        result.transcript ? result.transcript.substring(0, 100) + '...' : 'N/A',
        result.error || 'None'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lung_cancer_batch_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTextPredict = async () => {
    if (!transcript.trim()) {
      alert('Please provide text to analyze.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Analyzing text for cancer detection...');

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
        <p>Analyze medical text or audio recordings for potential lung cancer indicators using single or batch processing</p>
      </div>

      {/* Analysis Mode Tabs */}
      <div className="analysis-tabs">
        <button
          className={`tab-button ${analysisMode === 'single' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('single')}
        >
          Single Analysis
        </button>
        <button
          className={`tab-button ${analysisMode === 'batch' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('batch')}
        >
          Batch Processing
        </button>
      </div>

      {/* Single Analysis Section */}
      {analysisMode === 'single' && (
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
      )}

      {/* Batch Processing Section */}
      {analysisMode === 'batch' && (
        <div className="analysis-content">
          <div className="upload-card">
            <h3>Batch File Upload</h3>
            <input 
              type="file" 
              accept=".txt,audio/*" 
              multiple 
              onChange={handleBatchFileChange}
              style={{ marginBottom: '20px' }}
            />
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', marginBottom: '15px' }}>
              Select multiple text files (.txt) or audio files (MP3, WAV) for batch processing.
            </p>
            
            <button
              onClick={addManualText}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              + Add Manual Text Entry
            </button>
          </div>

          {batchFiles.length > 0 && (
            <div className="batch-files-container" style={{ marginTop: '20px' }}>
              <h3>Files for Processing ({batchFiles.length})</h3>
              
              <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                {batchFiles.map((item) => (
                  <div key={item.id} style={{ 
                    padding: '15px', 
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: item.status === 'processing' ? '#fff3cd' : 
                                   item.status === 'completed' ? '#d4edda' : 
                                   item.status === 'error' ? '#f8d7da' : 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                          {item.name}
                          <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#6b7280' }}>
                            ({item.isManual ? 'Manual Text' : item.type})
                          </span>
                        </div>
                        
                        {item.isManual ? (
                          <textarea
                            value={item.transcript}
                            onChange={(e) => updateBatchText(item.id, e.target.value)}
                            placeholder="Enter medical text for analysis..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '14px',
                              marginBottom: '10px'
                            }}
                          />
                        ) : (
                          item.transcript && (
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#4b5563', 
                              backgroundColor: '#f9fafb',
                              padding: '8px',
                              borderRadius: '4px',
                              marginBottom: '10px',
                              maxHeight: '80px',
                              overflowY: 'auto'
                            }}>
                              {item.transcript.substring(0, 200)}...
                            </div>
                          )
                        )}
                        
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '500' }}>Status:</span> {item.status}
                          {item.prediction && (
                            <>
                              <br />
                              <span style={{ fontWeight: '500' }}>Result:</span> 
                              <span style={{ 
                                color: item.prediction.detected ? '#dc2626' : '#16a34a',
                                fontWeight: 'bold',
                                marginLeft: '5px'
                              }}>
                                {item.prediction.detected ? 'Cancer Indicators Detected' : 'No Indicators'}
                              </span>
                              <span style={{ marginLeft: '10px' }}>
                                ({(item.prediction.probability * 100).toFixed(1)}% confidence)
                              </span>
                            </>
                          )}
                          {item.error && (
                            <>
                              <br />
                              <span style={{ color: '#dc2626' }}>Error: {item.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeBatchFile(item.id)}
                        style={{ 
                          marginLeft: '15px', 
                          padding: '5px 10px', 
                          backgroundColor: '#dc2626', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  onClick={processBatch}
                  disabled={batchLoading || batchFiles.length === 0}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: batchLoading ? '#ccc' : '#4c51bf',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: batchLoading ? 'not-allowed' : 'pointer',
                    marginRight: '10px'
                  }}
                >
                  {batchLoading ? 'Processing...' : `Analyze ${batchFiles.length} Items`}
                </button>

                {batchResults.length > 0 && (
                  <button
                    onClick={exportBatchResults}
                    style={{
                      padding: '15px 30px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Export Results (CSV)
                  </button>
                )}
              </div>

              {batchLoading && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div 
                      style={{ 
                        width: `${batchProgress}%`, 
                        height: '20px', 
                        backgroundColor: '#4c51bf', 
                        transition: 'width 0.3s ease' 
                      }}
                    />
                  </div>
                  <p>{processingStatus}</p>
                  <p>{batchProgress.toFixed(0)}% Complete</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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