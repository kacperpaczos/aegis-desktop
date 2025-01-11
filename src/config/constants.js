export const API_URL = process.env.NODE_ENV === 'development' 
  ? 'https://localhost:8443/api'
  : 'https://twoj-serwer.pl/api';

export const APP_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:1420'
  : 'https://twoja-aplikacja.pl'; 