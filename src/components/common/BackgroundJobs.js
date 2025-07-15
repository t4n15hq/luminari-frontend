// src/components/common/BackgroundJobs.js
import React, { useState } from 'react';
import { useBackgroundJobs } from '../../hooks/useBackgroundJobs';
import jsPDF from 'jspdf';

const BackgroundJobs = () => {
  const { activeJobs, completedJobs, cancelJob, clearCompleted, hasActiveJobs, hasCompletedJobs } = useBackgroundJobs();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no jobs
  if (!hasActiveJobs && !hasCompletedJobs) {
    return null;
  }

  const totalJobs = activeJobs.length + completedJobs.length;

  const formatDuration = (startTime, endTime) => {
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const downloadJobResult = (job) => {
    try {
      let content = '';
      let filename = '';
      
      if (job.type === 'regulatory_document') {
        if (job.result && job.result.document_content) {
          content = job.result.document_content;
          filename = `regulatory_document_${Date.now()}.pdf`;
        } else if (job.result && (job.result.cmc_section || job.result.clinical_section)) {
          content = `CMC SECTION:\n${job.result.cmc_section || ''}\n\nCLINICAL SECTION:\n${job.result.clinical_section || ''}`;
          filename = `regulatory_document_${Date.now()}.pdf`;
        }
      } else if (job.type === 'protocol') {
        if (job.result && job.result.protocol) {
          content = job.result.protocol;
          filename = `protocol_${job.result.protocol_id || Date.now()}.pdf`;
        }
      } else if (job.type === 'study_design') {
        if (job.result && (job.result.cmc_section || job.result.clinical_section)) {
          content = `CMC SECTION:\n${job.result.cmc_section || ''}\n\nCLINICAL SECTION:\n${job.result.clinical_section || ''}`;
          filename = `study_design_${Date.now()}.pdf`;
        }
      } else if (job.type === 'batch_regulatory') {
        if (job.result && job.result.document_content) {
          content = job.result.document_content;
          filename = `batch_regulatory_${Date.now()}.pdf`;
        }
      }
      
      if (content) {
        // Generate PDF using jsPDF
        const doc = new jsPDF();
        doc.setFont('helvetica');
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(content, 180);
        doc.text(lines, 10, 10);
        doc.save(filename);
      }
    } catch (error) {
      console.error('Error downloading job result:', error);
    }
  };

  return (
    <div className={`background-jobs ${!isExpanded ? 'collapsed' : ''}`}>
      <div className="background-jobs-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="background-jobs-title">
          <span>🔄 Background Jobs</span>
          <span className="background-jobs-count">{totalJobs}</span>
        </div>
        <button className="background-jobs-toggle">
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="background-jobs-content">
          {/* Active Jobs */}
          {hasActiveJobs && (
            <div className="background-jobs-section">
              <div className="background-jobs-section-title">
                <span>⏳</span>
                Active Jobs ({activeJobs.length})
              </div>
              <div className="background-jobs-list">
                {activeJobs.map((job) => (
                  <div key={job.id} className="background-job-item active">
                    <div className="background-job-header">
                      <div className="background-job-info">
                        <div className="background-job-type">
                          {job.type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="background-job-status">
                          Running for {formatDuration(job.startTime)}
                        </div>
                      </div>
                      <div className="background-job-actions">
                        <div className="background-job-progress">
                          <div 
                            className="background-job-progress-bar"
                            style={{ width: `${job.progress || 25}%` }}
                          />
                        </div>
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="background-job-button cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Jobs */}
          {hasCompletedJobs && (
            <div className="background-jobs-section">
              <div className="background-jobs-section-title">
                <span>✅</span>
                Completed Jobs ({completedJobs.length})
              </div>
              <div className="background-jobs-list">
                {completedJobs.slice().reverse().map((job) => (
                  <div key={job.id} className={`background-job-item ${job.status === 'completed' ? 'completed' : 'error'}`}>
                    <div className="background-job-header">
                      <div className="background-job-info">
                        <div className="background-job-type">
                          {job.type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="background-job-status">
                          {job.status === 'completed' ? '✓ Completed' : '✗ Failed'} • {formatDuration(job.startTime, job.endTime)}
                        </div>
                        {job.error && (
                          <div className="background-job-error">
                            Error: {job.error}
                          </div>
                        )}
                      </div>
                      <div className="background-job-actions">
                        {job.status === 'completed' && (
                          <button
                            onClick={() => downloadJobResult(job)}
                            className="background-job-button download"
                          >
                            📥 Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {hasCompletedJobs && (
            <button onClick={clearCompleted} className="background-jobs-clear">
              Clear Completed Jobs
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BackgroundJobs;
