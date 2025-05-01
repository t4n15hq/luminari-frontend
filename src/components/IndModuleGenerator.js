import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const IndModuleGenerator = () => {
  const [disease, setDisease] = useState('');
  const [drugClass, setDrugClass] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('cmc');

  // Load disease name from local storage
  useEffect(() => {
    const detectedDisease = localStorage.getItem('detectedDisease');
    if (detectedDisease) setDisease(detectedDisease);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiService.generateIndModule({
        disease_name: disease.trim(),
        additional_parameters: {
          drug_class: drugClass.trim() || undefined,
          mechanism: mechanism.trim() || undefined
        }
      });
      setResult(response);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to generate IND modules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ind-module-generator">
      <h2>IND Module Generator</h2>
      <p>Generate CMC and Clinical sections for an Investigational New Drug (IND) application</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="disease">Skin Disease/Condition</label>
          <input
            id="disease"
            type="text"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            placeholder="e.g., Psoriasis, Eczema, Atopic Dermatitis"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="drug-class">Drug Class (Optional)</label>
          <input
            id="drug-class"
            type="text"
            value={drugClass}
            onChange={(e) => setDrugClass(e.target.value)}
            placeholder="e.g., Corticosteroid, Biologics, Small molecule"
          />
        </div>

        <div className="form-group">
          <label htmlFor="mechanism">Mechanism of Action (Optional)</label>
          <input
            id="mechanism"
            type="text"
            value={mechanism}
            onChange={(e) => setMechanism(e.target.value)}
            placeholder="e.g., PDE4 inhibition, JAK-STAT pathway"
          />
        </div>

        <div className="button-group">
          <button type="submit" disabled={loading || !disease}>
            {loading ? 'Generating...' : 'Generate IND Modules'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDisease('');
              setDrugClass('');
              setMechanism('');
              setResult(null);
              setError('');
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {error && <div className="error-message" aria-live="polite">{error}</div>}

      {loading && <div className="loader">⏳ Generating IND modules...</div>}

      {result && (
        <div className="result-container" aria-live="polite">
          <div className="tabs">
            <button
              className={activeTab === 'cmc' ? 'active' : ''}
              onClick={() => setActiveTab('cmc')}
            >
              CMC Section
            </button>
            <button
              className={activeTab === 'clinical' ? 'active' : ''}
              onClick={() => setActiveTab('clinical')}
            >
              Clinical Section
            </button>
          </div>

          {activeTab === 'cmc' && (
            <div className="module-content">
              <h3>Chemistry, Manufacturing, and Controls (CMC)</h3>
              <div className="content-area">
                {(result?.cmc_section || '').split('\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'clinical' && (
            <div className="module-content">
              <h3>Clinical Pharmacology Section</h3>
              <div className="content-area">
                {(result?.clinical_section || '').split('\n').map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={() => {
                const content = activeTab === 'cmc'
                  ? result.cmc_section
                  : result.clinical_section;
                navigator.clipboard.writeText(content);
                alert('✅ Current section copied!');
              }}
            >
              Copy Current Section
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `CMC SECTION:\n\n${result.cmc_section}\n\nCLINICAL SECTION:\n\n${result.clinical_section}`
                );
                alert('✅ All sections copied!');
              }}
            >
              Copy All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndModuleGenerator;