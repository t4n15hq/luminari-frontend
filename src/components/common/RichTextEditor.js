import React, { useRef, useState, useEffect, useCallback } from 'react';
import AIFloatingPrompt from './AIFloatingPrompt';

const RichTextEditor = ({ value, onChange, placeholder, style, aiEnabled = false }) => {
  const editorRef = useRef(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [promptPosition, setPromptPosition] = useState({ x: 0, y: 0 });
  const [aiPromptEnabled, setAiPromptEnabled] = useState(aiEnabled);
  const [editorContent, setEditorContent] = useState(value);

  // Update editor content when value prop changes
  useEffect(() => {
    setEditorContent(value);
  }, [value]);

  // Update aiPromptEnabled when aiEnabled prop changes
  useEffect(() => {
    setAiPromptEnabled(aiEnabled);
  }, [aiEnabled]);

  // Simple formatting functions using execCommand
  const execCommand = (command, value = null) => {
    editorRef.current.focus();
    
    // If no text is selected, select all text
    const selection = window.getSelection();
    if (!selection.toString()) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // Get the updated content
    const newContent = editorRef.current.innerHTML;
    setEditorContent(newContent);
    onChange(newContent);
  };

  // Formatting functions
  const makeBold = () => execCommand('bold');
  const makeItalic = () => execCommand('italic');
  const makeUnderline = () => execCommand('underline');
  
  const changeFontSize = (size) => {
    const fontSizeMap = {
      '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7'
    };
    execCommand('fontSize', fontSizeMap[size] || '3');
  };

  const alignText = (alignment) => {
    execCommand(`justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`);
  };

  const insertList = (type) => {
    const command = type === 'Unordered' ? 'insertUnorderedList' : 'insertOrderedList';
    execCommand(command);
  };

  const clearFormatting = () => execCommand('removeFormat');

  // Handle text selection for AI prompt
  const handleSelection = useCallback(() => {
    if (!aiPromptEnabled) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0 && selection.rangeCount > 0) {
      setSelectedText(selectedText);
      
      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Calculate position
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = rect.left + rect.width / 2;
      let y = rect.top - 10;
      
      // Ensure prompt doesn't go off-screen
      if (x < 150) x = 150;
      if (x > viewportWidth - 150) x = viewportWidth - 150;
      if (y < 200) y = rect.bottom + 10;
      if (y > viewportHeight - 300) y = viewportHeight - 300;
      
      setPromptPosition({ x, y });
      setShowAIPrompt(true);
    } else {
      setShowAIPrompt(false);
    }
  }, [aiPromptEnabled]);

  // Apply AI suggestion
  const applyAISuggestion = useCallback((suggestion) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(suggestion));
      
      const newContent = editorRef.current.innerHTML;
      setEditorContent(newContent);
      onChange(newContent);
    }
    
    setShowAIPrompt(false);
    setSelectedText('');
    editorRef.current.focus();
  }, [onChange]);

  // Close AI prompt
  const closeAIPrompt = useCallback(() => {
    setShowAIPrompt(false);
    setSelectedText('');
  }, []);

  // Handle input changes
  const handleInput = (e) => {
    const newContent = e.target.innerHTML;
    setEditorContent(newContent);
    onChange(newContent);
  };

  // Add event listeners for AI
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && aiPromptEnabled) {
      const handleMouseUp = () => {
        setTimeout(() => handleSelection(), 100);
      };
      
      editor.addEventListener('mouseup', handleMouseUp);
      return () => editor.removeEventListener('mouseup', handleMouseUp);
    }
  }, [aiPromptEnabled, handleSelection]);

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
  }, [showAIPrompt, closeAIPrompt]);

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
            minWidth: '80px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
          onClick={makeBold}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#eff6ff'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Bold"
        >
          B
        </button>

        {/* Italic */}
        <button
          onClick={makeItalic}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontStyle: 'italic',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#eff6ff'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Italic"
        >
          I
        </button>

        {/* Underline */}
        <button
          onClick={makeUnderline}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#eff6ff'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Underline"
        >
          U
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }}></div>

        {/* Alignment */}
        <button
          onClick={() => alignText('left')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#eff6ff'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Align Left"
        >
          ⬅
        </button>

        <button
          onClick={() => alignText('center')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#eff6ff'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Align Center"
        >
          ↔
        </button>

        <button
          onClick={() => alignText('right')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#eff6ff'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Align Right"
        >
          ➡
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }}></div>

        {/* Lists */}
        <button
          onClick={() => insertList('Unordered')}
          style={{
            padding: '6px 10px',
            border: '2px solid #3b82f6',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#1e40af',
            minWidth: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#eff6ff'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Bullet List"
        >
          •
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }}></div>

        {/* AI Prompt Toggle */}
        {aiEnabled && (
          <button
            onClick={() => setAiPromptEnabled(!aiPromptEnabled)}
            style={{
              padding: '6px 10px',
              border: `2px solid ${aiPromptEnabled ? '#10b981' : '#3b82f6'}`,
              borderRadius: '6px',
              background: aiPromptEnabled ? '#d1fae5' : '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              color: aiPromptEnabled ? '#065f46' : '#1e40af',
              minWidth: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.background = aiPromptEnabled ? '#a7f3d0' : '#eff6ff'}
            onMouseOut={(e) => e.target.style.background = aiPromptEnabled ? '#d1fae5' : '#ffffff'}
            title={aiPromptEnabled ? 'AI Enabled - Click to disable' : 'AI Disabled - Click to enable'}
          >
            🤖 AI
          </button>
        )}

        {/* Clear Formatting */}
        <button
          onClick={clearFormatting}
          style={{
            padding: '6px 10px',
            border: '2px solid #ef4444',
            borderRadius: '6px',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#dc2626',
            minWidth: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.target.style.background = '#fef2f2'}
          onMouseOut={(e) => e.target.style.background = '#ffffff'}
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      
      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: editorContent }}
        onInput={handleInput}
        style={{
          ...style,
          padding: '12px',
          minHeight: '200px',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '14px',
          lineHeight: '1.5',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          backgroundColor: '#ffffff'
        }}
        placeholder={placeholder}
      />
      
      {/* AI Floating Prompt */}
      {showAIPrompt && (
        <div
          className="ai-prompt-container"
          style={{
            position: 'fixed',
            left: `${promptPosition.x}px`,
            top: `${promptPosition.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 10001
          }}
        >
          <AIFloatingPrompt
            onApplySuggestion={applyAISuggestion}
            onClose={closeAIPrompt}
            selectedText={selectedText}
          />
        </div>
      )}
      
      {/* Debug info */}
      {aiPromptEnabled && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          background: '#f0f0f0', 
          padding: '5px', 
          fontSize: '12px',
          zIndex: 1000,
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          AI: {aiPromptEnabled ? 'ON' : 'OFF'} | 
          Prompt: {showAIPrompt ? 'SHOWING' : 'HIDDEN'} | 
          Selected: {selectedText.length} chars
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 