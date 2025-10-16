import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Jobs API
export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id, params = {}) => api.get(`/jobs/${id}`, params),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: (params) => api.get('/jobs/admin/my-jobs', { params }),
  getStats: () => api.get('/jobs/admin/stats'),
  getCompanySuggestions: (query) => api.get('/jobs/suggestions/companies', { params: { q: query } }),
  getLocationSuggestions: (query) => api.get('/jobs/suggestions/locations', { params: { q: query } }),
  getJobTitleSuggestions: (query) => api.get('/jobs/suggestions/titles', { params: { q: query } }),
};

// Applications API
export const applicationsAPI = {
  apply: (data) => api.post('/applications/apply', data),
  getMyApplications: (params) => api.get('/applications/my-applications', { params }),
  withdraw: (id, data) => api.put(`/applications/${id}/withdraw`, data),
  getStats: () => api.get('/applications/stats'),
};

// External Jobs API
export const externalJobsAPI = {
  getAll: (params) => api.get('/external-jobs', { params }),
  getById: (id) => api.get(`/external-jobs/${id}`),
  getStats: () => api.get('/external-jobs/stats'),
  cleanup: (data) => api.post('/external-jobs/admin/cleanup', data),
};

// Resume API
export const resumeAPI = {
  upload: (formData) => api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getParsed: () => api.get('/resume/parsed'),
  download: () => api.get('/resume/download', { responseType: 'blob' }),
  delete: () => api.delete('/resume'),
  getStats: () => api.get('/resume/stats'),
  update: (data) => api.put('/resume/parsed', data),
  reparse: () => api.post('/resume/reparse'),
};

// Matching API
export const matchingAPI = {
  getRecommendations: (params) => api.get('/matching/recommendations', { params }),
  analyzeJob: (jobId) => api.post('/matching/analyze', { jobId }),
  getSkillsGap: (params) => api.get('/matching/skills-gap', { params }),
};

// ATS Scanner API
export const atsAPI = {
  analyze: (data) => api.post('/ats/analyze', data),
  quickScan: (data) => api.post('/ats/quick-scan', data),
  getHistory: () => api.get('/ats/history'),
  getTips: () => api.get('/ats/tips'),
};

// Job Recommendations API
export const jobRecommendationsAPI = {
  analyze: (formData) => api.post('/job-recommendations/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHealth: () => api.get('/job-recommendations/health'),
};

export default api;
