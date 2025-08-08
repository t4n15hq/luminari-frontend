import React, { useRef, useState, useEffect } from 'react';
import AIFloatingPrompt from './AIFloatingPrompt';

const RichTextEditor = ({ value, onChange, placeholder, style, aiEnabled = false }) => {
  const editorRef = useRef(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [promptPosition, setPromptPosition] = useState({ x: 0, y: 0 });
  const [aiPromptEnabled, setAiPromptEnabled] = useState(aiEnabled);

  // Update aiPromptEnabled when aiEnabled prop changes
  useEffect(() => {
    setAiPromptEnabled(aiEnabled);
  }, [aiEnabled]);

  // Simple formatting functions
  const formatText = (command) => {
    console.log('formatText called with:', command);
    
    // Focus the editor
    editorRef.current.focus();
    
    // Execute the command
    const success = document.execCommand(command, false, null);
    console.log('Command execution result:', success);
    
    // Update the content
    const newContent = editorRef.current.innerHTML;
    console.log('New content:', newContent);
    onChange(newContent);
  };

  const changeFontSize = (size) => {
    console.log('changeFontSize called with:', size);
    editorRef.current.focus();
    document.execCommand('fontSize', false, size);
    onChange(editorRef.current.innerHTML);
  };

  const changeAlignment = (align) => {
    console.log('changeAlignment called with:', align);
    editorRef.current.focus();
    
    let command = '';
    switch (align) {
      case 'left':
        command = 'justifyLeft';
        break;
      case 'center':
        command = 'justifyCenter';
        break;
      case 'right':
        command = 'justifyRight';
        break;
      default:
        command = 'justifyLeft';
    }
    
    document.execCommand(command, false, null);
    onChange(editorRef.current.innerHTML);
  };

  const insertList = (type) => {
    console.log('insertList called with:', type);
    editorRef.current.focus();
    
    if (type === 'Unordered') {
      document.execCommand('insertUnorderedList', false, null);
    } else {
      document.execCommand('insertOrderedList', false, null);
    }
    
    onChange(editorRef.current.innerHTML);
  };

  // Handle text selection for AI prompt
  const handleSelection = () => {
    if (!aiPromptEnabled) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('Selection detected:', selectedText);
    
    if (selectedText.length > 0 && selection.rangeCount > 0) {
      setSelectedText(selectedText);
      
      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position the prompt above the selection
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
    console.log('Applying AI suggestion:', suggestion);
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(suggestion));
      
      // Update content
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

  // Add event listeners for AI
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && aiPromptEnabled) {
      console.log('Adding AI event listeners');
      editor.addEventListener('mouseup', handleSelection);
      editor.addEventListener('keyup', handleSelection);
      
      return () => {
        console.log('Removing AI event listeners');
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
        onInput={(e) => {
          console.log('Editor input detected:', e.target.innerHTML);
          onChange(e.target.innerHTML);
        }}
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
          console.log('Editor focused');
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