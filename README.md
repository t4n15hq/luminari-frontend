# LumiPath™ - AI-driven Clinical Tools Platform

## Background Generation Feature

### Overview
LumiPath now includes a robust background processing system that allows users to generate regulatory documents and protocols without blocking the UI. Users can navigate away from the generation page, switch tabs, or even close the browser while generation continues in the background.

### Features

#### 1. Regulatory Document Generation (Single & Batch)
- **Single Document Generation**: Generate individual regulatory documents (IND, NDA, BLA, etc.) in the background
- **Batch Document Generation**: Generate multiple regulatory documents simultaneously for different countries/regions
- **Background Processing**: All generation tasks run in the background, allowing users to continue using the application
- **Progress Tracking**: Real-time progress updates and status monitoring
- **Result Persistence**: Generated documents are saved and can be downloaded even after page refresh

#### 2. Protocol Generation
- **Enhanced Protocol Generation**: Generate comprehensive clinical study protocols with background processing
- **Study Design Generation**: Simultaneously generate both protocol and study design documents
- **Non-blocking UI**: Users can navigate freely while generation is in progress
- **Download Results**: Download generated protocols and study designs directly from the background jobs panel

#### 3. Background Jobs Management
- **Real-time Status**: Monitor active and completed jobs in a floating panel
- **Job Control**: Cancel running jobs, download completed results
- **Persistent Storage**: Job status and results are saved in localStorage
- **Cross-tab Support**: Background jobs continue running even when switching browser tabs

### How to Use

#### Starting a Background Generation
1. Navigate to the desired generator (Regulatory Documents or Protocol Generator)
2. Fill in the required form fields
3. Click "Generate" - the job will start in the background
4. You can now navigate to other pages, switch tabs, or continue using the application
5. Monitor progress through the Background Jobs panel (bottom-right corner)

#### Managing Background Jobs
- **View Jobs**: Click the "Background Jobs" panel to expand and see all active/completed jobs
- **Cancel Jobs**: Click "Cancel" on any active job to stop generation
- **Download Results**: Click "Download" on completed jobs to save the generated document
- **Clear History**: Use "Clear Completed Jobs" to remove completed jobs from the list

#### Batch Processing
1. Navigate to "Batch Regulatory Generator"
2. Select multiple documents and countries
3. Fill in the form data
4. Click "Start Batch Processing"
5. All documents will be generated in parallel in the background
6. Monitor progress and download individual results as they complete

### Technical Implementation

#### Background Processing Service
- **Service**: `src/services/backgroundService.js`
- **Hook**: `src/hooks/useBackgroundJobs.js`
- **Component**: `src/components/common/BackgroundJobs.js`

#### Key Features
- **Job Queue Management**: Handles multiple concurrent jobs
- **Progress Tracking**: Real-time progress updates
- **Error Handling**: Graceful error handling and recovery
- **Persistence**: localStorage-based job persistence
- **Cross-tab Communication**: Jobs continue across browser tabs

#### Supported Job Types
- `regulatory_document`: Single regulatory document generation
- `batch_regulatory`: Batch regulatory document generation
- `protocol`: Protocol generation
- `study_design`: Study design generation

### Benefits

1. **Improved User Experience**: No more waiting for long generation tasks
2. **Increased Productivity**: Users can work on other tasks while documents generate
3. **Reliability**: Generation continues even if users navigate away
4. **Flexibility**: Support for both single and batch processing
5. **Transparency**: Clear status updates and progress tracking

### Browser Compatibility
- Modern browsers with localStorage support
- Cross-tab functionality works in Chrome, Firefox, Safari, Edge
- Background processing continues even when tab is not active

### Future Enhancements
- Email notifications when jobs complete
- Cloud storage integration for generated documents
- Advanced job scheduling and prioritization
- Integration with external document management systems
