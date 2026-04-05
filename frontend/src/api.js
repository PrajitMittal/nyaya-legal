import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for AI analysis calls
});

// Supabase client for getting current session token
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Attach auth token to every request if user is logged in
api.interceptors.request.use(async (config) => {
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
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

// Saved results
export const listSavedResults = () => api.get('/saved/');
export const saveResult = (data) => api.post('/saved/', data);
export const deleteSavedResult = (id) => api.delete(`/saved/${id}`);

export default api;
