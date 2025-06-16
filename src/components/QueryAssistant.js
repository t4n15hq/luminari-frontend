import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const QueryAssistant = () => {
  const [question, setQuestion] = useState('');
  const [diseaseContext, setDiseaseContext] = useState('');
  const [selectedProtocolId, setSelectedProtocolId] = useState('');
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProtocols();
    const detectedDisease = localStorage.getItem('detectedDisease');
    if (detectedDisease) setDiseaseContext(detectedDisease);
  }, []);

  const fetchProtocols = async () => {
    try {
      const response = await apiService.listProtocols();
      setProtocols(response || []);
    } catch (err) {
      console.error('Error fetching protocols:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setAnswer('');

    try {
      const response = await apiService.queryAssistant({
        question,
        disease_context: diseaseContext || undefined,
        protocol_id: selectedProtocolId || undefined,
      });

      setAnswer(response.answer);
      setQueryHistory(prev => [{
        question,
        answer: response.answer,
        timestamp: new Date().toISOString(),
        diseaseContext,
        protocolId: selectedProtocolId
      }, ...prev]);
      setSuccess(true);
    } catch (err) {
      setError('Failed to fetch answer. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="query-assistant">
      <h2>Ask Lumina<span className="trademark">™</span></h2>
      <p>Ask targeted questions about clinical protocols, endpoints, or trial designs</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="question">Your Question</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are key efficacy endpoints for psoriasis?"
            rows={3}
            required
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Disease Context (Optional)</label>
            <input
              type="text"
              value={diseaseContext}
              onChange={(e) => setDiseaseContext(e.target.value)}
              placeholder="e.g., Psoriasis, Eczema"
            />
          </div>

          <div className="form-group">
            <label>Reference Protocol (Optional)</label>
            <select
              value={selectedProtocolId}
              onChange={(e) => setSelectedProtocolId(e.target.value)}
            >
              <option value="">None</option>
              {protocols.map(protocol => (
                <option key={protocol.protocol_id} value={protocol.protocol_id}>
                  {protocol.disease_name} – {new Date(protocol.generation_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading || !question}>
          {loading ? 'Generating Answer...' : 'Submit Question'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">✅ Answer received!</div>}

      {answer && (
        <div className="answer-container">
          <h3>Answer</h3>
          <div className="answer-content">
            {answer.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          <div className="action-buttons">
            <button onClick={() => navigator.clipboard.writeText(answer)}>Copy to Clipboard</button>
          </div>
        </div>
      )}

      {queryHistory.length > 0 && (
        <div className="query-history">
          <h4>Past Questions</h4>
          <ul>
            {queryHistory.map((item, idx) => (
              <li key={idx}>
                <strong>Q:</strong> {item.question} <br />
                <small>{new Date(item.timestamp).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QueryAssistant;