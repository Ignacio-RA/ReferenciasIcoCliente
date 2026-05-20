import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4800/'
});

// INTERCEPTOR: Se ejecuta ANTES de que cualquier petición salga hacia tu API
api.interceptors.request.use(
  (config) => {
    // Intentamos buscar el token guardado en el localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Si el token existe, se lo agregamos a los Headers en el formato Bearer
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;