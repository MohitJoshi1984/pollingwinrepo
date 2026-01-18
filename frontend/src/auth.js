const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const getToken = () => localStorage.getItem('token');
export const getRole = () => localStorage.getItem('role');
export const setToken = (token, role) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
};
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};

export const isAuthenticated = () => !!getToken();
export const isAdmin = () => getRole() === 'admin';

export const authHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});
