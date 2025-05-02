import React, { useState } from 'react';

const DocumentViewer = ({ 
  cmcSection, 
  clinicalSection, 
  protocolId = 'SD-1746212093234',
  version = '1.0',
  date = new Date().toLocaleDateString() 
}) => {
  const [activeTab, setActiveTab] = useState('protocol');
  
  // Transform text content to structured sections
  const renderSections = (content, prefix = '') => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const sections = [];
    
    let currentSection = null;
    let currentContent = [];
    
    lines.forEach((line, idx) => {
      // Check if this is a main section header (starts with a number followed by period)
      const sectionMatch = line.match(/^(\d+)\.[\s]+(.*)/i);
      
      if (sectionMatch) {
        // If we have a previous section, add it to the sections array
        if (currentSection) {
          sections.push({
            id: currentSection.id,
            title: currentSection.title,
            content: currentContent.join('\n')
          });
          currentContent = [];
        }
        
        // Create a new section
        currentSection = {
          id: `${prefix}-section-${sectionMatch[1]}`,
          title: line,
          heading: `${sectionMatch[1]}. ${sectionMatch[2]}`
        };
      } else if (currentSection) {
        // Add content to the current section
        currentContent.push(line);
      }
    });
    
    // Add the last section
    if (currentSection) {
      sections.push({
        id: currentSection.id,
        title: currentSection.title,
        content: currentContent.join('\n')
      });
    }
    
    return sections;
  };
  
  // Generate a table of contents
  const renderTableOfContents = (sections) => {
    if (!sections || sections.length === 0) return null;
    
    return (
      <div className="table-of-contents">
        <h4>Table of Contents</h4>
        <ul>
          {sections.map(section => (
            <li key={section.id}>
              <a href={`#${section.id}`} onClick={(e) => {
                e.preventDefault();
                document.getElementById(section.id)?.scrollIntoView({behavior: 'smooth'});
              }}>
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  // Format the content of a section with subsection styling
  const formatSectionContent = (content) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const formattedLines = [];
    
    lines.forEach((line, idx) => {
      if (!line.trim()) {
        formattedLines.push(<br key={`br-${idx}`} />);
        return;
      }
      
      if (line.match(/^[A-Z]\.[\s]+/)) {
        // Subsection header (like "A. Synthesis Route Summary:")
        formattedLines.push(
          <h5 key={`subsection-${idx}`} className="subsection-title">{line}</h5>
        );
      } else if (line.match(/^\d+\.[\s]+/)) {
        // Numbered list item
        formattedLines.push(
          <li key={`li-${idx}`}>{line}</li>
        );
      } else if (line.match(/^[-•][\s]+/)) {
        // Bullet list item
        formattedLines.push(
          <li key={`bullet-${idx}`}>{line.substring(1).trim()}</li>
        );
      } else {
        // Regular paragraph
        formattedLines.push(
          <p key={`p-${idx}`}>{line}</p>
        );
      }
    });
    
    return formattedLines;
  };
  
  // Process the sections
  const cmcSections = renderSections(cmcSection, 'cmc');
  const clinicalSections = renderSections(clinicalSection, 'clinical');
  
  return (
    <div className="document-viewer">
      <div className="document-tabs">
        <button 
          className={`tab-btn ${activeTab === 'protocol' ? 'active' : ''}`}
          onClick={() => setActiveTab('protocol')}
        >
          Protocol
        </button>
        <button 
          className={`tab-btn ${activeTab === 'study-design' ? 'active' : ''}`}
          onClick={() => setActiveTab('study-design')}
        >
          Study Design
        </button>
      </div>
      
      {activeTab === 'study-design' && (
        <div className="document-content">
          <div className="document-header">
            <h3>Study Design (Main Document)</h3>
            <div className="document-meta">
              <span>Study ID: {protocolId}</span>
              <span>Version: {version}</span>
              <span>Date: {date}</span>
            </div>
          </div>
          
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'cmc' ? 'active' : ''}`}
              onClick={() => setActiveTab('cmc')}
            >
              CMC Section
            </button>
            <button 
              className={`tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinical')}
            >
              Clinical Section
            </button>
          </div>
          
          {activeTab === 'cmc' && (
            <div className="cmc-section">
              <div className="main-document-section">
                <h2 className="main-document-section-title">Chemistry, Manufacturing, and Controls (CMC)</h2>
              </div>
              
              {renderTableOfContents(cmcSections)}
              
              {cmcSections && cmcSections.map(section => (
                <div key={section.id} id={section.id}>
                  <h3 className="section-title">{section.title}</h3>
                  <div className="section-content">
                    {formatSectionContent(section.content)}
                  </div>
                </div>
              ))}
              
              <div className="copy-buttons">
                <button className="copy-button" onClick={() => navigator.clipboard.writeText(cmcSection)}>
                  Copy Current Section
                </button>
                <button className="copy-button" onClick={() => navigator.clipboard.writeText(cmcSection + '\n\n' + clinicalSection)}>
                  Copy All
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'clinical' && (
            <div className="clinical-section">
              <div className="main-document-section">
                <h2 className="main-document-section-title">Clinical Pharmacology Section</h2>
              </div>
              
              {renderTableOfContents(clinicalSections)}
              
              {clinicalSections && clinicalSections.map(section => (
                <div key={section.id} id={section.id}>
                  <h3 className="section-title">{section.title}</h3>
                  <div className="section-content">
                    {formatSectionContent(section.content)}
                  </div>
                </div>
              ))}
              
              <div className="copy-buttons">
                <button className="copy-button" onClick={() => navigator.clipboard.writeText(clinicalSection)}>
                  Copy Current Section
                </button>
                <button className="copy-button" onClick={() => navigator.clipboard.writeText(cmcSection + '\n\n' + clinicalSection)}>
                  Copy All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'protocol' && (
        <div className="document-content">
          <div className="document-header">
            <h3>Protocol</h3>
            <div className="document-meta">
              <span>Protocol ID: PROT-{protocolId.substring(3)}</span>
              <span>Version: {version}</span>
              <span>Date: {date}</span>
            </div>
          </div>
          
          {/* Protocol content would go here */}
          <p>Protocol content would be displayed here...</p>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;