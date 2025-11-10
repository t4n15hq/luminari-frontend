import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import PreviousDocuments from './common/PreviousDocuments';
import { saveConversation } from '../services/documentService';

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
  const [showPreviousDocs, setShowPreviousDocs] = useState(false);

  useEffect(() => {
    fetchProtocols();
    // Removed auto-population from localStorage
  }, []);

  const fetchProtocols = async () => {
    try {
      const response = await apiService.listProtocols();
      setProtocols(response || []);
    } catch (err) {
      // console.error('Error fetching protocols:', err);
    }
  };

  // Check if question is completely off-topic (only filter out obviously non-medical questions)
  const isCompletelyOffTopic = (question) => {
    // Use word boundaries to avoid partial matches (like "eat" in "treated")
    const offTopicKeywords = [
      'weather', 'temperature', 'climate', 'rain', 'snow', 'sunny', 'cloudy',
      'recipe', 'cooking', 'restaurant', 'meal', 'dinner', 'lunch',
      'sports', 'football', 'basketball', 'soccer', 'game', 'score', 'team',
      'movie', 'film', 'entertainment', 'celebrity', 'actor', 'actress',
      'politics', 'election', 'vote', 'president', 'government',
      'travel', 'vacation', 'hotel', 'flight', 'tourism'
    ];

    const questionLower = question.toLowerCase();
    // Use word boundaries to ensure exact word matches only
    return offTopicKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(questionLower);
    });
  };

  // Generate standardized response for irrelevant questions
  const getStandardizedResponse = (question) => {
    const responses = [
      {
        condition: (q) => q.toLowerCase().includes('weather') || q.toLowerCase().includes('temperature'),
        response: `CLINICAL PROTOCOL ASSISTANT - QUERY SCOPE NOTICE

I'm Lumina™, your specialized clinical protocol and regulatory documentation assistant. Your question appears to be about weather/temperature topics, which are outside my area of expertise.

MY SPECIALIZED CAPABILITIES:
• Clinical trial protocol design and optimization
• Regulatory document generation (IND, NDA, BLA, CTD, eCTD)
• Endpoint selection and statistical considerations
• Patient population definitions and inclusion/exclusion criteria
• Safety monitoring and adverse event assessment
• Regulatory compliance guidance (FDA, EMA, ICH guidelines)

RELEVANT QUESTIONS I CAN HELP WITH:
• "What are appropriate primary endpoints for a Phase 3 psoriasis trial?"
• "How should I structure inclusion criteria for elderly patients?"
• "What safety monitoring is required for oncology studies?"
• "How do I design a pediatric dosing study?"

Please ask a question related to clinical trials, protocols, or regulatory affairs, and I'll provide detailed, professional guidance.`
      },
      {
        condition: (q) => q.toLowerCase().includes('recipe') || q.toLowerCase().includes('cooking') || q.toLowerCase().includes('food'),
        response: `CLINICAL PROTOCOL ASSISTANT - QUERY SCOPE NOTICE

I'm Lumina™, your specialized clinical protocol and regulatory documentation assistant. Your question appears to be about cooking/recipes, which are outside my area of expertise.

MY SPECIALIZED CAPABILITIES:
• Clinical trial protocol design and optimization
• Regulatory document generation (IND, NDA, BLA, CTD, eCTD)
• Endpoint selection and statistical considerations
• Patient population definitions and inclusion/exclusion criteria
• Safety monitoring and adverse event assessment
• Regulatory compliance guidance (FDA, EMA, ICH guidelines)

RELEVANT QUESTIONS I CAN HELP WITH:
• "What are key efficacy endpoints for dermatology trials?"
• "How should I design a dose-escalation study?"
• "What are FDA requirements for pediatric studies?"
• "How do I calculate sample size for a superiority trial?"

Please ask a question related to clinical trials, protocols, or regulatory affairs, and I'll provide detailed, professional guidance.`
      },
      {
        condition: (q) => true, // Default catch-all
        response: `CLINICAL PROTOCOL ASSISTANT - QUERY SCOPE NOTICE

I'm Lumina™, your specialized clinical protocol and regulatory documentation assistant. Your question appears to be outside my area of clinical and regulatory expertise.

MY SPECIALIZED CAPABILITIES:
• Clinical trial protocol design and optimization
• Regulatory document generation (IND, NDA, BLA, CTD, eCTD)
• Endpoint selection and statistical considerations
• Patient population definitions and inclusion/exclusion criteria
• Safety monitoring and adverse event assessment
• Regulatory compliance guidance (FDA, EMA, ICH guidelines)
• Disease-specific protocol requirements (dermatology, oncology, neurology, etc.)

EXAMPLES OF RELEVANT QUESTIONS:
• "What are appropriate primary endpoints for a Phase 2 atopic dermatitis trial?"
• "How should I structure inclusion criteria for a lung cancer study?"
• "What safety assessments are required for immunotherapy trials?"
• "How do I design a bioequivalence study?"
• "What are EMA guidelines for pediatric development?"

Please rephrase your question to focus on clinical trials, protocol development, or regulatory affairs, and I'll provide comprehensive, professional guidance.`
      }
    ];

    return responses.find(r => r.condition(question))?.response || responses[responses.length - 1].response;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setAnswer('');

    try {
      // Only filter out completely off-topic questions, let the AI handle the rest
      if (isCompletelyOffTopic(question)) {
        const standardResponse = getStandardizedResponse(question);
        setAnswer(standardResponse);
        setQueryHistory(prev => [{
          question,
          answer: standardResponse,
          timestamp: new Date().toISOString(),
          diseaseContext,
          protocolId: selectedProtocolId,
          isStandardized: true
        }, ...prev]);
        setSuccess(true);
        return;
      }

      // Send all other questions to the AI API
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
        protocolId: selectedProtocolId,
        isStandardized: false
      }, ...prev]);
      setSuccess(true);
    } catch (err) {
      setError('Failed to fetch answer. Please try again.');
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (queryHistory.length === 0) {
      alert('No conversation to save');
      return;
    }

    // Convert queryHistory to messages format
    const messages = [];
    queryHistory.reverse().forEach((item) => {
      messages.push({ role: 'user', content: item.question });
      messages.push({ role: 'assistant', content: item.answer });
    });

    // Generate title from first user message
    const firstUserMsg = queryHistory[queryHistory.length - 1];
    const title = firstUserMsg
      ? firstUserMsg.question.substring(0, 100)
      : 'Conversation';

    const result = await saveConversation({
      title: title,
      description: `Chat with ${queryHistory.length} questions`,
      messages: messages,
      tags: ['ask-lumina', diseaseContext].filter(Boolean)
    });

    if (result.success) {
      alert('Conversation saved successfully!');
    } else {
      alert('Failed to save conversation: ' + (result.error || 'Unknown error'));
    }
  };

  return (
    <div className="query-assistant">
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b', textAlign: 'left' }}>Ask Lumina<span className="trademark">™</span></h2>
      <p>Ask me anything about clinical protocols, medical research, treatment options, or health-related topics</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="question" className="form-label">Your Question</label>
          <textarea
            id="question"
            className="form-textarea"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are the symptoms of diabetes? How is psoriasis treated? What are clinical trial endpoints?"
            rows={3}
            required
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Disease Context (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={diseaseContext}
              onChange={(e) => setDiseaseContext(e.target.value)}
              placeholder="e.g., Psoriasis, Eczema"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reference Protocol (Optional)</label>
            <select
              className="form-select"
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

        <button type="submit" disabled={loading || !question} className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}>
          {loading ? 'Generating Answer...' : 'Submit Question'}
        </button>
      </form>

      <div className="chat-actions" style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <button onClick={() => setShowPreviousDocs(true)} className="btn-secondary" style={{
          padding: '0.75rem 1.5rem',
          fontSize: '14px',
          fontWeight: '600',
          color: '#683D94',
          backgroundColor: 'white',
          border: '2px solid #683D94',
          borderRadius: '0',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          Previous Conversations
        </button>
        {queryHistory.length > 0 && (
          <button onClick={handleSaveConversation} className="btn-primary" style={{
            padding: '0.75rem 1.5rem',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#683D94',
            border: 'none',
            borderRadius: '0',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}>
            Save Conversation
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Answer received!</div>}

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
                <strong>Q:</strong> {item.question} 
                {item.isStandardized && (
                  <span style={{ 
                    marginLeft: '10px', 
                    backgroundColor: '#fbbf24', 
                    color: '#92400e', 
                    padding: '2px 6px', 
                    borderRadius: '0', 
                    fontSize: '0.7rem' 
                  }}>
                    SCOPE NOTICE
                  </span>
                )}
                <br />
                <small>{new Date(item.timestamp).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PreviousDocuments
        isOpen={showPreviousDocs}
        onClose={() => setShowPreviousDocs(false)}
        documentType="CHAT"
        onSelectDocument={(doc) => {
          if (doc.messages && Array.isArray(doc.messages)) {
            // Convert messages back to queryHistory format
            const newHistory = [];
            for (let i = 0; i < doc.messages.length; i += 2) {
              if (doc.messages[i] && doc.messages[i + 1]) {
                newHistory.push({
                  question: doc.messages[i].content,
                  answer: doc.messages[i + 1].content,
                  timestamp: doc.createdAt,
                  diseaseContext: doc.tags?.[1] || '',
                  protocolId: '',
                  isStandardized: false
                });
              }
            }
            setQueryHistory(newHistory);
            if (newHistory.length > 0) {
              setAnswer(newHistory[0].answer);
            }
          }
        }}
      />
    </div>
  );
};

export default QueryAssistant;