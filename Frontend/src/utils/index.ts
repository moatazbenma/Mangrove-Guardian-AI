/**
 * Utility functions for common tasks
 * Formatting, validation, transformation, etc.
 */

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateText = (text: string, length: number = 100): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const capitalizeString = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getRiskColor = (level?: string): string => {
  const normalized = (level || 'low').toLowerCase();
  if (normalized === 'high') return 'text-rose-700';
  if (normalized === 'medium') return 'text-amber-700';
  return 'text-emerald-700';
};
