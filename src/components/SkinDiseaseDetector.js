import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import FileUpload from './FileUpload';
import openaiService from '../services/openaiService';

const SkinDiseaseDetector = () => {
  // Analysis mode state - 'image' or 'textAudio'
  const [analysisMode, setAnalysisMode] = useState('image');

  // Image analysis states
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [prediction, setPrediction] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [skinColor, setSkinColor] = useState('');
  const [skinType, setSkinType] = useState('');
  const [conditionDescription, setConditionDescription] = useState('');

  // Text/Audio analysis states
  const [transcript, setTranscript] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setPrediction([]);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();

    if (!selectedImage || !age || !gender || !race || !skinColor || !skinType || !conditionDescription) {
      alert('Please fill in all fields and select an image.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedImage);
    formData.append('age', age);
    formData.append('gender', gender);
    formData.append('race', race);
    formData.append('skin_color', skinColor);
    formData.append('skin_type', skinType);
    formData.append('condition_description', conditionDescription);

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/predict/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Process the prediction data to remove "Photos" from labels and cap at 1.0
      const preds = response.data.prediction.map(p => ({
        ...p,
        label: p.label.replace(/\s+Photos/g, ''),
        confidence: Math.min(p.confidence, 1.0) // Ensure confidence is never greater than 1.0
      })) || [];
      
      setPrediction(preds);

      if (preds.length > 0) {
        localStorage.setItem('detectedDisease', preds[0].label);
        localStorage.setItem('metadata', JSON.stringify({
          age, gender, race, skinColor, skinType, conditionDescription
        }));
      }

    } catch (error) {
      console.error('Prediction error:', error);
      setPrediction([{ label: 'An error occurred. Try again.', confidence: 0 }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text/Audio analysis function
  const handleDiagnose = async () => {
    if (!transcript) return;
    setDiagnosisLoading(true);
    setDiagnosis('');

    try {
      const result = await openaiService.diagnoseConversation(transcript);
      setDiagnosis(result);
      
      // Extract metadata from diagnosis if available
      if (result.includes('Extracted Metadata:')) {
        const metaSection = result.split('Extracted Metadata:')[1];
        if (metaSection) {
          const lines = metaSection.trim().split('\n');
          const metaMap = {};
          
          lines.forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value && value !== 'Unknown') {
              metaMap[key.toLowerCase()] = value;
            }
          });
          
          // Auto-fill the image analysis form with extracted data
          if (metaMap.age) setAge(metaMap.age);
          if (metaMap.gender) setGender(metaMap.gender);
          if (metaMap.race) setRace(metaMap.race);
          if (metaMap['skin color']) setSkinColor(metaMap['skin color']);
          if (metaMap['skin type']) setSkinType(metaMap['skin type']);
          if (metaMap['condition description']) setConditionDescription(metaMap['condition description']);
        }
      }
    } catch (err) {
      console.error(err);
      setDiagnosis('Failed to get diagnosis. See console for details.');
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const goToPage = (path) => {
    if (prediction.length > 0) {
      localStorage.setItem('detectedDisease', prediction[0].label);
    }
    window.location.href = path;
  };

  // Circular Progress component
  const CircularProgress = ({ percentage, color, label }) => {
    // Ensure percentage never exceeds 100%
    const safePercentage = Math.min(percentage, 100);
    
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 15px', width: '200px' }}>
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px', 
          padding: '10px 8px',
          marginBottom: '15px',
          width: '100%',
          color: '#333',
          fontWeight: 'bold',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          {label}
        </div>
        <div style={{ position: 'relative', width: `${radius * 2}px`, height: `${radius * 2}px` }}>
          <svg
            width={radius * 2}
            height={radius * 2}
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          >
            {/* Background circle */}
            <circle
              cx={radius}
              cy={radius}
              r={radius - 10}
              fill="transparent"
              stroke="#e6e6e6"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx={radius}
              cy={radius}
              r={radius - 10}
              fill="transparent"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${radius} ${radius})`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1a365d'
          }}>
            {safePercentage.toFixed(0)}%
          </div>
        </div>
      </div>
    );
  };

  // Split diagnosis into note + metadata block
  const [note, metaBlock = ''] = diagnosis.split(/Extracted Metadata:/i);
  const metaLines = metaBlock
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);

  return (
    <div className="skin-disease-detector">
      {/* Top Navigation Section */}
      <div className="page-navigation">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">/</span>
          <Link to="/diagnosis">Disease Diagnosis</Link>
          <span className="separator">/</span>
          <span>Dermatology</span>
        </div>
        
        {/* Back Button - left aligned */}
        <Link to="/diagnosis" className="back-to-specialties">
          Back to Specialties
        </Link>
      </div>

      {/* Page Header Section */}
      <div className="page-header">
        <h1>Skin Disease Detector</h1>
        <p>Analyze skin conditions using image or text/audio input</p>
      </div>

      {/* Analysis Type Tabs */}
      <div className="analysis-tabs">
        <button
          className={`tab-button ${analysisMode === 'image' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('image')}
        >
          Image Analysis
        </button>
        <button
          className={`tab-button ${analysisMode === 'textAudio' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('textAudio')}
        >
          Text/Audio Analysis
        </button>
      </div>

      {/* Image Analysis Section */}
      {analysisMode === 'image' && (
        <div className="analysis-content">
          <input type="file" accept="image/*" onChange={handleImageChange} />

          {previewImage && (
            <div style={{ marginTop: '10px' }}>
              <img src={previewImage} alt="Preview" style={{ maxWidth: 300, borderRadius: 10 }} />
            </div>
          )}

          <div className="metadata-inputs" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
            <select value={race} onChange={(e) => setRace(e.target.value)}>
              <option value="">Race</option>
              <option>White</option><option>Black</option><option>Asian</option><option>Latino</option><option>Other</option>
            </select>
            <select value={skinColor} onChange={(e) => setSkinColor(e.target.value)}>
              <option value="">Skin Color</option>
              <option>Light</option><option>Medium</option><option>Dark</option>
            </select>
            <select value={skinType} onChange={(e) => setSkinType(e.target.value)}>
              <option value="">Skin Type</option>
              <option>Oily</option><option>Dry</option><option>Combination</option><option>Normal</option><option>Sensitive</option>
            </select>
            <textarea
              placeholder="Condition description (e.g. itchy, spreading, flaky)"
              rows={3}
              value={conditionDescription}
              onChange={(e) => setConditionDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handlePredict}
            disabled={isLoading}
            style={{
              marginTop: 15,
              padding: '10px 20px',
              backgroundColor: isLoading ? '#ccc' : '#4c51bf',
              color: 'white',
              borderRadius: 5,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Processing...' : 'Detect Skin Disease'}
          </button>

          {prediction.length > 0 && (
            <div className="prediction-results" style={{ marginTop: 30 }}>
              <h3 style={{ 
                textAlign: 'center', 
                marginBottom: 15, 
                color: '#2d3748', 
                fontSize: '1.5rem', 
                fontWeight: 'bold' 
              }}>
                Top Predictions
              </h3>
              
              {/* Circular Progress Indicators */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                flexWrap: 'wrap',
                marginBottom: 30,
                backgroundColor: '#ffffff',
                padding: '30px 20px',
                borderRadius: 8
              }}>
                {prediction.slice(0, 3).map((p, i) => (
                  <CircularProgress 
                    key={i} 
                    percentage={(p.confidence * 100)} 
                    color={i === 0 ? '#f687b3' : i === 1 ? '#90cdf4' : '#e2e8f0'} 
                    label={p.label}
                  />
                ))}
              </div>

              <div style={{ marginTop: 20 }}>
                <p>Next Steps:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => goToPage('/')} style={nextBtnStyle('#ebf8ff', '#2b6cb0')}>Generate Protocol</button>
                  <button onClick={() => goToPage('/ind-modules')} style={nextBtnStyle('#f0fff4', '#276749')}>Generate IND Module</button>
                  <button onClick={() => goToPage('/query')} style={nextBtnStyle('#faf5ff', '#553c9a')}>Ask a Question</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text/Audio Analysis Section */}
      {analysisMode === 'textAudio' && (
        <div className="analysis-content">
          {/* Upload Card */}
          <div className="upload-card">
            <FileUpload onTranscript={setTranscript} />
          </div>

          {/* Transcript + Button */}
          {transcript && (
            <div className="transcript-container">
              <h3>Raw Transcript</h3>
              <div className="transcript-box">
                <pre className="transcript-text">
                  {transcript}
                </pre>
              </div>
              
              <button
                onClick={handleDiagnose}
                disabled={diagnosisLoading}
                className="diagnose-button"
              >
                {diagnosisLoading ? 'Diagnosing…' : 'Diagnose Condition'}
              </button>
            </div>
          )}

          {/* Diagnosis Card */}
          {diagnosis && (
            <div className="diagnosis-container">
              <h3>Diagnosis</h3>
              <p className="diagnosis-text">{note.trim()}</p>

              {metaLines.length > 0 && (
                <>
                  <h3>Extracted Metadata</h3>
                  <div className="metadata-lines">
                    {metaLines.map((line, idx) => (
                      <p key={idx} className="metadata-line">
                        {line}
                      </p>
                    ))}
                  </div>
                  
                  <button 
                    className="use-metadata-button"
                    onClick={() => {
                      setAnalysisMode('image');
                      // Metadata is already applied from the diagnosis function
                    }}
                  >
                    Use Metadata in Image Analysis
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const nextBtnStyle = (bg, color) => ({
  padding: '10px',
  backgroundColor: bg,
  color,
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
});

export default SkinDiseaseDetector;