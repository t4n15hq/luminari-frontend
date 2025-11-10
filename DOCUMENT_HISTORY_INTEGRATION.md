# Document History Integration Guide

This guide explains how to integrate the document history system into Protocol Generator, Regulatory Document Generator, and Ask Lumina components.

## Overview

The document history system allows users to:
- **Save** protocols, regulatory documents, and conversations automatically
- **View previous documents** in a popup modal
- **Search and filter** their document history
- **Star/favorite** important documents
- **Reference** past work by viewing full content

## Components Created

### 1. Backend
- **Database Schema**: Updated with `Document` and `Conversation` models
- **API Endpoints**:
  - `GET /my-documents` - Get user's documents
  - `POST /documents` - Save new document
  - `GET /my-conversations` - Get user's conversations
  - `POST /my-conversations` - Save new conversation
  - `PATCH /my-documents/:id/star` - Star/unstar document

### 2. Frontend
- **PreviousDocuments.js**: Modal component for viewing history
- **PreviousDocuments.css**: Professional styling
- **documentService.js**: Helper functions for saving/loading documents

## Integration Steps

### Protocol Generator Integration

**File**: `src/components/ProtocolGenerator.js`

**Step 1**: Add imports at the top:
```javascript
import PreviousDocuments from './common/PreviousDocuments';
import { saveProtocol } from '../services/documentService';
```

**Step 2**: Add state for modal:
```javascript
const [showPreviousDocs, setShowPreviousDocs] = useState(false);
```

**Step 3**: Add save function after protocol generation:
```javascript
const handleSaveProtocol = async () => {
  if (!protocolResult) return;

  const result = await saveProtocol({
    title: `Protocol: ${formData.disease || 'Untitled'}`,
    description: `${formData.studyType} study for ${formData.population}`,
    disease: formData.disease,
    content: protocolResult,
    formData: formData,
    studyDesign: studyDesign
  });

  if (result.success) {
    alert('Protocol saved successfully!');
  } else {
    alert('Failed to save protocol');
  }
};
```

**Step 4**: Add buttons in the UI (after the Generate Protocol button):
```javascript
<div className="protocol-actions">
  <button onClick={() => setShowPreviousDocs(true)} className="btn-secondary">
    =Á Previous Protocols
  </button>
  {protocolResult && (
    <button onClick={handleSaveProtocol} className="btn-primary">
      =¾ Save Protocol
    </button>
  )}
</div>
```

**Step 5**: Add modal component at the end of the return statement:
```javascript
<PreviousDocuments
  isOpen={showPreviousDocs}
  onClose={() => setShowPreviousDocs(false)}
  documentType="PROTOCOL"
  onSelectDocument={(doc) => {
    // Optional: Load the document's content into the form
    if (doc.formData) {
      setFormData(doc.formData);
    }
    if (doc.content) {
      setProtocolResult(doc.content);
    }
  }}
/>
```

---

### Regulatory Document Generator Integration

**File**: `src/components/UnifiedRegulatoryGenerator.js`

**Step 1**: Add imports:
```javascript
import PreviousDocuments from './common/PreviousDocuments';
import { saveRegulatoryDocument } from '../services/documentService';
```

**Step 2**: Add state:
```javascript
const [showPreviousDocs, setShowPreviousDocs] = useState(false);
```

**Step 3**: Add save function:
```javascript
const handleSaveDocument = async () => {
  if (!generatedContent) return;

  const result = await saveRegulatoryDocument({
    title: `${selectedCountry} - ${selectedDocType}`,
    description: `Regulatory document for ${disease}`,
    disease: disease,
    country: selectedCountry,
    region: selectedRegion,
    documentType: selectedDocType,
    content: generatedContent,
    sections: documentSections
  });

  if (result.success) {
    alert('Document saved successfully!');
  } else {
    alert('Failed to save document');
  }
};
```

**Step 4**: Add buttons:
```javascript
<div className="regulatory-actions">
  <button onClick={() => setShowPreviousDocs(true)} className="btn-secondary">
    =Á Previous Documents
  </button>
  {generatedContent && (
    <button onClick={handleSaveDocument} className="btn-primary">
      =¾ Save Document
    </button>
  )}
</div>
```

**Step 5**: Add modal:
```javascript
<PreviousDocuments
  isOpen={showPreviousDocs}
  onClose={() => setShowPreviousDocs(false)}
  documentType="REGULATORY"
  onSelectDocument={(doc) => {
    if (doc.content) {
      setGeneratedContent(doc.content);
    }
  }}
/>
```

---

### Ask Lumina Integration

**File**: `src/components/QueryAssistant.js`

**Step 1**: Add imports:
```javascript
import PreviousDocuments from './common/PreviousDocuments';
import { saveConversation } from '../services/documentService';
```

**Step 2**: Add state:
```javascript
const [showPreviousDocs, setShowPreviousDocs] = useState(false);
```

**Step 3**: Add save function:
```javascript
const handleSaveConversation = async () => {
  if (messages.length === 0) return;

  // Generate title from first user message
  const firstUserMsg = messages.find(m => m.role === 'user');
  const title = firstUserMsg
    ? firstUserMsg.content.substring(0, 100)
    : 'Conversation';

  const result = await saveConversation({
    title: title,
    description: `Chat with ${messages.length} messages`,
    messages: messages,
    tags: ['ask-lumina']
  });

  if (result.success) {
    alert('Conversation saved successfully!');
  } else {
    alert('Failed to save conversation');
  }
};
```

**Step 4**: Add buttons:
```javascript
<div className="chat-actions">
  <button onClick={() => setShowPreviousDocs(true)} className="btn-secondary">
    =¬ Previous Conversations
  </button>
  {messages.length > 0 && (
    <button onClick={handleSaveConversation} className="btn-primary">
      =¾ Save Conversation
    </button>
  )}
</div>
```

**Step 5**: Add modal:
```javascript
<PreviousDocuments
  isOpen={showPreviousDocs}
  onClose={() => setShowPreviousDocs(false)}
  documentType="CHAT"
  onSelectDocument={(doc) => {
    if (doc.messages) {
      setMessages(doc.messages);
    }
  }}
/>
```

---

## Auto-Save Feature (Optional)

To automatically save documents when they're generated, add this useEffect:

```javascript
useEffect(() => {
  if (protocolResult && autoSave) {
    handleSaveProtocol();
  }
}, [protocolResult]);
```

## Styling

Add these CSS classes to your component stylesheets:

```css
.protocol-actions,
.regulatory-actions,
.chat-actions {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  font-size: 14px;
  font-weight: 600;
  color: #683D94;
  background-color: white;
  border: 2px solid #683D94;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #683D94;
  color: white;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  font-size: 14px;
  font-weight: 600;
  color: white;
  background-color: #683D94;
  border: none;
  border-radius: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: #552F7A;
}
```

## Testing Checklist

- [ ] Can open "Previous Documents" modal
- [ ] Modal shows list of saved documents
- [ ] Search functionality works
- [ ] Star/unstar documents
- [ ] Click document to view details
- [ ] "Use This Document" button loads content
- [ ] Save button appears after generation
- [ ] Documents save successfully
- [ ] Can view saved documents across sessions
- [ ] Mobile responsive

## Deployment

Backend and frontend components are ready. Just:
1. Ensure backend is deployed on Render (auto-deploys from GitHub)
2. Push frontend changes to trigger Vercel deployment
3. Test on production

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify authentication token is valid
3. Check API_BASE_URL is correct
4. Ensure user is logged in before saving
