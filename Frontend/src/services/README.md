/**
 * API Services and external integrations
 * 
 * Structure:
 * - api.ts: Axios configuration and base setup
 * - auth.ts: Authentication API calls
 * - reports.ts: Reports API calls
 * - etc.
 */

// Example pattern for a service:
/*
import api from './api';
import { Report, ApiResponse } from '@/types';

export const reportsService = {
  getReports: async (filters?: any): Promise<ApiResponse<Report>> => {
    const response = await api.get('/reports/', { params: filters });
    return response.data;
  },
  
  createReport: async (data: Report) => {
    const response = await api.post('/reports/', data);
    return response.data;
  },
  
  exportReports: async () => {
    const response = await api.get('/reports/export/', {
      responseType: 'blob',
    });
    return response.data;
  },
};
*/
