import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PreviousDocuments.css';

const API_BASE_URL = process.env.REACT_APP_DOCUMENTS_API_URL || 'https://luminari-be.onrender.com';

const PreviousDocuments = ({ isOpen, onClose, documentType, onSelectDocument }) => {
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStarred, setFilterStarred] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen, documentType, filterStarred]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');

      if (documentType === 'CHAT') {
        // Fetch conversations for Ask Lumina
        const params = new URLSearchParams();
        if (filterStarred) params.append('starred', 'true');

        const response = await axios.get(`${API_BASE_URL}/my-conversations?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations(response.data);
      } else {
        // Fetch documents
        const params = new URLSearchParams();
        if (documentType) params.append('type', documentType);
        if (filterStarred) params.append('starred', 'true');

        const response = await axios.get(`${API_BASE_URL}/my-documents?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocuments(response.data);
      }
    } catch (err) {
      console.error('Fetch documents error:', err);
      setError('Failed to load previous documents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = documentType === 'CHAT'
        ? `/my-conversations/${doc.id}`
        : `/my-documents/${doc.id}`;

      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedDoc(response.data);
      setViewMode('detail');
    } catch (err) {
      console.error('View document error:', err);
      setError('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (doc, e) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem('authToken');
      const endpoint = documentType === 'CHAT'
        ? `/my-conversations/${doc.id}/star`
        : `/my-documents/${doc.id}/star`;

      await axios.patch(
        `${API_BASE_URL}${endpoint}`,
        { starred: !doc.starred },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchDocuments();
    } catch (err) {
      console.error('Toggle star error:', err);
    }
  };

  const handleSelectDocument = (doc) => {
    if (onSelectDocument) {
      onSelectDocument(doc);
      onClose();
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDoc(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      'PROTOCOL': 'Protocol',
      'STUDY_DESIGN': 'Study Design',
      'REGULATORY': 'Regulatory Document',
      'CHAT': 'Conversation',
      'OTHER': 'Document'
    };
    return labels[type] || type;
  };

  const filteredItems = documentType === 'CHAT'
    ? conversations.filter(conv =>
        !searchTerm ||
        conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : documents.filter(doc =>
        !searchTerm ||
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.disease?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  if (!isOpen) return null;

  return (
    <div className="previous-docs-overlay" onClick={onClose}>
      <div className="previous-docs-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="previous-docs-header">
          <h2>
            {viewMode === 'list'
              ? `Previous ${getDocumentTypeLabel(documentType)}s`
              : 'Document Details'}
          </h2>
          <button onClick={onClose} className="previous-docs-close">◊</button>
        </div>

        {error && (
          <div className="previous-docs-error">
            {error}
          </div>
        )}

        {viewMode === 'list' ? (
          <>
            {/* Search and Filters */}
            <div className="previous-docs-controls">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="previous-docs-search"
              />
              <label className="previous-docs-filter">
                <input
                  type="checkbox"
                  checked={filterStarred}
                  onChange={(e) => setFilterStarred(e.target.checked)}
                />
                <span>P Starred only</span>
              </label>
            </div>

            {/* Document List */}
            <div className="previous-docs-list">
              {loading ? (
                <div className="previous-docs-loading">Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div className="previous-docs-empty">
                  No {filterStarred ? 'starred ' : ''}documents found
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="previous-doc-item"
                    onClick={() => handleViewDocument(item)}
                  >
                    <div className="previous-doc-header">
                      <div className="previous-doc-title-row">
                        <h3 className="previous-doc-title">{item.title}</h3>
                        <button
                          className={`previous-doc-star ${item.starred ? 'starred' : ''}`}
                          onClick={(e) => handleToggleStar(item, e)}
                        >
                          {item.starred ? 'P' : ''}
                        </button>
                      </div>
                      {item.description && (
                        <p className="previous-doc-description">{item.description}</p>
                      )}
                    </div>
                    <div className="previous-doc-meta">
                      {item.disease && (
                        <span className="previous-doc-tag">{item.disease}</span>
                      )}
                      {item.country && (
                        <span className="previous-doc-tag">{item.country}</span>
                      )}
                      {item.documentType && (
                        <span className="previous-doc-tag">{item.documentType}</span>
                      )}
                      <span className="previous-doc-date">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Document Detail View */}
            <div className="previous-doc-detail">
              <button onClick={handleBackToList} className="previous-doc-back">
                ê Back to List
              </button>

              {loading ? (
                <div className="previous-docs-loading">Loading...</div>
              ) : selectedDoc ? (
                <>
                  <div className="previous-doc-detail-header">
                    <h3>{selectedDoc.title}</h3>
                    <button
                      className={`previous-doc-star-btn ${selectedDoc.starred ? 'starred' : ''}`}
                      onClick={(e) => handleToggleStar(selectedDoc, e)}
                    >
                      {selectedDoc.starred ? 'P Starred' : ' Star'}
                    </button>
                  </div>

                  {selectedDoc.description && (
                    <p className="previous-doc-detail-desc">{selectedDoc.description}</p>
                  )}

                  <div className="previous-doc-detail-meta">
                    <span>Created: {new Date(selectedDoc.createdAt).toLocaleString()}</span>
                    {selectedDoc.disease && <span>Disease: {selectedDoc.disease}</span>}
                    {selectedDoc.country && <span>Country: {selectedDoc.country}</span>}
                  </div>

                  {documentType === 'CHAT' ? (
                    <div className="previous-doc-messages">
                      {Array.isArray(selectedDoc.messages) && selectedDoc.messages.map((msg, idx) => (
                        <div key={idx} className={`previous-doc-message ${msg.role}`}>
                          <div className="previous-doc-message-role">{msg.role}</div>
                          <div className="previous-doc-message-content">{msg.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="previous-doc-content">
                      <pre>{selectedDoc.content}</pre>
                    </div>
                  )}

                  {onSelectDocument && (
                    <button
                      onClick={() => handleSelectDocument(selectedDoc)}
                      className="previous-doc-use-btn"
                    >
                      Use This Document
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreviousDocuments;
