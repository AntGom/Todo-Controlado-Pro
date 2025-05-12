import { isAuthenticated, isAdmin, currentUser } from "./auth/auth.js";
import { initChat } from "./features/chat.js";

// Evento cuando cambia estado de autenticación
document.addEventListener("authStateChanged", (e) => {
  const { isAuthenticated, isAdmin } = e.detail;

  if (isAuthenticated) {
    setupAppForUser(isAdmin);
  } else {
    cleanupApp();
  }
});

// Configurar para usuario autenticado
function setupAppForUser(isAdmin) {
  // Cargar datos al inicializar
  loadTasks();
  loadEvents();
  updateDateTime();
  searchWeather(defaultCity);
  loadNews();
  renderCalendar();

  initChat();
}

// Inicialización inmediata
if (isAuthenticated) {
  setupAppForUser(isAdmin);
}
