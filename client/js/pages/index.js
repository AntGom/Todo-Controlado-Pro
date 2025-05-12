import { checkAuth, isAdmin } from "../auth/auth.js";
import { formatDate } from "../utils/utils.js";
import {getWeather,getNews,formatSourceName,newsSources,} from "../services/apiService.js";
import { getTasks, getEvents, invalidateCache } from "../api/dataCache.js";

// Referencias a elementos del DOM
const currentDateTime = document.getElementById("currentDateTime");
const showTasksTab = document.getElementById("showTasksTab");
const showEventsTab = document.getElementById("showEventsTab");
const showCalendarTab = document.getElementById("showCalendarTab");
const filterDropdown = document.getElementById("filterDropdown");
const filterMenu = document.getElementById("filterMenu");
const filterItems = document.querySelectorAll(".dropdown-item");
const cityInput = document.getElementById("cityInput");
const searchWeatherBtn = document.getElementById("searchWeather");
const weatherInfo = document.getElementById("weatherInfo");
const dropdownContainer = document.querySelector(".dropdown-container");
const taskBtns = document.querySelector(".task-btns");

// Ciudad predeterminada
const defaultCity = "Sevilla";

// Actualiza la fecha y hora
function updateDateTime() {
  const now = new Date();
  if (currentDateTime) {
    currentDateTime.textContent = formatDate(now, true);
    setTimeout(updateDateTime, 60000);
  }
}

// Configurar pestañas
function setupTabs() {
  showTasksTab.addEventListener("click", () => {
    document.getElementById("tasksList").classList.remove("hidden");
    document.getElementById("eventsList").classList.add("hidden");
    document.getElementById("calendarView").classList.add("hidden");
    showTasksTab.classList.add("active");
    showEventsTab.classList.remove("active");
    showCalendarTab.classList.remove("active");

    // Mostrar desplegable si estamos en pestaña de tareas
    if (dropdownContainer) {
      dropdownContainer.style.display = "block";
    }

    if (taskBtns) {
      taskBtns.style.flexDirection = "";
      taskBtns.style.width = "";
    }
  });

  showEventsTab.addEventListener("click", () => {
    document.getElementById("tasksList").classList.add("hidden");
    document.getElementById("eventsList").classList.remove("hidden");
    document.getElementById("calendarView").classList.add("hidden");
    showTasksTab.classList.remove("active");
    showEventsTab.classList.add("active");
    showCalendarTab.classList.remove("active");

    // Ocultar desplegable si no estamos en pestaña de tareas
    if (dropdownContainer) {
      dropdownContainer.style.display = "none";
    }

    if (taskBtns) {
      taskBtns.style.flexDirection = "row";
      taskBtns.style.width = "100%";
    }
  });

  showCalendarTab.addEventListener("click", () => {
    document.getElementById("tasksList").classList.add("hidden");
    document.getElementById("eventsList").classList.add("hidden");
    document.getElementById("calendarView").classList.remove("hidden");
    showTasksTab.classList.remove("active");
    showEventsTab.classList.remove("active");
    showCalendarTab.classList.add("active");

    // Renderizar el calendario
    window.renderCalendar();

    // Ocultar filtro si no estamos en pestaña de tareas
    if (dropdownContainer) {
      dropdownContainer.style.display = "none";
    }

    if (taskBtns) {
      taskBtns.style.flexDirection = "row";
      taskBtns.style.width = "100%";
    }
  });

  const hash = window.location.hash;
  if (hash === "#events") {
    showEventsTab.click();
  } else if (hash === "#calendar") {
    showCalendarTab.click();
  }
}

// Variable para valor original de la ciudad
let lastSearchedCity = defaultCity;

// Busca info del clima
async function searchWeather(city) {
  try {
    weatherInfo.innerHTML = "<p>Cargando información del clima...</p>";
    lastSearchedCity = city;

    // Obtener datos del clima
    const weatherText = await getWeather(city);

    // Mostrar resultado en input y aplicar estilo
    cityInput.value = weatherText;
    cityInput.classList.add("weather-result");
  } catch (error) {
    weatherInfo.innerHTML = "<p>Error al obtener el clima.</p>";
    console.error("Error al buscar el clima:", error);
  }
}

// Restaurar el input a estado de búsqueda
function resetWeatherInput() {
  cityInput.value = lastSearchedCity;
  cityInput.classList.remove("weather-result");
}

// Configura la interfaz de usuario
function setupUserInterface() {
  const addTaskBtn = document.getElementById("addTaskBtn");
  const addEventBtn = document.getElementById("addEventBtn");
  const addTaskFromDay = document.getElementById("addTaskFromDay");
  const addEventFromDay = document.getElementById("addEventFromDay");

  // Mostrar botones de creación
  if (addTaskBtn) addTaskBtn.style.display = "";
  if (addEventBtn) addEventBtn.style.display = "";
  if (addTaskFromDay) addTaskFromDay.style.display = "";
  if (addEventFromDay) addEventFromDay.style.display = "";
}

// Configurar eventos del clima
function setupWeatherEvents() {
  // Evento para buscar clima
  searchWeatherBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city && !cityInput.classList.contains("weather-result")) {
      searchWeather(city);
    }
  });

  // Evento para limpiar el input del clima al hacer clic
  cityInput.addEventListener("click", () => {
    if (cityInput.classList.contains("weather-result")) {
      resetWeatherInput();
    }
  });

  // Buscar clima al presionar Enter
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

// Configurar menú de filtros
function setupFilters() {
  // Configurar dropdown de filtros
  filterDropdown.addEventListener("click", () => {
    filterMenu.classList.toggle("show");
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!filterDropdown.contains(e.target) && !filterMenu.contains(e.target)) {
      filterMenu.classList.remove("show");
    }
  });

  // Configurar items de filtro
  filterItems.forEach((item) => {
    item.addEventListener("click", () => {
      const filter = item.dataset.filter;
      setActiveFilter(filter);

      // Invalidar caché para refrescar datos con nuevo filtro
      invalidateCache("tasks");
      window.renderTasks(filter);
      filterMenu.classList.remove("show");
    });
  });
}

// Marca un filtro como activo
function setActiveFilter(filter) {
  const currentFilterText = document.getElementById("currentFilterText");
  const filterNames = {
    all: "Todas las tareas",
    pending: "Pendientes",
    inProgress: "En Progreso",
    completed: "Completadas",
  };

  currentFilterText.textContent = filterNames[filter];

  filterItems.forEach((item) => {
    if (item.dataset.filter === filter) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Obtener las noticias más recientes
function getTopNews(articles, count = 10) {
  if (!Array.isArray(articles)) return [];
  return articles
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, count);
}

// Inicializar noticias
async function loadNews(source = null) {
  const newsList = document.getElementById("newsList");
  if (!newsList) return;

  try {
    newsList.innerHTML = "<p>Cargando noticias...</p>";

    const currentSource = source || "elPais";

    // Obtener noticias
    const newsData = await getNews(currentSource);
    const articles = newsData.items || [];

    if (articles.length === 0) {
      newsList.innerHTML = "<p>No hay noticias disponibles.</p>";
      return;
    }

    // Obtener 10 noticias más recientes
    const topArticles = getTopNews(articles);

    // Limpiar contenedor
    newsList.innerHTML = "";

    // Crear selector de fuentes
    const sourceSelector = document.createElement("div");
    sourceSelector.className = "news-source-selector";
    sourceSelector.innerHTML = `
      <select id="newsSource">
        <option value="elPais">El País</option>
        <option value="elMundo">El Mundo</option>
        <option value="marcaMotor">Fórmula-1</option>
        <option value="motoGP">Moto GP</option>
      </select>
    `;
    newsList.appendChild(sourceSelector);

    // Configurar evento del selector
    const sourceSelect = document.getElementById("newsSource");
    sourceSelect.value = currentSource;
    sourceSelect.addEventListener("change", (e) => {
      loadNews(e.target.value);
    });

    // Mostrar las noticias
    topArticles.forEach((article) => {
      const newsItem = document.createElement("div");
      newsItem.className = "news-item";

      let description = "";
      if (article.description) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = article.description;
        description = tempDiv.textContent || tempDiv.innerText;
        description = description.substring(0, 100) + "...";
      }

      newsItem.innerHTML = `
        <h3>${article.title}</h3>
        <p>${description || "Sin descripción"}</p>
        <a href="${article.link}" target="_blank">Leer más</a>
      `;

      newsList.appendChild(newsItem);
    });
  } catch (error) {
    newsList.innerHTML = "<p>Error al cargar las noticias.</p>";
    console.error("Error al cargar noticias:", error);
  }
}

// Inicializar la aplicación
async function initApp() {
  const isUserAuthenticated = await checkAuth();

  if (isUserAuthenticated) {
    updateDateTime();
    setupTabs();
    setupWeatherEvents();
    setupFilters();
    searchWeather(defaultCity);
    loadNews();
    setupUserInterface();

    // Cargar tareas, eventos y calendario
    window.loadTasks && window.loadTasks();
    window.loadEvents && window.loadEvents();

    document.addEventListener("authStateChanged", (e) => {
      setupUserInterface();
    });
  }
}

document.addEventListener("DOMContentLoaded", initApp);
