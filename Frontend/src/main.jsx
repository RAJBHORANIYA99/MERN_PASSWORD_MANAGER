import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from "axios";
import './index.css'
import App from './App.jsx'

// Dynamic API URL rewriting interceptor for production deployment
axios.interceptors.request.use(
  (config) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && config.url && config.url.startsWith("http://localhost:5000")) {
      config.url = config.url.replace("http://localhost:5000", apiUrl);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration and revoking globally
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If backend returns 401 (Unauthorized) indicating session is invalid, expired, or revoked
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
