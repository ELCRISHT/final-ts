import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api" 
    : "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});

// Add token to every request if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Store token when received in response
axiosInstance.interceptors.response.use((response) => {
  if (response.data?.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response;
}, (error) => {
  // Clear token on 401 error
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
  }
  return Promise.reject(error);
});
