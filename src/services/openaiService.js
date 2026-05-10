import * as api from './apiService.js';

export const detectNiche                  = (_key, ...a) => api.detectNiche(...a);
export const generateContentIdeas         = (_key, ...a) => api.generateContentIdeas(...a);
export const generateContentIdeasStructured = (_key, ...a) => api.generateContentIdeasStructured(...a);
export const analyzeViralContent          = (_key, ...a) => api.analyzeViralContent(...a);
export const generateProductionKit        = (_key, ...a) => api.generateProductionKit(...a);
export const analyzeAudience              = (_key, ...a) => api.analyzeAudience(...a);
export const predictVirality              = (_key, ...a) => api.predictVirality(...a);

export function sendChatMessage(_key, history, posts, credentials) {
  return api.sendChatMessage(history, posts, credentials?.platforms || {});
}
