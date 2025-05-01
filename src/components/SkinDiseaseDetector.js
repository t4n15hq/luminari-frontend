import React, { useState } from 'react';
import axios from 'axios';

const SkinDiseaseDetector = () => {
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

      // Process the prediction data to remove "Photos" from labels
      const preds = response.data.prediction.map(p => ({
        ...p,
        label: p.label.replace(/\s+Photos/g, '')
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

  const goToPage = (path) => {
    if (prediction.length > 0) {
      localStorage.setItem('detectedDisease', prediction[0].label);
    }
    window.location.href = path;
  };

  // Circular Progress component
  const CircularProgress = ({ percentage, color, label }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
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
            {percentage.toFixed(0)}%
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="skin-disease-detector">
      <h2>Skin Disease Detector</h2>
      <p>Upload an image and provide details to receive top-3 skin disease predictions.</p>

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