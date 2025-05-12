import api from "../api/api.js";
import { formatDate } from "../utils/utils.js";

// Referencias a elementos del DOM
const resetPasswordForm = document.getElementById("resetPasswordForm");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const authMessage = document.getElementById("authMessage");
const currentDateTime = document.getElementById("currentDateTime");

// Inicializar fecha y hora
function updateDateTime() {
  const now = new Date();
  if (currentDateTime) {
    currentDateTime.textContent = formatDate(now, true);
    setTimeout(updateDateTime, 60000); // Actualizar cada minuto
  }
}

// Mostrar mensaje en el contenedor de autenticación
function showAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = "auth-message";
  authMessage.classList.add(type);

  // Ocultar mensaje después de un tiempo
  setTimeout(() => {
    authMessage.classList.remove(type);
  }, 5000);
}

// Obtener token de la URL
function getResetToken() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("token");
}

// Manejar restablecimiento de contraseña
async function handleResetPassword(e) {
  e.preventDefault();

  const token = getResetToken();

  if (!token) {
    showAuthMessage("Token de restablecimiento no válido", "error");
    return;
  }

  const password = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!password || !confirmPassword) {
    showAuthMessage("Por favor, complete todos los campos", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage("Las contraseñas no coinciden", "error");
    return;
  }

  if (password.length < 6) {
    showAuthMessage("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  try {
    const response = await api.resetPassword(token, password);

    if (response.success) {
      showAuthMessage(
        "Contraseña restablecida exitosamente. Redirigiendo...",
        "success"
      );

      // Redirigir a la página principal
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } else {
      throw new Error(response.message || "Error al restablecer la contraseña");
    }
  } catch (error) {
    showAuthMessage(
      error.message || "Error al restablecer la contraseña",
      "error"
    );
  }
}

// Configurar eventos
function setupEvents() {
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", handleResetPassword);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateDateTime();
  setupEvents();

  // Verificar si hay token
  const token = getResetToken();
  if (!token) {
    showAuthMessage(
      "Token de restablecimiento no proporcionado o inválido",
      "error"
    );
    resetPasswordForm.style.display = "none";
  }
});
