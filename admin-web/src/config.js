// Dynamic host detection for development and production
const isLocal = window.location.hostname === 'localhost';
const host = isLocal ? 'localhost' : window.location.hostname;

// Replace 'gowash-api.yourdomain.com' with your actual production API subdomain if different
export const API_URL = isLocal 
  ? `http://${host}:5005/api` 
  : `https://gowashbackend.nilmaalliance.com/api`;

export const SOCKET_URL = isLocal 
  ? `http://${host}:5005` 
  : `https://gowashbackend.nilmaalliance.com`;

