import api from "../api/api.js";
import { formatDate, isSameDay } from "../utils/utils.js";
import { openTaskModal, createTaskElement } from "./tasks.js";
import { openEventModal, createEventElement } from "./events.js";
import { isAdmin } from "../auth/auth.js";

// Vbles para el calendario
let currentCalendarDate = new Date();
let selectedDate = null;

// Cache -> evitar múltiples peticiones
let cachedTasks = [];
let cachedEvents = [];
let lastCacheUpdate = null;

// Elementos del DOM
const calendarDaysGrid = document.getElementById("calendarDaysGrid");
const currentMonthYear = document.getElementById("currentMonthYear");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const dayDetailsModal = document.getElementById("dayDetailsModal");
const dayDetailsTitle = document.getElementById("dayDetailsTitle");
const dayTasksList = document.getElementById("dayTasksList");
const dayEventsList = document.getElementById("dayEventsList");
const addTaskFromDay = document.getElementById("addTaskFromDay");
const addEventFromDay = document.getElementById("addEventFromDay");

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Configura los eventos del calendario
function setupCalendarEvents() {
  if (!prevMonth || !nextMonth) return;

  // Navegación entre meses
  prevMonth.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonth.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });

  // Cerrar modal de detalles del día
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (dayDetailsModal) {
        dayDetailsModal.style.display = "none";
      }
    });
  });

  // Agregar tarea desde modal de día
  if (addTaskFromDay) {
    addTaskFromDay.addEventListener("click", () => {
      dayDetailsModal.style.display = "none";

      // Configurar la fecha en el formulario de tarea
      const taskDateInput = document.getElementById("dueDate");
      if (selectedDate && taskDateInput) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const hours = String(new Date().getHours()).padStart(2, "0");
        const minutes = String(new Date().getMinutes()).padStart(2, "0");

        taskDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      openTaskModal();
    });

    // Mostrar/ocultar botón según rol
    addTaskFromDay.style.display = isAdmin ? "block" : "none";
  }

  // Agregar evento desde modal de día
  if (addEventFromDay) {
    addEventFromDay.addEventListener("click", () => {
      dayDetailsModal.style.display = "none";

      // Configurar la fecha en el formulario de evento
      const eventDateInput = document.getElementById("eventDate");
      if (selectedDate && eventDateInput) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const hours = String(new Date().getHours()).padStart(2, "0");
        const minutes = String(new Date().getMinutes()).padStart(2, "0");

        eventDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }

      openEventModal();
    });

    // Mostrar/ocultar botón según rol
    addEventFromDay.style.display = isAdmin ? "block" : "none";
  }

  // Cerrar modal al hacer clic fuera del contenido
  window.addEventListener("click", (e) => {
    if (e.target === dayDetailsModal) {
      dayDetailsModal.style.display = "none";
    }
  });
}

// Carga tareas y eventos para mes actual
async function loadCalendarData() {
  try {
    // Cargar todas las tareas
    const tasksResponse = await api.getTasks();
    if (tasksResponse.success) {
      cachedTasks = tasksResponse.data;
    }

    // Cargar todos los eventos
    const eventsResponse = await api.getEvents();
    if (eventsResponse.success) {
      cachedEvents = eventsResponse.data;
    }

    // Actualizar timestamp de la última carga
    lastCacheUpdate = new Date();

    console.log(
      `Datos cargados para el calendario: ${cachedTasks.length} tareas, ${cachedEvents.length} eventos`
    );
  } catch (error) {
    console.error("Error al cargar datos para el calendario:", error);
  }
}

//Renderiza el calendario
async function renderCalendar() {
  if (!calendarDaysGrid || !currentMonthYear) return;

  // Cargar datos solo al renderizar el calendario
  await loadCalendarData();

  renderMonthView();
}

//Renderiza la vista de mes del calendario
function renderMonthView() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  // Actualizar título
  currentMonthYear.textContent = `${monthNames[month]} ${year}`;

  calendarDaysGrid.innerHTML = "";

  // Obtener el primer día del mes
  const firstDay = new Date(year, month, 1);
  // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
  let dayOfWeek = firstDay.getDay() - 1;
  if (dayOfWeek < 0) dayOfWeek = 6; // Si es domingo (0), ajustar a 6

  // Obtener el último día del mes
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Obtener días del mes anterior
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Días del mes anterior (para completar primera semana)
  for (let i = dayOfWeek - 1; i >= 0; i--) {
    const dayNumber = prevMonthDays - i;
    const dayDate = new Date(year, month - 1, dayNumber);
    const dayElement = createDayElement(dayDate, true);
    calendarDaysGrid.appendChild(dayElement);
  }

  // Días del mes actual
  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const dayDate = new Date(year, month, day);
    const isToday =
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year;

    const dayElement = createDayElement(dayDate, false, isToday);
    calendarDaysGrid.appendChild(dayElement);
  }

  // Calcular cuántas celdas tenemos hasta ahora
  const cellsCount = dayOfWeek + totalDays;
  // Calcular cuántas celdas necesitamos añadir del mes siguiente
  const nextMonthDays = 42 - cellsCount; // 42 = 6 filas x 7 días

  // Días del mes siguiente (para completar última semana)
  for (let day = 1; day <= nextMonthDays; day++) {
    const dayDate = new Date(year, month + 1, day);
    const dayElement = createDayElement(dayDate, true);
    calendarDaysGrid.appendChild(dayElement);
  }
}

//Crea un elemento para un día en la vista de mes
function createDayElement(date, isOtherMonth = false, isToday = false) {
  const dayElement = document.createElement("div");
  dayElement.className = "calendar-day";
  if (isOtherMonth) {
    dayElement.classList.add("day-other-month");
  }

  const day = date.getDate();

  // Tareas y eventos para este día
  const dayTasks = getTasksForDateFromCache(date);
  const dayEvents = getEventsForDateFromCache(date);

  // Número del día
  const dayNumberElement = document.createElement("div");
  dayNumberElement.className = "day-number";
  if (isToday) {
    dayNumberElement.classList.add("day-current");
  }
  dayNumberElement.textContent = day;

  dayElement.appendChild(dayNumberElement);

  // Si hay tareas o eventos, mostrarlos
  if (dayTasks.length > 0 || dayEvents.length > 0) {
    const itemsContainer = document.createElement("div");
    itemsContainer.className = "calendar-day-items";

    // Mostrar hasta 2 elementos (combinando tareas y eventos)
    const allItems = [...dayTasks, ...dayEvents];
    const visibleItems = allItems.slice(0, 2);
    const remainingItems = allItems.length - 2;

    visibleItems.forEach((item) => {
      const itemElement = document.createElement("div");
      itemElement.className = "calendar-day-item";

      if ("dueDate" in item) {
        // Es una tarea
        itemElement.classList.add("day-item-task");
        itemElement.innerHTML = `<i class="fas fa-tasks"></i>`;
      } else {
        // Es un evento
        itemElement.classList.add("day-item-event");
        itemElement.innerHTML = `<i class="fas fa-calendar-alt"></i>`;
      }

      itemsContainer.appendChild(itemElement);
    });

    // Si hay más de 2 elementos, mostrar +
    if (remainingItems > 0) {
      const moreItemsElement = document.createElement("div");
      moreItemsElement.className = "more-items";
      moreItemsElement.textContent = `+${remainingItems}`;
      itemsContainer.appendChild(moreItemsElement);
    }

    dayElement.appendChild(itemsContainer);
  }

  // Click para mostrar detalles del día
  dayElement.addEventListener("click", () => showDayDetails(date));

  return dayElement;
}

// Modal con detalles de tareas/eventos para un día específico
function showDayDetails(date) {
  if (!dayDetailsModal || !dayDetailsTitle || !dayTasksList || !dayEventsList)
    return;

  selectedDate = date;

  // Formatear fecha para el título
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = date.toLocaleDateString("es-ES", options);

  dayDetailsTitle.textContent = `Actividades para el ${formattedDate}`;

  // Obtener tareas y eventos para este día usando los datos en caché
  const dayTasks = getTasksForDateFromCache(date);
  const dayEvents = getEventsForDateFromCache(date);

  // Mostrar tareas
  dayTasksList.innerHTML = "";
  if (dayTasks.length > 0) {
    dayTasks.forEach((task) => {
      const taskEl = createTaskElement(task);

      // Modificar los botones de editar dentro del modal de día
      const editBtn = taskEl.querySelector(".btn-edit");
      if (editBtn) {
        const originalClickHandler = editBtn.onclick;
        editBtn.onclick = function (e) {
          e.stopPropagation();
          // Cerrar el modal de detalles del día primero
          dayDetailsModal.style.display = "none";
          // Luego abrir el modal de edición
          openTaskModal(this.dataset.id);
        };
      }

      dayTasksList.appendChild(taskEl);
    });
  } else {
    dayTasksList.innerHTML = "<p>No hay tareas para este día</p>";
  }

  // Similar para los eventos
  dayEventsList.innerHTML = "";
  if (dayEvents.length > 0) {
    dayEvents.forEach((event) => {
      const eventEl = createEventElement(event);

      // Modificar los botones de editar dentro del modal de día
      const editBtn = eventEl.querySelector(".btn-edit");
      if (editBtn) {

        
        const originalClickHandler = editBtn.onclick;
        editBtn.onclick = function (e) {
          e.stopPropagation();
          // Cerrar el modal de detalles del día primero
          dayDetailsModal.style.display = "none";
          // Luego abrir el modal de edición
          openEventModal(this.dataset.id);
        };
      }

      dayEventsList.appendChild(eventEl);
    });
  } else {
    dayEventsList.innerHTML = "<p>No hay eventos para este día</p>";
  }

  // Mostrar modal
  dayDetailsModal.style.display = "block";
}

// Obtiene las tareas para una fecha específica desde la caché
function getTasksForDateFromCache(date) {
  // Usar los datos cacheados
  return cachedTasks.filter((task) => {
    const taskDate = new Date(task.dueDate);
    return isSameDay(taskDate, date);
  });
}

// Obtiene los eventos para una fecha específica desde la caché
function getEventsForDateFromCache(date) {
  // Usar los datos cacheados
  return cachedEvents.filter((event) => {
    const eventDate = new Date(event.date);
    return isSameDay(eventDate, date);
  });
}

// Inicializar módulo del calendario
function init() {
  setupCalendarEvents();
  renderCalendar();
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", init);

// Exportar funciones necesarias
window.renderCalendar = renderCalendar;
export { renderCalendar };
