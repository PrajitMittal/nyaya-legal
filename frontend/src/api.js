import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for AI analysis calls
});

// FIR endpoints
export const uploadFIR = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/fir/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const createFIRManual = (data) => api.post('/fir/manual', data);
export const listFIRs = () => api.get('/fir/');
export const getFIR = (id) => api.get(`/fir/${id}`);
export const deleteFIR = (id) => api.delete(`/fir/${id}`);

// Search endpoints
export const searchKanoon = (q, ipcSections) =>
  api.get('/search/kanoon', { params: { q, ipc_sections: ipcSections } });
export const findSimilarCases = (firId) => api.get(`/search/similar/${firId}`);

// Analysis endpoints
export const triggerAnalysis = (firId) => api.post(`/analysis/${firId}`);
export const getAnalysis = (firId) => api.get(`/analysis/${firId}`);

export default api;
