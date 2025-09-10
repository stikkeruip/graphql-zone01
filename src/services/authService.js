const AUTH_API_URL = import.meta.env.DEV 
  ? '/api/auth/signin' 
  : 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://platform.zone01.gr/api/auth/signin');
const JWT_STORAGE_KEY = 'zone01_jwt';

export const authService = {
  async login(identifier, password) {
    const credentials = btoa(`${identifier}:${password}`);
    
    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid credentials. Please check your username/email and password.');
        }
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || typeof data !== 'string') {
        throw new Error('Invalid response from server');
      }

      this.storeToken(data);
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  },

  storeToken(jwt) {
    localStorage.setItem(JWT_STORAGE_KEY, jwt);
  },

  getToken() {
    return localStorage.getItem(JWT_STORAGE_KEY);
  },

  removeToken() {
    localStorage.removeItem(JWT_STORAGE_KEY);
  },

  logout() {
    this.removeToken();
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = this.decodeJWT(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      this.removeToken();
      return false;
    }
  },

  decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  },

  getUserId() {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      const payload = this.decodeJWT(token);
      return payload.sub || payload.userId || payload.user_id;
    } catch {
      return null;
    }
  }
};