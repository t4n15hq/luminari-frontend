// src/components/BackgroundJobs.js
import React, { useState } from 'react';
import { useBackgroundJobs } from '../hooks/useBackgroundJobs';

const BackgroundJobs = () => {
  const { 
    activeJobs, 
    completedJobs, 
    cancelJob, 
    clearCompleted, 
    hasActiveJobs, 
    hasCompletedJobs 
  } = useBackgroundJobs();
  
  const [isExpanded, setIsExpanded] = useState(false);

  const downloadResult = (job) => {
    if (!job.result) return;

    try {
      let content = '';
      let filename = `${job.type}_${job.data?.disease_name || 'document'}_${new Date(job.endTime).toISOString().slice(0, 10)}.txt`;

      if (job.result.document_content) {
        content = job.result.document_content;
      } else if (job.result.cmc_section && job.result.clinical_section) {
        content = `CMC SECTION:\n\n${job.result.cmc_section}\n\nCLINICAL SECTION:\n\n${job.result.clinical_section}`;
      } else if (job.result.protocol) {
        content = job.result.protocol;
        filename = `Protocol_${job.data?.disease_name || 'document'}_${new Date(job.endTime).toISOString().slice(0, 10)}.txt`;
      } else {
        content = JSON.stringify(job.result, null, 2);
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  const formatDuration = (startTime, endTime) => {
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return '⏳';
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const getJobTypeDisplayName = (type) => {
    const typeMap = {
      'regulatory_document': 'Regulatory Document',
      'protocol': 'Clinical Protocol',
      'batch_regulatory': 'Batch Regulatory'
    };
    return typeMap[type] || type;
  };

  if (!hasActiveJobs && !hasCompletedJobs) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: '1px solid #e2e8f0',
      zIndex: 1000,
      minWidth: '320px',
      maxWidth: '450px'
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: hasActiveJobs ? '#f0f9ff' : '#f8f9fa',
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🔄</span>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>
            Background Jobs
          </span>
          {hasActiveJobs && (
            <span style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {activeJobs.length}
            </span>
          )}
        </div>
        <span style={{ 
          fontSize: '12px', 
          color: '#64748b',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <div style={{ padding: '12px 16px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Running ({activeJobs.length})
              </h4>
              {activeJobs.map((job) => (
                <div key={job.id} style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  border: '1px solid #bfdbfe'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>
                      {getStatusIcon(job.status)} {getJobTypeDisplayName(job.type)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelJob(job.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px 4px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    {job.data?.disease_name || 'Processing...'}
                  </div>
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${job.progress}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    Running for {formatDuration(job.startTime)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed Jobs */}
          {completedJobs.length > 0 && (
            <div style={{ 
              padding: '12px 16px',
              borderTop: activeJobs.length > 0 ? '1px solid #e2e8f0' : 'none'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '12px', 
                  fontWeight: '600', 
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Completed ({completedJobs.length})
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCompleted();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '2px 4px'
                  }}
                >
                  Clear All
                </button>
              </div>
              
              {completedJobs.slice(-5).map((job) => ( // Show last 5 completed jobs
                <div key={job.id} style={{
                  padding: '8px 12px',
                  backgroundColor: job.status === 'completed' ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '6px',
                  marginBottom: '6px',
                  border: `1px solid ${job.status === 'completed' ? '#bbf7d0' : '#fecaca'}`
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>
                      {getStatusIcon(job.status)} {getJobTypeDisplayName(job.type)}
                    </span>
                    {job.status === 'completed' && job.result && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadResult(job);
                        }}
                        style={{
                          background: '#10b981',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        Download
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                    {job.data?.disease_name || 'Document'}
                  </div>
                  {job.error && (
                    <div style={{ fontSize: '10px', color: '#dc2626', marginBottom: '2px' }}>
                      Error: {job.error}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Completed in {formatDuration(job.startTime, job.endTime)} • {new Date(job.endTime).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BackgroundJobs;