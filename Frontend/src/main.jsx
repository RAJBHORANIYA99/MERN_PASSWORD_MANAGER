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
    const status = error.response?.status;
    const msg = error.response?.data?.message || "";
    
    // Self-healing check: redirect if 401, or if the server response mentions expiration/revocation
    if (
      status === 401 || 
      msg.includes("expired") || 
      msg.includes("revoked") || 
      msg.includes("Login first")
    ) {
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
