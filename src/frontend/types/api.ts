// API Type Definitions for Frontend Components
// Standardizes API response structures and error handling across the application

// ===================== BASE API TYPES =====================

/**
 * Base API response structure
 * All API responses follow this pattern for consistency
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  warnings?: string[];
  meta?: ApiResponseMeta;
}

/**
 * API response metadata
 */
export interface ApiResponseMeta {
  timestamp: string;
  version?: string;
  requestId?: string;
  processingTime?: number;
  pagination?: ApiPagination;
}

/**
 * Standard pagination structure
 */
export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: ApiResponseMeta & {
    pagination: ApiPagination;
  };
}

// ===================== API ERROR TYPES =====================

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    field?: string;
    value?: unknown;
  };
  errors?: ApiErrorDetail[];
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

/**
 * Detailed API error information
 */
export interface ApiErrorDetail {
  field: string;
  message: string;
  code: string;
  value?: unknown;
  constraint?: string;
}

/**
 * HTTP status codes used in the application
 */
export type HttpStatusCode = 
  | 200 | 201 | 204
  | 400 | 401 | 403 | 404 | 409 | 422 | 429
  | 500 | 502 | 503 | 504;

/**
 * API error codes
 */
export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR';

// ===================== API REQUEST TYPES =====================

/**
 * Base API request structure
 */
export interface ApiRequest<T = unknown> {
  data?: T;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * API request configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryEnabled: boolean;
  maxRetries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

// ===================== API CLIENT TYPES =====================

/**
 * API client interface
 */
export interface ApiClient {
  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T>;
  post<T>(endpoint: string, data?: unknown): Promise<T>;
  put<T>(endpoint: string, data?: unknown): Promise<T>;
  patch<T>(endpoint: string, data?: unknown): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
  request<T>(options: ApiRequestOptions): Promise<T>;
}

/**
 * API client response handler
 */
export interface ApiResponseHandler<T> {
  (response: Response): Promise<T>;
}

/**
 * API client error handler
 */
export interface ApiErrorHandler {
  (error: Error, request: ApiRequestOptions): void;
}

// ===================== AUTHENTICATION TYPES =====================

/**
 * Authentication request
 */
export interface AuthRequest {
  email: string;
  password: string;
  tenantId?: string;
  rememberMe?: boolean;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      tenantId: string;
      tenantSubdomain: string;
      tenantName: string;
    };
    token: string;
    refreshToken?: string;
    expiresIn: number;
  };
  message?: string;
}

/**
 * Token refresh request
 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
}

// ===================== TENANT CONTEXT TYPES =====================

/**
 * Tenant context information
 */
export interface TenantContext {
  id: string;
  subdomain: string;
  name: string;
  displayName: string;
  plan: string;
  isActive: boolean;
  features: Record<string, boolean>;
  settings: Record<string, unknown>;
}

/**
 * Tenant-aware API request
 */
export interface TenantApiRequest<T = unknown> extends ApiRequest<T> {
  tenantId: string;
  tenantSubdomain: string;
}

// ===================== FILE UPLOAD TYPES =====================

/**
 * File upload request
 */
export interface FileUploadRequest {
  file: File;
  type: 'image' | 'document' | 'video' | 'audio';
  category?: string;
  metadata?: Record<string, unknown>;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean;
  data: {
    fileId: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
  };
  message?: string;
}

/**
 * File upload progress
 */
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  estimatedTime: number;
}

// ===================== BULK OPERATION TYPES =====================

/**
 * Bulk operation request
 */
export interface BulkOperationRequest<T = unknown> {
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT';
  items: T[];
  options?: Record<string, unknown>;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse<T = unknown> {
  success: boolean;
  data: {
    operationId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    totalItems: number;
    processedItems: number;
    failedItems: number;
    results: Array<{
      index: number;
      success: boolean;
      data?: T;
      error?: string;
    }>;
  };
  message?: string;
}

/**
 * Bulk operation status
 */
export interface BulkOperationStatus {
  operationId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  estimatedTimeRemaining?: number;
  result?: unknown;
  error?: string;
}

// ===================== SEARCH AND FILTER TYPES =====================

/**
 * Search request parameters
 */
export interface SearchRequest {
  query: string;
  filters?: Record<string, unknown>;
  sort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * Search result item structure
 */
export interface SearchResultItem<T> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
}

/**
 * Search response
 */
export interface SearchResponse<T> extends ApiResponse<SearchResultItem<T>[]> {
  meta: ApiResponseMeta & {
    pagination: ApiPagination;
    search: {
      query: string;
      totalResults: number;
      searchTime: number;
      suggestions?: string[];
    };
  };
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  field: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'range' | 'boolean';
  label: string;
  options?: Array<{
    value: string | number;
    label: string;
    count?: number;
  }>;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// ===================== WEBSOCKET TYPES =====================

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
  messageId: string;
  tenantId?: string;
  userId?: string;
}

/**
 * WebSocket connection status
 */
export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastConnected?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

/**
 * WebSocket event handlers
 */
export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: () => void;
  onReconnectFailed?: () => void;
}

// ===================== CACHE TYPES =====================

/**
 * Cache entry structure
 */
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enableEncryption: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  memoryUsage: number;
}

// ===================== API MONITORING TYPES =====================

/**
 * API request metrics
 */
export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  lastRequestTime: string;
}

/**
 * API performance data
 */
export interface ApiPerformance {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
  userId?: string;
  tenantId?: string;
  userAgent?: string;
  ipAddress?: string;
}
