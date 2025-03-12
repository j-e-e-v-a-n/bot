// API configuration
export const API_BASE_URL = '/api';

export const API_ENDPOINTS = {
  orders: `${API_BASE_URL}/orders`,
  products: 'http://localhost:3000/api/products',
  customers: `${API_BASE_URL}/customers`,
  messages: 'http://localhost:3000/api/messages',
  settings: `${API_BASE_URL}/settings`,
} as const;