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

      const preds = response.data.prediction || [];
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
        <div className="prediction-results" style={{ marginTop: 20 }}>
          <h3>Top Predictions</h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {prediction.map((p, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <strong>{i + 1}. {p.label}</strong>
                <div style={{ background: '#eee', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${(p.confidence * 100).toFixed(2)}%`, background: '#4c51bf', height: '100%' }} />
                </div>
                <span>{(p.confidence * 100).toFixed(2)}%</span>
              </li>
            ))}
          </ul>

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
