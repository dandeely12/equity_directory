/**
 * Central type exports
 * Import from '@/types' for convenience
 */

export * from './models';
export * from './documents';
export * from './flows';
export * from './logs';

/**
 * Common utility types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
