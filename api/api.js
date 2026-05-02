// API 服务层
const API_BASE = '/api';

const api = {
  // 用户认证
  register: async (userData) => {
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'register',
        ...userData
      })
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'login',
        ...credentials
      })
    });
    return response.json();
  },

  getUser: async (token) => {
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_BASE}/auth?all=true`);
    return response.json();
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_BASE}/auth?id=${userId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // 作品相关
  getAllShots: async () => {
    const response = await fetch(`${API_BASE}/shots`);
    return response.json();
  },

  getShot: async (shotId) => {
    const response = await fetch(`${API_BASE}/shots?id=${shotId}`);
    return response.json();
  },

  createShot: async (shotData, token) => {
    const response = await fetch(`${API_BASE}/shots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shotData)
    });
    return response.json();
  },

  updateShot: async (shotId, shotData, token) => {
    const response = await fetch(`${API_BASE}/shots?id=${shotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shotData)
    });
    return response.json();
  },

  deleteShot: async (shotId) => {
    const response = await fetch(`${API_BASE}/shots?id=${shotId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  likeShot: async (shotId, token) => {
    const response = await fetch(`${API_BASE}/shots?id=${shotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'like' })
    });
    return response.json();
  },

  addComment: async (shotId, commentData, token) => {
    const response = await fetch(`${API_BASE}/shots?id=${shotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'comment',
        ...commentData
      })
    });
    return response.json();
  },

  getUserShots: async (userId) => {
    const response = await fetch(`${API_BASE}/shots?userId=${userId}`);
    return response.json();
  }
};

// 存储 token
function setToken(token) {
  localStorage.setItem('token', token);
}

function getToken() {
  return localStorage.getItem('token');
}

function removeToken() {
  localStorage.removeItem('token');
}