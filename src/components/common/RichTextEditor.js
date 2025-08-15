import React, { useRef, useState, useEffect } from 'react';
import AIFloatingPrompt from './AIFloatingPrompt';

const RichTextEditor = ({ value, onChange, placeholder, style, aiEnabled = false }) => {
  const editorRef = useRef(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [promptPosition, setPromptPosition] = useState({ x: 0, y: 0 });
  const [aiToggle, setAiToggle] = useState(false);

  // Simple formatting functions
  const formatText = (command) => {
    editorRef.current.focus();
    document.execCommand(command, false, null);
    onChange(editorRef.current.innerHTML);
  };

  const changeFontSize = (size) => {
    editorRef.current.focus();
    document.execCommand('fontSize', false, size);
    onChange(editorRef.current.innerHTML);
  };

  const changeAlignment = (align) => {
    editorRef.current.focus();
    document.execCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`, false, null);
    onChange(editorRef.current.innerHTML);
  };

  // Handle text selection for AI prompt
  const handleSelection = () => {
    if (!aiToggle) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0 && selection.rangeCount > 0) {
      setSelectedText(selectedText);
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setPromptPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      
      setShowAIPrompt(true);
    } else {
      setShowAIPrompt(false);
    }
  };

  // Apply AI suggestion
  const applyAISuggestion = (suggestion) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(suggestion));
      onChange(editorRef.current.innerHTML);
    }
    setShowAIPrompt(false);
    setSelectedText('');
    editorRef.current.focus();
  };

  // Close AI prompt
  const closeAIPrompt = () => {
    setShowAIPrompt(false);
    setSelectedText('');
  };

  // Add event listeners for AI functionality
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && aiToggle) {
      const handleMouseUp = () => {
        setTimeout(handleSelection, 100);
      };
      
      editor.addEventListener('mouseup', handleMouseUp);
      return () => editor.removeEventListener('mouseup', handleMouseUp);
    }
  }, [aiToggle, handleSelection]);

  // Handle clicks outside to close prompt
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAIPrompt && !event.target.closest('.ai-prompt-container')) {
        closeAIPrompt();
      }
    };

    if (showAIPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAIPrompt]);

  return (
    <div style={{ border: '1px solid #d1d5db', borderRadius: '4px' }}>
      {/* Rich Text Toolbar */}
      <div style={{
        borderBottom: '1px solid #d1d5db',
        padding: '8px',
        background: '#f9fafb',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center'
      }}>
        {/* AI Toggle Button */}
        <button
          onClick={() => setAiToggle(!aiToggle)}
          style={{
            padding: '6px 12px',
            border: `2px solid ${aiToggle ? '#10b981' : '#6b7280'}`,
            borderRadius: '6px',
            background: aiToggle ? '#10b981' : '#ffffff',
            cursor: 'pointer',
            fontSize: '12px',
            color: aiToggle ? '#ffffff' : '#6b7280',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          title={aiToggle ? 'AI Enabled - Click to disable' : 'AI Disabled - Click to enable'}
        >
          🤖 AI {aiToggle ? 'ON' : 'OFF'}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }}></div>

        {/* Font Size */}
        <select
          onChange={(e) => changeFontSize(e.target.value)}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#1e40af',
            background: '#ffffff',
            cursor: 'pointer',
            minWidth: '80px'
          }}
        >
          <option value="3">Normal</option>
          <option value="1">Small</option>
          <option value="2">Medium</option>
          <option value="4">Large</option>
          <option value="5">Extra Large</option>
          <option value="6">Huge</option>
        </select>

        {/* Bold */}
        <button
          onClick={() => formatText('bold')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px'
          }}
          title="Bold"
        >
          B
        </button>

        {/* Italic */}
        <button
          onClick={() => formatText('italic')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontStyle: 'italic',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px'
          }}
          title="Italic"
        >
          I
        </button>

        {/* Underline */}
        <button
          onClick={() => formatText('underline')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px'
          }}
          title="Underline"
        >
          U
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }}></div>

        {/* Alignment */}
        <button
          onClick={() => changeAlignment('left')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            textAlign: 'left'
          }}
          title="Align Left"
        >
          ⬅
        </button>

        <button
          onClick={() => changeAlignment('center')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            textAlign: 'center'
          }}
          title="Align Center"
        >
          ↔
        </button>

        <button
          onClick={() => changeAlignment('right')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            textAlign: 'right'
          }}
          title="Align Right"
        >
          ➡
        </button>

        <button
          onClick={() => changeAlignment('full')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            textAlign: 'justify'
          }}
          title="Justify"
        >
          ⬌
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }}></div>

        {/* Clear Formatting */}
        <button
          onClick={() => formatText('removeFormat')}
          style={{
            padding: '6px 10px',
            border: '2px solid #ef4444',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#dc2626',
            minWidth: '50px'
          }}
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      
      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: value || '' }}
        onInput={(e) => onChange(e.target.innerHTML)}
        style={{
          ...style,
          padding: '12px',
          minHeight: '200px',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.5',
          backgroundColor: '#ffffff'
        }}
        placeholder={placeholder}
      />
      
      {/* AI Floating Prompt */}
      {showAIPrompt && (
        <div
          style={{
            position: 'fixed',
            left: `${promptPosition.x}px`,
            top: `${promptPosition.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 1001
          }}
        >
          <AIFloatingPrompt
            onApplySuggestion={applyAISuggestion}
            onClose={closeAIPrompt}
            selectedText={selectedText}
          />
        </div>
      )}

      {/* Debug Info */}
      {aiToggle && (
        <div style={{ 
          padding: '4px 8px', 
          fontSize: '11px', 
          color: '#6b7280', 
          background: '#f3f4f6',
          borderTop: '1px solid #d1d5db'
        }}>
          AI: {aiToggle ? 'ENABLED' : 'DISABLED'} | 
          Prompt: {showAIPrompt ? 'SHOWING' : 'HIDDEN'} | 
          Selected: {selectedText.length} chars
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 