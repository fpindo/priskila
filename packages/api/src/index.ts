import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { BaseResponse } from '@priskila/types';

// Create a custom Axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Auth Token if available
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format errors and handle global errors (like 401 Unauthorized)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const customError = {
      success: false,
      message: error.response?.data?.message || 'Something went wrong. Please try again.',
      errors: error.response?.data?.errors || {},
      status: error.response?.status,
    };

    // If unauthorized, clear local session
    if (customError.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      // Optionally redirect to login, but keep logic in client app
    }

    return Promise.reject(customError);
  }
);

// Export common services or fetch wrappers
export class ApiService {
  static async get<T>(url: string, params?: object): Promise<BaseResponse<T>> {
    const response = await apiClient.get<BaseResponse<T>>(url, { params });
    return response.data;
  }

  static async post<T>(endpoint: string, data?: unknown): Promise<BaseResponse<T>> {
    const response = await apiClient.post<BaseResponse<T>>(endpoint, data);
    return response.data as BaseResponse<T>;
  }

  static async put<T>(url: string, data?: object): Promise<BaseResponse<T>> {
    const response = await apiClient.put<BaseResponse<T>>(url, data);
    return response.data;
  }

  static async delete<T>(url: string): Promise<BaseResponse<T>> {
    const response = await apiClient.delete<BaseResponse<T>>(url);
    return response.data;
  }
}
