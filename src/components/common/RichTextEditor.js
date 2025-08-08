import React, { useRef, useState, useEffect } from 'react';
import AIFloatingPrompt from './AIFloatingPrompt';

const RichTextEditor = ({ value, onChange, placeholder, style, aiEnabled = false }) => {
  const editorRef = useRef(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [promptPosition, setPromptPosition] = useState({ x: 0, y: 0 });
  const [currentRange, setCurrentRange] = useState(null);
  const [aiPromptEnabled, setAiPromptEnabled] = useState(aiEnabled);

  // Update aiPromptEnabled when aiEnabled prop changes
  useEffect(() => {
    setAiPromptEnabled(aiEnabled);
  }, [aiEnabled]);

  // Helper function to get current selection
  const getCurrentSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  // Helper function to save current selection
  const saveSelection = () => {
    const range = getCurrentSelection();
    if (range) {
      setCurrentRange(range.cloneRange());
    }
  };

  // Helper function to restore selection
  const restoreSelection = () => {
    if (currentRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(currentRange);
    }
  };

  // Rich text formatting functions
  const formatText = (command) => {
    console.log('formatText called with:', command);
    editorRef.current.focus();
    saveSelection();
    restoreSelection();
    
    switch (command) {
      case 'bold':
        console.log('Executing bold command');
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        console.log('Executing italic command');
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        console.log('Executing underline command');
        document.execCommand('underline', false, null);
        break;
      case 'removeFormat':
        console.log('Executing removeFormat command');
        document.execCommand('removeFormat', false, null);
        break;
      default:
        console.log('Executing default command:', command);
        document.execCommand(command, false, null);
    }
    
    console.log('Editor content after formatting:', editorRef.current.innerHTML);
    onChange(editorRef.current.innerHTML);
    editorRef.current.focus();
  };

  const changeFontSize = (size) => {
    editorRef.current.focus();
    saveSelection();
    restoreSelection();
    document.execCommand('fontSize', false, size);
    onChange(editorRef.current.innerHTML);
    editorRef.current.focus();
  };

  const changeAlignment = (align) => {
    editorRef.current.focus();
    saveSelection();
    restoreSelection();
    
    switch (align) {
      case 'left':
        document.execCommand('justifyLeft', false, null);
        break;
      case 'center':
        document.execCommand('justifyCenter', false, null);
        break;
      case 'right':
        document.execCommand('justifyRight', false, null);
        break;
      default:
        document.execCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`, false, null);
    }
    
    onChange(editorRef.current.innerHTML);
    editorRef.current.focus();
  };

  const insertList = (type) => {
    editorRef.current.focus();
    saveSelection();
    restoreSelection();
    
    if (type === 'Unordered') {
      document.execCommand('insertUnorderedList', false, null);
    } else {
      document.execCommand('insertOrderedList', false, null);
    }
    
    onChange(editorRef.current.innerHTML);
    editorRef.current.focus();
  };

  // Handle text selection for AI prompt
  const handleSelection = () => {
    if (!aiPromptEnabled) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0 && selection.rangeCount > 0) {
      setSelectedText(selectedText);
      
      // Store the current range for later use
      const range = selection.getRangeAt(0);
      setCurrentRange(range.cloneRange());
      
      // Get selection position
      const rect = range.getBoundingClientRect();
      
      // Position the prompt above the selection
      setPromptPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      
      setShowAIPrompt(true);
    } else {
      setShowAIPrompt(false);
      setCurrentRange(null);
    }
  };

  // Apply AI suggestion
  const applyAISuggestion = (suggestion) => {
    if (currentRange) {
      // Clear the current selection
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(currentRange);
      
      // Apply the new text
      currentRange.deleteContents();
      currentRange.insertNode(document.createTextNode(suggestion));
      
      // Trigger onChange with updated content
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      
      // Clear the range and close prompt
      setCurrentRange(null);
      setShowAIPrompt(false);
      setSelectedText('');
      
      // Keep focus on the editor
      editorRef.current.focus();
    }
  };

  // Close AI prompt
  const closeAIPrompt = () => {
    setShowAIPrompt(false);
    setSelectedText('');
    setCurrentRange(null);
  };

  // Add event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && aiPromptEnabled) {
      editor.addEventListener('mouseup', handleSelection);
      editor.addEventListener('keyup', handleSelection);
      
      return () => {
        editor.removeEventListener('mouseup', handleSelection);
        editor.removeEventListener('keyup', handleSelection);
      };
    }
  }, [aiPromptEnabled]);

  // Handle clicks outside to close prompt
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAIPrompt && !event.target.closest('.ai-prompt-container')) {
        closeAIPrompt();
      }
    };

    if (showAIPrompt) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
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

        {/* AI Prompt Toggle - Only show if aiEnabled prop is true */}
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
            title="Toggle AI Prompt"
          >
            🤖 AI
          </button>
        )}

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
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(e) => onChange(e.target.innerHTML)}
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
        onFocus={(e) => {
          // Ensure cursor is at the end when focusing
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(e.target);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }}
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
    </div>
  );
};

export default RichTextEditor; 