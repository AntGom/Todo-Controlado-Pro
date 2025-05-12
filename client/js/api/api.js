const API_URL = 'http://localhost:5000/api';

// Objeto API
const api = {
  // Auth
  async register(userData) {
    return await fetchWithErrorHandling(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
  },

  async login(credentials) {
    return await fetchWithErrorHandling(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });
  },

  async logout() {
    return await fetchWithErrorHandling(`${API_URL}/auth/logout`, {
      method: 'GET',
      credentials: 'include'
    });
  },

  async getCurrentUser() {
    return await fetchWithErrorHandling(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
  },

  async forgotPassword(email) {
    return await fetchWithErrorHandling(`${API_URL}/auth/forgotpassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(token, password) {
    return await fetchWithErrorHandling(`${API_URL}/auth/resetpassword/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'include'
    });
  },

  // Profile
  async updateProfile(userData) {
    return await fetchWithErrorHandling(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
  },

  // Users
  async getUsers() {
    return await fetchWithErrorHandling(`${API_URL}/users`, {
      method: 'GET',
      credentials: 'include'
    });
  },

  // Tasks
  async getTasks(filter = '') {
    let url = `${API_URL}/tasks`;
    if (filter && filter !== 'all') {
      url += `?status=${filter}`;
    }
    return await fetchWithErrorHandling(url, {
      method: 'GET',
      credentials: 'include'
    });
  },

  async getTask(id) {
    return await fetchWithErrorHandling(`${API_URL}/tasks/${id}`, {
      method: 'GET',
      credentials: 'include'
    });
  },

  async createTask(taskData) {
    return await fetchWithErrorHandling(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
      credentials: 'include'
    });
  },

  async updateTask(id, taskData) {
    return await fetchWithErrorHandling(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
      credentials: 'include'
    });
  },

  async deleteTask(id) {
    return await fetchWithErrorHandling(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  // Fotos de tareas
  async uploadTaskPhoto(taskId, photoFile) {
    const formData = new FormData();
    formData.append('photo', photoFile);

    return await fetchWithErrorHandling(`${API_URL}/tasks/${taskId}/photos`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
  },

  async deleteTaskPhoto(taskId, photoId) {
    return await fetchWithErrorHandling(`${API_URL}/tasks/${taskId}/photos/${photoId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  // Events
  async getEvents() {
    return await fetchWithErrorHandling(`${API_URL}/events`, {
      method: 'GET',
      credentials: 'include'
    });
  },

  async getEvent(id) {
    return await fetchWithErrorHandling(`${API_URL}/events/${id}`, {
      method: 'GET',
      credentials: 'include'
    });
  },

  async createEvent(eventData) {
    return await fetchWithErrorHandling(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      credentials: 'include'
    });
  },

  async updateEvent(id, eventData) {
    return await fetchWithErrorHandling(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      credentials: 'include'
    });
  },

  async deleteEvent(id) {
    return await fetchWithErrorHandling(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },

  // Messages
  async getMessages(room = 'general', page = 1, limit = 50) {
    return await fetchWithErrorHandling(`${API_URL}/messages?room=${room}&page=${page}&limit=${limit}`, {
      method: 'GET',
      credentials: 'include'
    });
  },

  async createMessage(messageData) {
    return await fetchWithErrorHandling(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
      credentials: 'include'
    });
  },

  async deleteMessage(id) {
    return await fetchWithErrorHandling(`${API_URL}/messages/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  },
  
  // Mensajes no leídos
  async getUnreadCounts() {
    return await fetchWithErrorHandling(`${API_URL}/messages/unread/count`, {
      method: 'GET',
      credentials: 'include'
    });
  },
  
  async markMessagesAsRead(room) {
    return await fetchWithErrorHandling(`${API_URL}/messages/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room }),
      credentials: 'include'
    });
  }
};

// Helper para errores en peticiones
async function fetchWithErrorHandling(url, options) {
  try {
    const response = await fetch(url, options);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      return { success: true, data: await response.text() };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Ha ocurrido un error');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export default api;