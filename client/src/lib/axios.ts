/**
 * Axios Configuration
 * Centralized HTTP client configuration with interceptors and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base configuration
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      console.error(`❌ API Error: ${status}`, {
        url: error.config?.url,
        method: error.config?.method,
        data: data,
      });

      // Handle specific error cases
      switch (status) {
        case 400:
          console.error('Bad Request:', data);
          break;
        case 401:
          console.error('Unauthorized:', data);
          // Could redirect to login here
          break;
        case 403:
          console.error('Forbidden:', data);
          break;
        case 404:
          console.error('Not Found:', data);
          break;
        case 422:
          console.error('Validation Error:', data);
          break;
        case 500:
          console.error('Server Error:', data);
          break;
        default:
          console.error('Unknown Error:', data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ Network Error: No response received', {
        url: error.config?.url,
        method: error.config?.method,
      });
    } else {
      // Something else happened
      console.error('❌ Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },

  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },

  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },
};

// Specific API endpoints
export const challengesAPI = {
  // Create a new challenge
  createChallenge: (challengeData: ChallengeData) => {
    return apiService.post('/challenges', challengeData);
  },

  // Get all challenges
  getChallenges: () => {
    return apiService.get('/challenges');
  },

  // Get challenge by ID
  getChallenge: (id: string) => {
    return apiService.get(`/challenges/${id}`);
  },

  // Update challenge
  updateChallenge: (id: string, data: any) => {
    return apiService.put(`/challenges/${id}`, data);
  },

  // Delete challenge
  deleteChallenge: (id: string) => {
    return apiService.delete(`/challenges/${id}`);
  },

  // Get user email by wallet address
  getUserEmail: (wallet: string) => {
    return apiService.get(`/challenges/user/${wallet}`);
  },

  // Get challenges for ACP review
  getChallengesForACP: (email: string) => {
    return apiService.get(`/challenges/acp/${email}`);
  },
};

// Error handling utilities
export const handleApiError = (error: AxiosError): string => {
  if (error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as any;
    if (data.message) {
      return data.message;
    }
    if (data.error) {
      return data.error;
    }
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// Type definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ChallengeData {
  creator_email: string;
  creator_wallet: string;
  task_description: string;
  accountability_partner_email: string;
  accountability_partner_wallet: string;
  stake_amount: number;
  duration_minutes: number;
  transaction_hash: string;
  challenge_id?: number;
}

// Export the configured axios instance for direct use if needed
export default apiClient;
