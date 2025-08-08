// src/services/backgroundService.js
class BackgroundProcessingService {
  constructor() {
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    this.listeners = new Map();
    this.jobCounter = 0;
  }

  // Start a background job
  startJob(type, data, apiFunction) {
    const jobId = `${type}_${++this.jobCounter}_${Date.now()}`;
    
    const job = {
      id: jobId,
      type,
      data,
      status: 'running',
      startTime: Date.now(),
      progress: 0,
      result: null,
      error: null
    };

    this.activeJobs.set(jobId, job);
    this.notifyListeners(jobId, job);

    // Execute the API function
    this.executeJob(jobId, apiFunction, data);

    return jobId;
  }

  async executeJob(jobId, apiFunction, data) {
    try {
      const job = this.activeJobs.get(jobId);
      if (!job) return;

      // Update progress
      this.updateJobProgress(jobId, 25);

      // Execute the API call
      const result = await apiFunction(data);

      // Update progress
      this.updateJobProgress(jobId, 100);

      // Mark as completed
      job.status = 'completed';
      job.result = result;
      job.endTime = Date.now();

      // Move to completed jobs
      this.activeJobs.delete(jobId);
      this.completedJobs.set(jobId, job);

      this.notifyListeners(jobId, job);

      // Store in localStorage for persistence
      this.saveToStorage(jobId, job);

    } catch (error) {
      console.error(`Background job ${jobId} failed:`, error);
      
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = error.message;
        job.endTime = Date.now();

        this.activeJobs.delete(jobId);
        this.completedJobs.set(jobId, job);

        this.notifyListeners(jobId, job);
        this.saveToStorage(jobId, job);
      }
    }
  }

  updateJobProgress(jobId, progress) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.progress = progress;
      this.notifyListeners(jobId, job);
    }
  }

  // Subscribe to job updates
  subscribe(jobId, callback) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId).add(callback);

    // Return unsubscribe function
    return () => {
      const jobListeners = this.listeners.get(jobId);
      if (jobListeners) {
        jobListeners.delete(callback);
        if (jobListeners.size === 0) {
          this.listeners.delete(jobId);
        }
      }
    };
  }

  notifyListeners(jobId, job) {
    const jobListeners = this.listeners.get(jobId);
    if (jobListeners) {
      jobListeners.forEach(callback => callback(job));
    }
  }

  // Get job status
  getJob(jobId) {
    return this.activeJobs.get(jobId) || this.completedJobs.get(jobId) || this.loadFromStorage(jobId);
  }

  // Get all active jobs
  getActiveJobs() {
    return Array.from(this.activeJobs.values());
  }

  // Get all completed jobs
  getCompletedJobs() {
    return Array.from(this.completedJobs.values());
  }

  // Cancel a job
  cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = 'cancelled';
      job.endTime = Date.now();
      
      this.activeJobs.delete(jobId);
      this.completedJobs.set(jobId, job);
      
      this.notifyListeners(jobId, job);
    }
  }

  // Clear completed jobs
  clearCompleted() {
    this.completedJobs.clear();
    this.clearStorageCompletedJobs();
  }

  // Storage methods for persistence
  saveToStorage(jobId, job) {
    try {
      const stored = JSON.parse(localStorage.getItem('backgroundJobs') || '{}');
      stored[jobId] = {
        ...job,
        // Don't store large result objects in localStorage
        result: job.result ? { 
          hasResult: true, 
          type: job.type,
          timestamp: job.endTime 
        } : null
      };
      localStorage.setItem('backgroundJobs', JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to save job to storage:', error);
    }
  }

  loadFromStorage(jobId) {
    try {
      const stored = JSON.parse(localStorage.getItem('backgroundJobs') || '{}');
      return stored[jobId] || null;
    } catch (error) {
      console.warn('Failed to load job from storage:', error);
      return null;
    }
  }

  clearStorageCompletedJobs() {
    try {
      localStorage.removeItem('backgroundJobs');
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  // Initialize from storage on page load
  initializeFromStorage() {
    try {
      const stored = JSON.parse(localStorage.getItem('backgroundJobs') || '{}');
      Object.entries(stored).forEach(([jobId, job]) => {
        if (job.status === 'completed' || job.status === 'error' || job.status === 'cancelled') {
          this.completedJobs.set(jobId, job);
        }
      });
    } catch (error) {
      console.warn('Failed to initialize from storage:', error);
    }
  }
}

// Create singleton instance
const backgroundService = new BackgroundProcessingService();

// Initialize on page load
backgroundService.initializeFromStorage();

export default backgroundService;