// Referencias a elementos del DOM comunes
const tasksList = document.getElementById("tasksList");
const eventsList = document.getElementById("eventsList");
const calendarViewElement = document.getElementById("calendarView");
const taskModal = document.getElementById("taskModal");
const eventModal = document.getElementById("eventModal");
const taskForm = document.getElementById("taskForm");
const eventForm = document.getElementById("eventForm");
const modalTitle = document.getElementById("modalTitle");
const eventModalTitle = document.getElementById("eventModalTitle");
const closeModalBtns = document.querySelectorAll(".close-modal");
const addTaskBtn = document.getElementById("addTaskBtn");
const addEventBtn = document.getElementById("addEventBtn");
const currentDateTime = document.getElementById("currentDateTime");
const showTasksTab = document.getElementById("showTasksTab");
const showEventsTab = document.getElementById("showEventsTab");
const showCalendarTab = document.getElementById("showCalendarTab");
const filterDropdown = document.getElementById("filterDropdown");
const filterMenu = document.getElementById("filterMenu");
const filterItems = document.querySelectorAll(".dropdown-item");
const currentFilterText = document.getElementById("currentFilterText");
const weatherInfo = document.getElementById("weatherInfo");
const cityInput = document.getElementById("cityInput");
const searchWeatherBtn = document.getElementById("searchWeather");
const dropdownContainer = document.querySelector(".dropdown-container");
const taskBtns = document.querySelector(".task-btns");

// Ciudad predeterminada para el clima
const defaultCity = "Sevilla";

// Marca un filtro como activo->desactiva los demás
function setActiveFilter(filter) {
  currentFilter = filter;
  currentFilterText.textContent = filterNames[filter];

  filterItems.forEach((item) => {
    if (item.dataset.filter === filter) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Establece pestañas activas
function setupTabs() {
  showTasksTab.addEventListener("click", () => {
    tasksList.classList.remove("hidden");
    eventsList.classList.add("hidden");
    calendarViewElement.classList.add("hidden");
    showTasksTab.classList.add("active");
    showEventsTab.classList.remove("active");
    showCalendarTab.classList.remove("active");
    
    // Mostrar el dropdown de filtro si estamos en pestaña de tareas
    if (dropdownContainer) {
      dropdownContainer.style.display = 'block';
    }
    
    // Restaurar dirección de los botones
    if (taskBtns) {
      taskBtns.style.flexDirection = '';
      taskBtns.style.width = '';
    }
  });

  showEventsTab.addEventListener("click", () => {
    tasksList.classList.add("hidden");
    eventsList.classList.remove("hidden");
    calendarViewElement.classList.add("hidden");
    showTasksTab.classList.remove("active");
    showEventsTab.classList.add("active");
    showCalendarTab.classList.remove("active");
    
    // Ocultar el dropdown de filtro si no estamos en pestaña de tareas
    if (dropdownContainer) {
      dropdownContainer.style.display = 'none';
    }
    
    if (taskBtns) {
      taskBtns.style.flexDirection = 'row';
      taskBtns.style.width = '100%';
    }
  });

  showCalendarTab.addEventListener("click", () => {
    tasksList.classList.add("hidden");
    eventsList.classList.add("hidden");
    calendarViewElement.classList.remove("hidden");
    showTasksTab.classList.remove("active");
    showEventsTab.classList.remove("active");
    showCalendarTab.classList.add("active");
    renderCalendar();
    
    // Ocultar filtro si no estamos en pestaña de tareas
    if (dropdownContainer) {
      dropdownContainer.style.display = 'none';
    }
    
    if (taskBtns) {
      taskBtns.style.flexDirection = 'row';
      taskBtns.style.width = '100%';
    }
  });
  
  // Filtro se muestre ok al cargar la página según pestaña activa
  setTimeout(() => {
    if (!showTasksTab.classList.contains('active')) {
      if (dropdownContainer) {
        dropdownContainer.style.display = 'none';
      }
      
      if (taskBtns) {
        taskBtns.style.flexDirection = 'row';
        taskBtns.style.width = '100%';
      }
    }
  }, 0);
}

// Variable para valor original de la ciudad
let lastSearchedCity = defaultCity;

// Restaurar el input a su estado de búsqueda
function resetWeatherInput() {
  cityInput.value = lastSearchedCity;
  cityInput.classList.remove("weather-result");
}