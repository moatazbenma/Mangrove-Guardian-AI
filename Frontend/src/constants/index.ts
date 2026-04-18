/**
 * Application constants
 * API endpoints, config values, error messages, etc.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  LOGOUT: '/auth/logout/',
  REFRESH: '/auth/refresh/',
  
  // Reports
  REPORTS: '/reports/',
  REPORTS_EXPORT: '/reports/export/',
  
  // Restoration Projects
  PROJECTS: '/projects/',
  
  // Analysis
  ANALYSIS: '/analysis/',
  
  // Users
  USERS: '/users/',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  EXPORT_FAILED: 'Failed to export reports. Please try again.',
};

export const SUCCESS_MESSAGES = {
  REPORT_CREATED: 'Report created successfully!',
  REPORT_UPDATED: 'Report updated successfully!',
  REPORT_DELETED: 'Report deleted successfully!',
  EXPORT_SUCCESS: 'Reports exported successfully!',
};

export const RISK_LEVELS = ['high', 'medium', 'low'] as const;
export const USER_ROLES = ['community', 'organization', 'admin'] as const;
export const PROJECT_STATUSES = ['planned', 'ongoing', 'completed'] as const;
