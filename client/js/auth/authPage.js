import api from "../api/api.js";
import { formatDate } from "../utils/utils.js";

// Referencias a elementos del DOM
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const loginTabBtn = document.getElementById("loginTabBtn");
const registerTabBtn = document.getElementById("registerTabBtn");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const backToLoginLink = document.getElementById("backToLoginLink");
const authMessage = document.getElementById("authMessage");
const currentDateTime = document.getElementById("currentDateTime");

// Inicializar fecha y hora
function updateDateTime() {
  const now = new Date();
  if (currentDateTime) {
    currentDateTime.textContent = formatDate(now, true);
    setTimeout(updateDateTime, 60000);
  }
}

// Mostrar mensaje en el contenedor de autenticación
function showAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = "auth-message";
  authMessage.classList.add(type);

  // Ocultar mensaje
  setTimeout(() => {
    authMessage.classList.remove(type);
  }, 5000);
}

// Verificar si user ya autenticado
async function checkAuth() {
  try {
    const userData = await api.getCurrentUser();
    if (userData.success) {
      // Redirigir a pág principal
      window.location.href = "index.html";
    }
  } catch (error) {
    // Usuario no está autenticado, mostrar formularios
    console.log("Usuario no autenticado");
  }
}

// Mostrar los diferentes formularios
function showLoginForm() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  forgotPasswordForm.classList.add("hidden");
  loginTabBtn.classList.add("active");
  registerTabBtn.classList.remove("active");

  loginForm.scrollIntoView({ behavior: "smooth" });
}

function showRegisterForm() {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  forgotPasswordForm.classList.add("hidden");
  loginTabBtn.classList.remove("active");
  registerTabBtn.classList.add("active");

  registerForm.scrollIntoView({ behavior: "smooth" });
}

function showForgotPasswordForm() {
  loginForm.classList.add("hidden");
  registerForm.classList.add("hidden");
  forgotPasswordForm.classList.remove("hidden");
  loginTabBtn.classList.remove("active");
  registerTabBtn.classList.remove("active");

  forgotPasswordForm.scrollIntoView({ behavior: "smooth" });
}


// Manejar inicio de sesión
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showAuthMessage("Por favor, complete todos los campos", "error");
    return;
  }

  try {
    const response = await api.login({ email, password });

    if (response.success) {
      showAuthMessage("Inicio de sesión exitoso. Redirigiendo...", "success");

      // Redirigir a pág ppal
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }
  } catch (error) {
    showAuthMessage(error.message || "Error al iniciar sesión", "error");
  }
}

// Manejar registro de usuario
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const passwordConfirm = document.getElementById(
    "registerPasswordConfirm"
  ).value;

  if (!name || !email || !password || !passwordConfirm) {
    showAuthMessage("Por favor, complete todos los campos", "error");
    return;
  }

  if (password !== passwordConfirm) {
    showAuthMessage("Las contraseñas no coinciden", "error");
    return;
  }

  try {
    const response = await api.register({ name, email, password });

    if (response.success) {
      showAuthMessage("Registro exitoso. Redirigiendo...", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }
  } catch (error) {
    showAuthMessage(error.message || "Error al registrarse", "error");
  }
}

// Recuperación de contraseña
async function handleForgotPassword(e) {
  e.preventDefault();

  const email = document.getElementById("forgotEmail").value;

  if (!email) {
    showAuthMessage("Por favor, ingrese su email", "error");
    return;
  }

  try {
    const response = await api.forgotPassword(email);

    if (response.success) {
      showAuthMessage(
        "Se ha enviado un enlace a su email para restablecer su contraseña",
        "success"
      );

      // Volver a login
      setTimeout(() => {
        showLoginForm();
      }, 3000);
    }
  } catch (error) {
    showAuthMessage(error.message || "Error al procesar la solicitud", "error");
  }
}

// Configurar eventos
function setupAuthEvents() {
  // Eventos para cambiar entre formularios
  loginTabBtn.addEventListener("click", showLoginForm);
  registerTabBtn.addEventListener("click", showRegisterForm);
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    showForgotPasswordForm();
  });
  backToLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    showLoginForm();
  });

  // Eventos para enviar formularios
  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);
  forgotPasswordForm.addEventListener("submit", handleForgotPassword);
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  updateDateTime();
  checkAuth();
  setupAuthEvents();
});
