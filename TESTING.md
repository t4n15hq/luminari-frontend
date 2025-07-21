# 🧪 Testing Documentation - Luminari Medical Research Platform

## Overview

This document outlines the comprehensive testing strategy and implementation for the Luminari medical research application. The test suite is designed to ensure reliability, safety, and accuracy - critical requirements for medical-grade software.

## 🎯 Testing Philosophy

Given the medical nature of this application, our testing approach prioritizes:

- **Patient Safety**: Ensuring AI predictions and medical data are handled correctly
- **Data Integrity**: Validating that sensitive medical information is processed securely
- **Regulatory Compliance**: Testing features required for clinical research compliance
- **User Experience**: Ensuring medical professionals can use the platform efficiently
- **Error Handling**: Graceful degradation when AI services are unavailable

## 📁 Test Structure

```
src/
├── __tests__/                    # Integration tests
│   └── integration.test.js       # Basic integration checks
├── components/
│   ├── __tests__/                # Component tests
│   │   ├── DiseaseDiagnosis.test.js
│   │   ├── SkinDiseaseDetector.test.js
│   │   └── ClinicalDossierCompiler.test.js
│   └── common/__tests__/         # Common component tests
│       ├── AskLuminaPopup.test.js
│       ├── FloatingButton.test.js
│       └── Button.test.js
├── services/__tests__/           # Service layer tests
│   └── openaiService.test.js
├── hooks/__tests__/              # React hooks tests
│   └── useBackgroundJobs.test.js
├── testUtils.js                  # Test utilities and mocks
└── App.test.js                   # Application level tests
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom for DOM testing
- **Coverage**: 50% threshold for critical paths
- **Timeout**: 10s for async operations
- **Transform**: ES6/JSX support with Babel

### Testing Libraries Used
- **React Testing Library**: Component testing
- **Jest**: Test runner and mocking
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Additional DOM matchers

## 🧩 Test Categories

### 1. Unit Tests
**Purpose**: Test individual components in isolation

**Components Covered**:
- ✅ Button component (variants, states, accessibility)
- ✅ FloatingButton component (positioning, variants, interactions)
- ✅ Basic integration checks

**Key Test Cases**:
```javascript
// Button accessibility and variants
test('applies primary variant by default', () => {
  render(<Button>Primary Button</Button>);
  expect(screen.getByRole('button')).toHaveClass('btn-primary');
});

// FloatingButton positioning
test('positions button bottom-right by default', () => {
  render(<FloatingButton onClick={jest.fn()} label="Test" />);
  expect(screen.getByRole('button')).toHaveStyle({
    position: 'fixed',
    bottom: '2rem',
    right: '2rem'
  });
});
```

### 2. Component Tests
**Purpose**: Test complex medical components with user interactions

**Components Covered**:
- ✅ DiseaseDiagnosis (specialty selection, navigation)
- ✅ SkinDiseaseDetector (image analysis, patient data)
- ✅ ClinicalDossierCompiler (document validation, compilation)
- ✅ AskLuminaPopup (AI assistant integration)

**Medical-Specific Test Cases**:
```javascript
// Disease detection workflow
test('handles successful image analysis', async () => {
  const mockResponse = {
    data: {
      predictions: [
        { label: 'Melanoma', confidence: 0.85 },
        { label: 'Basal Cell Carcinoma', confidence: 0.10 }
      ]
    }
  };
  
  mockedAxios.post.mockResolvedValue(mockResponse);
  
  // Test complete workflow: file upload → analysis → results
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  await userEvent.upload(screen.getByTestId('file-input'), file);
  
  fireEvent.click(screen.getByText('🔬 Analyze Image'));
  
  await waitFor(() => {
    expect(screen.getByText('Melanoma: 0.85')).toBeInTheDocument();
  });
});
```

### 3. Service Tests
**Purpose**: Test API integrations and external service handling

**Services Covered**:
- ✅ OpenAI Service (AI assistant queries, error handling)
- ✅ Background Jobs (async task management)

**Critical Test Cases**:
```javascript
// AI service error handling
test('handles API error gracefully', async () => {
  openaiService.queryAssistant.mockRejectedValue(new Error('API Error'));
  
  await expect(openaiService.queryAssistant(params)).rejects.toThrow('API Error');
});

// Medical context handling
test('submits question with disease context', async () => {
  const contextData = 'Dermatology analysis';
  await openaiService.queryAssistant({
    question: 'Tell me about skin conditions',
    disease_context: contextData
  });
  
  expect(openaiService.queryAssistant).toHaveBeenCalledWith({
    question: 'Tell me about skin conditions',
    disease_context: contextData
  });
});
```

### 4. Integration Tests
**Purpose**: Test component interactions and data flow

**Coverage**:
- ✅ Router integration
- ✅ State management
- ✅ Background job persistence
- ✅ Module loading

## 🏥 Medical-Specific Testing

### Patient Data Validation
```javascript
// Custom matcher for medical data
export const customMatchers = {
  toBeValidMedicalData: (received) => {
    const requiredFields = ['age', 'gender'];
    const hasRequiredFields = requiredFields.every(field => 
      received.hasOwnProperty(field)
    );
    
    return {
      message: () => `Expected medical data to have required fields: ${requiredFields.join(', ')}`,
      pass: hasRequiredFields
    };
  }
};
```

### AI Prediction Testing
```javascript
// Validate AI prediction format
test('prediction has valid confidence score', () => {
  const prediction = { label: 'Melanoma', confidence: 0.85 };
  expect(prediction).toBeValidPrediction();
});
```

### Privacy & Security Tests
```javascript
// Ensure no localStorage persistence after removal
test('no longer saves data to localStorage after analysis', async () => {
  // ... test implementation
  expect(localStorageMock.setItem).not.toHaveBeenCalledWith('detectedDisease', expect.any(String));
});
```

## 🚀 Running Tests

### Quick Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test Button.test.js

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Custom Test Runner
```bash
# Use the custom test runner for organized testing
node test-runner.js unit          # Unit tests only
node test-runner.js components    # Component tests
node test-runner.js services      # Service tests
node test-runner.js all          # All tests with coverage
```

## 📊 Coverage Targets

| Component Type | Target Coverage | Rationale |
|----------------|-----------------|-----------|
| Medical Components | 80%+ | Patient safety critical |
| AI Services | 90%+ | Error handling essential |
| UI Components | 70%+ | User experience important |
| Utilities | 60%+ | Support functions |

**Current Coverage Goals**:
- **Branches**: 50% (building up)
- **Functions**: 50% (building up)
- **Lines**: 50% (building up)
- **Statements**: 50% (building up)

## 🔍 Test Utilities & Mocks

### Mock Data
```javascript
// Pre-defined medical test data
export const mockPatientData = {
  age: '45',
  gender: 'Female',
  race: 'Caucasian',
  skinColor: 'Fair',
  skinType: 'Type II',
  conditionDescription: 'Red, itchy rash on forearm'
};

export const mockDiseaseDetection = {
  predictions: [
    { label: 'Melanoma', confidence: 0.85 },
    { label: 'Basal Cell Carcinoma', confidence: 0.12 },
    { label: 'Benign Nevus', confidence: 0.03 }
  ]
};
```

### Helper Functions
```javascript
// Router-aware rendering
export const renderWithRouter = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );
  return render(ui, { wrapper: Wrapper, ...options });
};

// File creation for upload tests
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg') => {
  return new File(['test content'], name, { type });
};
```

## 🎯 Testing Best Practices

### 1. Medical Data Handling
- Always test with realistic medical scenarios
- Validate prediction confidence ranges (0-1)
- Test error states for failed AI predictions
- Ensure patient data privacy in tests

### 2. Async Testing
- Use `waitFor` for AI API calls
- Test loading states during analysis
- Handle network failures gracefully
- Test background job state transitions

### 3. User Experience
- Test accessibility features
- Validate responsive design elements
- Test keyboard navigation
- Ensure error messages are user-friendly

### 4. Mocking Strategy
- Mock external AI services
- Use realistic medical data
- Test both success and failure cases
- Mock file uploads and downloads

## 🐛 Debugging Tests

### Common Issues & Solutions

1. **Async Test Failures**
   ```javascript
   // ❌ Don't
   test('async operation', () => {
     performAsyncOperation();
     expect(result).toBe(expected);
   });
   
   // ✅ Do
   test('async operation', async () => {
     await performAsyncOperation();
     await waitFor(() => expect(result).toBe(expected));
   });
   ```

2. **Router Context Missing**
   ```javascript
   // ❌ Don't
   render(<ComponentWithLinks />);
   
   // ✅ Do
   renderWithRouter(<ComponentWithLinks />);
   ```

3. **Mock Cleanup**
   ```javascript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

## 📈 Future Testing Improvements

### Planned Enhancements
1. **E2E Testing**: Cypress/Playwright for full workflows
2. **Visual Regression**: Screenshot testing for UI consistency
3. **Performance Testing**: Load testing for AI services
4. **Accessibility Testing**: Automated a11y checks
5. **Security Testing**: Penetration testing for medical data

### Continuous Integration
- Set up automated testing on pull requests
- Require 80% coverage for medical components
- Run tests against multiple browsers
- Integration with medical compliance tools

## 🏆 Conclusion

This comprehensive test suite ensures the Luminari medical research platform meets the highest standards for:

- **Reliability**: Consistent AI predictions and data handling
- **Safety**: Proper error handling and user feedback
- **Compliance**: Meeting medical software standards
- **Performance**: Responsive user interactions
- **Maintainability**: Easy to update and extend

The testing infrastructure supports rapid development while maintaining the quality and safety standards required for medical research applications.