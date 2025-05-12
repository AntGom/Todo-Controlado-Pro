import api from '../api/api.js';

let currentUser = null;
let isAuthenticated = false;
let isAdmin = false;

// Verificar si usuario es autenticado al cargar página
async function checkAuth() {
  try {
    const userData = await api.getCurrentUser();
    if (userData.success) {
      currentUser = userData.data;
      isAuthenticated = true;
      isAdmin = currentUser.role === 'admin';
      
      renderUserMenu();
      
      // Notificar a la aplicación del cambio de estado de autenticación
      document.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { isAuthenticated, isAdmin, currentUser } 
      }));
      
      return true;
    } else {
      // Redirigir a la página de autenticación si no estamos en ella
      if (!window.location.pathname.includes('auth.html')) {
        window.location.href = 'auth.html';
      }
      return false;
    }
  } catch (error) {
    // Redirigir a la página de autenticación si no estamos en ella
    if (!window.location.pathname.includes('auth.html')) {
      window.location.href = 'auth.html';
    }
    return false;
  }
}

// Renderizar menú de usuario
function renderUserMenu() {
  const userMenu = document.getElementById('userMenu');
  if (!userMenu || !currentUser) return;
  
  const userInitial = currentUser.name.charAt(0).toUpperCase();
  const roleClass = currentUser.role === 'admin' ? 'admin-bg' : 'user-bg';

  userMenu.innerHTML = `
    <div class="user-info">
      <div class="user-avatar ${roleClass}">${userInitial}</div>
      <i class="fas fa-chevron-down"></i>
    </div>
    <div class="user-dropdown" id="userDropdown">
      <div class="user-dropdown-item" id="profileBtn">
        <i class="fas fa-user"></i> Mi perfil
      </div>
      <div class="user-dropdown-item logout" id="logoutBtn">
        <i class="fas fa-sign-out-alt"></i> Cerrar sesión
      </div>
    </div>
  `;
  
  // Configurar evento mostrar/ocultar desplegable
  const userInfo = document.querySelector('.user-info');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const profileBtn = document.getElementById('profileBtn');
  
  if (userInfo && userDropdown) {
    userInfo.addEventListener('click', () => {
      userDropdown.classList.toggle('show');
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!userInfo.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }
  
  // Configurar evento de logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Configurar evento para ir a la página de perfil
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });
  }
}

// Manejar cierre de sesión
async function handleLogout() {
  try {
    await api.logout();
    
    currentUser = null;
    isAuthenticated = false;
    isAdmin = false;
    
    // Redirigir a pág autenticación
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Si hay error al cerrar sesión, forzamos el cierre
    window.location.href = 'auth.html';
  }
}

export {
  currentUser,
  isAuthenticated,
  isAdmin,
  checkAuth,
  handleLogout
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', checkAuth);