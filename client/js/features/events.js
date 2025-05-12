import api from "../api/api.js";
import { formatDate } from "../utils/utils.js";
import { isAdmin } from "../auth/auth.js";
import { getEvents, invalidateCache } from "../api/dataCache.js";

// Referencias a elementos del DOM
const eventsList = document.getElementById("eventsList");
const eventModal = document.getElementById("eventModal");
const eventForm = document.getElementById("eventForm");
const eventModalTitle = document.getElementById("eventModalTitle");
const addEventBtn = document.getElementById("addEventBtn");
const closeModalBtns = document.querySelectorAll(".close-modal");

// Cargar eventos desde API
async function loadEvents() {
  try {
    // Usar el módulo de caché
    const response = await getEvents();
    if (response.success) {
      renderEvents();
    } else {
      console.error("Error al cargar eventos:", response.message);
    }
  } catch (error) {
    console.error("Error al cargar eventos:", error);
  }
}

// Renderiza los eventos en la interfaz
async function renderEvents() {
  if (!eventsList) return;

  try {
    // Usar el módulo de caché
    const response = await getEvents();
    if (!response.success) {
      throw new Error(response.message);
    }

    const events = response.data;

    eventsList.innerHTML = "";

    if (events.length === 0) {
      eventsList.innerHTML = `
        <div class="empty-events">
          <i class="fas fa-calendar-times"></i>
          <p>No hay eventos para mostrar.</p>
        </div>
      `;
      return;
    }

    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    sortedEvents.forEach((event) => {
      eventsList.appendChild(createEventElement(event));
    });
  } catch (error) {
    console.error("Error al renderizar eventos:", error);
    eventsList.innerHTML = `
      <div class="empty-events">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar los eventos.</p>
      </div>
    `;
  }
}

// Crea un elemento DOM para un evento
function createEventElement(event) {
  const eventEl = document.createElement("div");
  eventEl.className = "event-item";
  eventEl.dataset.id = event._id;

  const eventDate = new Date(event.date);
  const formattedDate = formatDate(eventDate, true);

  eventEl.innerHTML = `
    <div class="event-header">
      <h3 class="event-title">${event.title}</h3>
    </div>
    <div class="event-date">
      <i class="far fa-calendar-alt"></i> ${formattedDate}
    </div>
    ${
      event.location
        ? `<div class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>`
        : ""
    }
    <p class="event-details">${event.details || "Sin detalles"}</p>
    <div class="event-actions">
      <button class="btn-edit" data-id="${event._id}">
        <i class="fas fa-edit"></i> Editar
      </button>
      <button class="btn-delete" data-id="${event._id}">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  `;

  const editBtn = eventEl.querySelector(".btn-edit");
  const deleteBtn = eventEl.querySelector(".btn-delete");

  if (editBtn && deleteBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEventModal(event._id);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmDeleteEvent(event._id);
    });
  }

  return eventEl;
}

// Abre el modal para crear o editar un evento
async function openEventModal(eventId = null) {
  eventForm.reset();

  if (eventId) {
    try {
      const response = await api.getEvent(eventId);
      if (!response.success) {
        throw new Error(response.message);
      }

      const event = response.data;

      eventModalTitle.textContent = "Editar Evento";
      document.getElementById("eventId").value = event._id;
      document.getElementById("eventTitle").value = event.title;
      document.getElementById("eventDetails").value = event.details || "";
      document.getElementById("eventLocation").value = event.location || "";

      const eventDate = new Date(event.date);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, "0");
      const day = String(eventDate.getDate()).padStart(2, "0");
      const hours = String(eventDate.getHours()).padStart(2, "0");
      const minutes = String(eventDate.getMinutes()).padStart(2, "0");

      document.getElementById(
        "eventDate"
      ).value = `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error("Error al cargar el evento:", error);
    }
  } else {
    eventModalTitle.textContent = "Nuevo Evento";
    document.getElementById("eventId").value = "";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    document.getElementById(
      "eventDate"
    ).value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  eventModal.style.display = "block";
}

// Cierra el modal de eventos
function closeEventModal() {
  eventModal.style.display = "none";
}

// Manejador envío de formulario de evento
async function handleEventFormSubmit(e) {
  e.preventDefault();

  const eventId = document.getElementById("eventId").value;
  const title = document.getElementById("eventTitle").value.trim();
  const details = document.getElementById("eventDetails").value.trim();
  const date = document.getElementById("eventDate").value;
  const location = document.getElementById("eventLocation").value.trim();

  if (!title || !date) {
    alert("Por favor, complete los campos requeridos.");
    return;
  }

  const eventData = {
    title,
    details,
    date: new Date(date).toISOString(),
    location,
  };

  try {
    let response;

    if (eventId) {
      response = await api.updateEvent(eventId, eventData);
    } else {
      response = await api.createEvent(eventData);
    }

    if (response.success) {
      // Invalidar caché después de modificar
      invalidateCache("events");
      renderEvents();
      window.renderCalendar && window.renderCalendar();
      closeEventModal();
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error("Error al guardar el evento:", error);
    alert("Error al guardar el evento: " + error.message);
  }
}

// Confirma y elimina un evento
async function confirmDeleteEvent(eventId) {
  try {
    const response = await api.getEvent(eventId);
    if (!response.success) {
      throw new Error(response.message);
    }

    const event = response.data;

    if (
      confirm(
        `¿Estás seguro de que deseas eliminar el evento "${event.title}"?`
      )
    ) {
      const deleteResponse = await api.deleteEvent(eventId);

      if (deleteResponse.success) {
        // Invalidar caché después de eliminar
        invalidateCache("events");
        renderEvents();
        window.renderCalendar && window.renderCalendar();
      } else {
        throw new Error(deleteResponse.message);
      }
    }
  } catch (error) {
    console.error("Error al eliminar el evento:", error);
    alert("Error al eliminar el evento: " + error.message);
  }
}

// Configurar eventos para el módulo de eventos
function setupEventEvents() {
  if (addEventBtn) {
    addEventBtn.addEventListener("click", () => openEventModal());
  }

  if (eventForm) {
    eventForm.addEventListener("submit", (e) => handleEventFormSubmit(e));
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeEventModal();
    });
  });

  // Cerrar modales si clic fuera
  window.addEventListener("click", (e) => {
    if (e.target === eventModal) {
      closeEventModal();
    }
  });
}

// Inicializar módulo de eventos
function init() {
  loadEvents();
  setupEventEvents();

  if (addEventBtn) {
    addEventBtn.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", init);

window.loadEvents = loadEvents;
window.renderEvents = renderEvents;
export { loadEvents, renderEvents, createEventElement, openEventModal, closeEventModal };
