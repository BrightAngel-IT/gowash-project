// Dynamic host detection for development and production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const host = isLocal ? 'localhost' : window.location.hostname;

export const API_URL = isLocal 
  ? `http://${host}:5005/api` 
  : `https://gowashbackend.nilmaalliance.com/api`;

export const SOCKET_URL = isLocal 
  ? `http://${host}:5005` 
  : `https://gowashbackend.nilmaalliance.com`;

