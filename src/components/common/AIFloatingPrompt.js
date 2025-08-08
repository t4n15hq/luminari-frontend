import React, { useState, useRef, useEffect } from 'react';
import openaiService from '../../services/openaiService';

const AIFloatingPrompt = ({ onApplySuggestion, onClose, selectedText }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const promptRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsProcessing(true);
    try {
      // Include the selected text in the prompt
      const fullPrompt = `Selected text: "${selectedText}"\n\nUser request: ${prompt}`;
      const response = await openaiService.generateTextImprovement(fullPrompt);
      
      // Automatically apply the first (best) suggestion
      if (response && response.length > 0) {
        onApplySuggestion(response[0]);
        setPrompt('');
        onClose();
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // Show a brief error message
      alert('Unable to process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={promptRef}
      className="ai-prompt-container"
      style={{
        position: 'fixed',
        zIndex: 1000,
        background: '#ffffff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        padding: '1rem',
        minWidth: '300px',
        maxWidth: '500px'
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0.5rem'
      }}>
        <h4 style={{ margin: 0, color: '#1e40af', fontSize: '1rem' }}>
          🤖 AI Text Assistant
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '0'
          }}
        >
          ×
        </button>
      </div>

      {/* Selected Text Display */}
      {selectedText && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem', 
          background: '#f3f4f6', 
          borderRadius: '4px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Selected text:
          </div>
          <div style={{ fontSize: '0.875rem', color: '#374151', fontStyle: 'italic' }}>
            "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontSize: '0.875rem', 
            color: '#374151',
            fontWeight: '500'
          }}>
            What would you like to do with the selected text?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Make this more concise, Rewrite in professional tone, Simplify this paragraph..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Quick actions:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[
              'Make concise',
              'Professional tone',
              'Simplify',
              'Academic style',
              'Fix grammar'
            ].map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => {
                  setPrompt(action);
                  // Auto-submit when quick action is clicked
                  setTimeout(() => {
                    const form = promptRef.current.querySelector('form');
                    if (form) {
                      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  }, 100);
                }}
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing || !prompt.trim()}
          style={{
            background: isProcessing ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'all 0.2s'
          }}
        >
          {isProcessing ? '🤖 Processing...' : '✨ Apply AI Improvement'}
        </button>
      </form>

      {/* Processing Indicator */}
      {isProcessing && (
        <div style={{ 
          marginTop: '1rem', 
          textAlign: 'center', 
          color: '#6b7280', 
          fontSize: '0.875rem' 
        }}>
          🤖 AI is improving your text...
        </div>
      )}
    </div>
  );
};

export default AIFloatingPrompt; 