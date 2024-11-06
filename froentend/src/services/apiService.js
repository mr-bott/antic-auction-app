// services/apiService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiService.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getProducts = () => apiService.get('/products');
export const getProduct = (id) => apiService.get(`/products/${id}`);
export const placeBid = (productId, amount) => 
  apiService.post(`/bids`, { productId, amount });
export const getUserBids = () => apiService.get('/bids/user');