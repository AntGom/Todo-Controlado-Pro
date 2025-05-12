import api from "../api/api.js";
import { checkAuth } from "./auth.js";
import { formatDate } from "../utils/utils.js";
import { getWeather } from "../services/apiService.js";

// Referencias a elementos del DOM
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const profileMessage = document.getElementById("profileMessage");
const profileName = document.getElementById("profileName");
const currentDateTime = document.getElementById("currentDateTime");
const cityInput = document.getElementById("cityInput");
const searchWeatherBtn = document.getElementById("searchWeather");
const weatherInfo = document.getElementById("weatherInfo");

const defaultCity = "Sevilla";

let lastSearchedCity = defaultCity;

// Actualizar fecha/hora
function updateDateTime() {
  const now = new Date();
  if (currentDateTime) {
    currentDateTime.textContent = formatDate(now, true);
    setTimeout(updateDateTime, 60000); // Actualizar cada minuto
  }
}

// Mostrar mensaje en el formulario
function showProfileMessage(message, type) {
  profileMessage.textContent = message;
  profileMessage.className = "profile-message";
  profileMessage.classList.add(type);

  // Ocultar mensaje después de un tiempo
  setTimeout(() => {
    profileMessage.classList.remove(type);
  }, 2000);
}

// Cargar datos del perfil
async function loadProfileData() {
  try {
    const response = await api.getCurrentUser();

    if (response.success) {
      const user = response.data;

      // Actualizar formulario
      nameInput.value = user.name;
      emailInput.value = user.email;

      // Actualizar nombre en header
      profileName.textContent = user.name;
    } else {
      showProfileMessage("Error al cargar los datos del perfil", "error");
    }
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    showProfileMessage("Error al cargar los datos del perfil", "error");
  }
}

// Manejar actualización del perfil
async function handleProfileUpdate(e) {
  e.preventDefault();

  const name = nameInput.value.trim();
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!name) {
    showProfileMessage("Por favor, ingrese su nombre", "error");
    return;
  }

  // Verificar si las contraseñas coinciden (solo si se está cambiando)
  if (newPassword) {
    if (newPassword !== confirmPassword) {
      showProfileMessage("Las contraseñas no coinciden", "error");
      return;
    }

    if (newPassword.length < 6) {
      showProfileMessage(
        "La contraseña debe tener al menos 6 caracteres",
        "error"
      );
      return;
    }
  }

  try {
    // Preparar datos para actualizar
    const userData = {
      name,
    };

    // Solo incluir contraseña si se está cambiando
    if (newPassword) {
      userData.password = newPassword;
    }

    // Llamar a la API para actualizar perfil
    const response = await api.updateProfile(userData);

    if (response.success) {
      showProfileMessage("Perfil actualizado correctamente", "success");

      // Limpiar campos de contraseña
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";

      // Recargar datos del perfil
      loadProfileData();
    } else {
      showProfileMessage(
        response.message || "Error al actualizar el perfil",
        "error"
      );
    }
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    showProfileMessage(
      error.message || "Error al actualizar el perfil",
      "error"
    );
  }
}

// Busca info del clima para ciudad
async function searchWeather(city) {
  try {
    if (weatherInfo) {
      weatherInfo.innerHTML = "<p>Cargando información del clima...</p>";
    }
    lastSearchedCity = city;

    // Obtener datos reales del clima
    const weatherText = await getWeather(city);

    // Mostrar resultado en input y aplicar estilo
    if (cityInput) {
      cityInput.value = weatherText;
      cityInput.classList.add("weather-result");
    }
  } catch (error) {
    if (weatherInfo) {
      weatherInfo.innerHTML = "<p>Error al obtener el clima.</p>";
    }
    console.error("Error al buscar el clima:", error);
  }
}

// Restaurar el input a su estado de búsqueda
function resetWeatherInput() {
  if (cityInput) {
    cityInput.value = lastSearchedCity;
    cityInput.classList.remove("weather-result");
  }
}

// Configurar eventos del clima
function setupWeatherEvents() {
  if (!searchWeatherBtn || !cityInput) return;

  // Evento para buscar clima
  searchWeatherBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city && !cityInput.classList.contains("weather-result")) {
      searchWeather(city);
    }
  });

  // Evento para limpiar el input del clima al hacer clic en él
  cityInput.addEventListener("click", () => {
    if (cityInput.classList.contains("weather-result")) {
      resetWeatherInput();
    }
  });

  // También buscar clima al presionar Enter
  cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !cityInput.classList.contains("weather-result")) {
      const city = cityInput.value.trim();
      if (city) {
        searchWeather(city);
      }
      e.preventDefault();
    }
  });
}

// Inicializar página
async function initProfilePage() {
  const isUserAuthenticated = await checkAuth();

  if (isUserAuthenticated) {
    updateDateTime();
    loadProfileData();
    setupEvents();
    setupWeatherEvents();
    searchWeather(defaultCity);
  }
}

// Configurar eventos
function setupEvents() {
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileUpdate);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", initProfilePage);
