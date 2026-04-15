import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants/api';
import { getErrorDetails } from '../utils/error';


const client = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});
console.log('API Client initialized with config:', {
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});
/**
 * Request Interceptor: Attach the token to the header if available.
 */
client.interceptors.request.use(
  async (config) => {
    let token;
    if (Platform.OS === 'web') {
      token = localStorage.getItem('user_token');
    } else {
      token = await SecureStore.getItemAsync('user_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Handle global errors (e.g., 401 Unauthorized).
 */
client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const details = getErrorDetails(error);
    console.error('API request failed:', {
      message: details.message,
      statusCode: details.statusCode,
      url: error.config?.url,
      method: error.config?.method,
    });
    return Promise.reject(error);
  }
);

export default client;
