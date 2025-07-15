import React from 'react';

const DocumentViewer = ({ open, onClose, title, content, metadata }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '10px',
        maxWidth: '700px',
        width: '90vw',
        maxHeight: '80vh',
        padding: '2rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#4299e1', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' }}>Close</button>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {metadata && (
          <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.95em' }}>
            {Object.entries(metadata).map(([k, v]) => v && <span key={k} style={{ marginRight: 12 }}><strong>{k}:</strong> {v}</span>)}
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1.05em', color: '#22223b' }}>
          {content}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;