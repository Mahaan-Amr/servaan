'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { getToken, logout } from '../services/authService';

export function ClientInitializer() {
  useEffect(() => {
    // Setup axios interceptors
    const setupAxiosInterceptors = () => {
      // Add token to all requests
      axios.interceptors.request.use(
        (config) => {
          const token = getToken();
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Handle 401 responses (unauthorized)
      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Clear auth data on 401 Unauthorized
            logout();
            // Redirect to login page
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      );
    };

    setupAxiosInterceptors();
  }, []);

  // This component doesn't render anything
  return null;
} 