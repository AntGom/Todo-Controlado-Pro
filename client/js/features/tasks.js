import api from "../api/api.js";
import { formatDate } from "../utils/utils.js";
import { isAdmin } from "../auth/auth.js";
import { getTasks, invalidateCache } from "../api/dataCache.js";

// Referencias a elementos del DOM
const tasksList = document.getElementById("tasksList");
const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");
const addTaskBtn = document.getElementById("addTaskBtn");
const closeModalBtns = document.querySelectorAll(".close-modal");

// Variable para filtro actual
let currentFilter = "all";

// Variable para ID de tarea actual en modal
let currentTaskId = null;

// Cargar tareas desde la API
async function loadTasks() {
  try {
    // Usar el módulo de caché para obtener tareas
    const response = await getTasks(currentFilter);
    if (response.success) {
      renderTasks(currentFilter);
    } else {
      console.error("Error al cargar tareas:", response.message);
    }
  } catch (error) {
    console.error("Error al cargar tareas:", error);
  }
}

// Renderiza las tareas en la interfaz
async function renderTasks(filter = currentFilter) {
  if (!tasksList) return;

  try {
    // Usar el módulo de caché para obtener tareas con el filtro actual
    const response = await getTasks(filter);
    if (!response.success) {
      throw new Error(response.message);
    }

    const tasks = response.data;

    tasksList.innerHTML = "";

    if (tasks.length === 0) {
      tasksList.innerHTML = `
        <div class="empty-tasks">
          <i class="fas fa-clipboard-list"></i>
          <p>No hay tareas para mostrar.</p>
        </div>
      `;
      return;
    }

    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );

    sortedTasks.forEach((task) => {
      tasksList.appendChild(createTaskElement(task));
    });
  } catch (error) {
    console.error("Error al renderizar tareas:", error);
    tasksList.innerHTML = `
      <div class="empty-tasks">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las tareas.</p>
      </div>
    `;
  }
}

// Crea un elemento DOM para una tarea
function createTaskElement(task) {
  const taskEl = document.createElement("div");
  taskEl.className = "task-item";
  taskEl.dataset.id = task._id;

  const dueDate = new Date(task.dueDate);
  const formattedDate = formatDate(dueDate, true);

  const statusText = {
    pending: "Pendiente",
    inProgress: "En Progreso",
    completed: "Completada",
  };

  // Verificar si la tarea tiene fotos
  const hasPhotos = task.photos && task.photos.length > 0;
  const photosIndicator = hasPhotos
    ? `<div class="task-photos-indicator"><i class="fas fa-images"></i> ${task.photos.length}</div>`
    : "";

  taskEl.innerHTML = `
    <div class="task-header">
      <h3 class="task-title">${task.title}</h3>
      <span class="task-status status-${task.status}">${
    statusText[task.status]
  }</span>
    </div>
    <div class="task-date">
      <i class="far fa-calendar-alt"></i> ${formattedDate}
    </div>
    <p class="task-description">${task.description || "Sin descripción"}</p>
    ${photosIndicator}
    <div class="task-actions">
      <button class="btn-edit" data-id="${task._id}">
        <i class="fas fa-edit"></i> Editar
      </button>
      <button class="btn-delete" data-id="${task._id}">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
    </div>
  `;

  const editBtn = taskEl.querySelector(".btn-edit");
  const deleteBtn = taskEl.querySelector(".btn-delete");

  if (editBtn && deleteBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTaskModal(task._id);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmDeleteTask(task._id);
    });
  }

  return taskEl;
}

// Abre el modal para crear o editar una tarea
async function openTaskModal(taskId = null) {
  taskForm.reset();
  currentTaskId = taskId;

  // Eliminar el área de fotos existente si hay
  const existingPhotosContainer = document.getElementById(
    "taskPhotosContainer"
  );
  if (existingPhotosContainer) {
    existingPhotosContainer.remove();
  }

  if (taskId) {
    try {
      const response = await api.getTask(taskId);
      if (!response.success) {
        throw new Error(response.message);
      }

      const task = response.data;

      modalTitle.textContent = "Editar Tarea";
      document.getElementById("taskId").value = task._id;
      document.getElementById("title").value = task.title;
      document.getElementById("description").value = task.description || "";

      const dueDate = new Date(task.dueDate);
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, "0");
      const day = String(dueDate.getDate()).padStart(2, "0");
      const hours = String(dueDate.getHours()).padStart(2, "0");
      const minutes = String(dueDate.getMinutes()).padStart(2, "0");

      document.getElementById(
        "dueDate"
      ).value = `${year}-${month}-${day}T${hours}:${minutes}`;
      document.getElementById("status").value = task.status;

      // Añadir área de fotos solo si hay ID de tarea
      addPhotosSection(task);
    } catch (error) {
      console.error("Error al cargar la tarea:", error);
    }
  } else {
    modalTitle.textContent = "Nueva Tarea";
    document.getElementById("taskId").value = "";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    document.getElementById(
      "dueDate"
    ).value = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById("status").value = "pending";
  }

  taskModal.style.display = "block";
}

// Añade el área de fotos al modal de tarea
function addPhotosSection(task = null) {
  // Crear contenedor para fotos
  const photosContainer = document.createElement("div");
  photosContainer.id = "taskPhotosContainer";
  photosContainer.className = "task-photos-container";

  // Crear encabezado con título y botón
  const photosHeader = document.createElement("div");
  photosHeader.className = "task-photos-header";
  photosHeader.innerHTML = `
    <h3><i class="fas fa-images"></i> Fotos</h3>
    <div class="task-photos-upload">
      <input type="file" id="taskPhotoUpload" accept="image/*" multiple>
      <label for="taskPhotoUpload"><i class="fas fa-upload"></i> Subir foto</label>
    </div>
  `;

  // Crear cuadrícula para fotos
  const photosGrid = document.createElement("div");
  photosGrid.id = "taskPhotosGrid";
  photosGrid.className = "task-photos-grid";

  // Añadir estado de subida
  const uploadStatus = document.createElement("div");
  uploadStatus.id = "uploadStatus";
  uploadStatus.className = "task-photos-upload-status";

  // Añadir elementos al contenedor
  photosContainer.appendChild(photosHeader);
  photosContainer.appendChild(photosGrid);
  photosContainer.appendChild(uploadStatus);

  // Añadir al formulario antes del botón
  const saveBtn = document.getElementById("saveTaskBtn");
  taskForm.insertBefore(photosContainer, saveBtn);

  // Mostrar fotos si hay
  if (task && task.photos && task.photos.length > 0) {
    renderTaskPhotos(task.photos);
  }

  // Añadir evento para subir fotos
  const photoInput = document.getElementById("taskPhotoUpload");
  photoInput.addEventListener("change", handlePhotoUpload);
}

// Renderiza fotos de una tarea
function renderTaskPhotos(photos) {
  const photosGrid = document.getElementById("taskPhotosGrid");
  if (!photosGrid) return;

  photosGrid.innerHTML = "";

  if (photos.length === 0) {
    photosGrid.innerHTML = `
      <div class="task-photo-item">
        <div class="task-photo-placeholder">
          <i class="fas fa-image"></i>
        </div>
      </div>
    `;
    return;
  }

  photos.forEach((photo) => {
    const photoItem = document.createElement("div");
    photoItem.className = "task-photo-item";
    photoItem.dataset.id = photo._id;

    const photoUrl = `http://localhost:5000/${photo.path}`;

    photoItem.innerHTML = `
      <img src="${photoUrl}" alt="Foto de tarea">
      <div class="task-photo-actions">
        <button class="btn-delete-photo" data-id="${photo._id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;

    photosGrid.appendChild(photoItem);
  });

  // Añadir eventos para eliminar fotos
  photosGrid.querySelectorAll(".btn-delete-photo").forEach((btn) => {
    btn.addEventListener("click", handleDeletePhoto);
  });
}

// Manejar subida de fotos
async function handlePhotoUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const taskId = currentTaskId;
  if (!taskId) {
    alert("Primero debe guardar la tarea para poder añadir fotos");
    return;
  }

  const uploadStatus = document.getElementById("uploadStatus");
  uploadStatus.innerHTML = `
    <div>Subiendo ${files.length} foto(s)...</div>
    <div class="upload-status-progress">
      <div class="upload-status-bar" style="width: 0%"></div>
    </div>
  `;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await api.uploadTaskPhoto(taskId, file);

      if (response.success) {
        // Actualizar barra progreso
        const progress = ((i + 1) / files.length) * 100;
        const progressBar = document.querySelector(".upload-status-bar");
        if (progressBar) {
          progressBar.style.width = `${progress}%`;
        }

        // Recargar las fotos cuando termine
        if (i === files.length - 1) {
          uploadStatus.innerHTML = `<div class="success">Fotos subidas correctamente</div>`;

          // Recargar tarea para tener fotos actualizadas
          const taskResponse = await api.getTask(taskId);
          if (taskResponse.success) {
            renderTaskPhotos(taskResponse.data.photos);
          }
          // Invalidar caché
          invalidateCache("tasks");
        }
      }
    } catch (error) {
      console.error("Error al subir foto:", error);
      uploadStatus.innerHTML = `<div class="error">Error al subir foto(s): ${error.message}</div>`;
      break;
    }
  }

  // Limpiar el input
  e.target.value = "";
}

// Manejador borrar fotos
async function handleDeletePhoto(e) {
  const btn = e.target.closest(".btn-delete-photo");
  if (!btn) return;

  const photoId = btn.dataset.id;
  const taskId = currentTaskId;

  if (!photoId || !taskId) return;

  if (confirm("¿Estás seguro de que deseas eliminar esta foto?")) {
    try {
      const response = await api.deleteTaskPhoto(taskId, photoId);
      if (response.success) {
        // Eliminar el elemento de la interfaz
        const photoItem = btn.closest(".task-photo-item");
        if (photoItem) {
          photoItem.remove();
        }

        // Verificar si no quedan fotos
        const photosGrid = document.getElementById("taskPhotosGrid");
        if (photosGrid && photosGrid.children.length === 0) {
          renderTaskPhotos([]);
        }

        // Invalidar caché
        invalidateCache("tasks");
      }
    } catch (error) {
      console.error("Error al eliminar foto:", error);
      alert("Error al eliminar la foto: " + error.message);
    }
  }
}

// Cierra el modal de tareas
function closeTaskModal() {
  taskModal.style.display = "none";
  currentTaskId = null;
}

// Manejador envío de formulario de tarea
async function handleTaskFormSubmit(event) {
  event.preventDefault();

  const taskId = document.getElementById("taskId").value;
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;
  const status = document.getElementById("status").value;

  if (!title || !dueDate) {
    alert("Por favor, complete los campos requeridos.");
    return;
  }

  const taskData = {
    title,
    description,
    dueDate: new Date(dueDate).toISOString(),
    status,
  };

  try {
    let response;

    if (taskId) {
      response = await api.updateTask(taskId, taskData);
    } else {
      response = await api.createTask(taskData);
      // Guardar ID de nueva tarea para poder subir fotos
      if (response.success) {
        currentTaskId = response.data._id;
      }
    }

    if (response.success) {
      // Invalidar caché después de modificar
      invalidateCache("tasks");
      renderTasks(currentFilter);
      window.renderCalendar && window.renderCalendar();
      closeTaskModal();
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error("Error al guardar la tarea:", error);
    alert("Error al guardar la tarea: " + error.message);
  }
}

// Confirma y elimina tarea
async function confirmDeleteTask(taskId) {
  try {
    const response = await api.getTask(taskId);
    if (!response.success) {
      throw new Error(response.message);
    }

    const task = response.data;

    if (
      confirm(`¿Estás seguro de que deseas eliminar la tarea "${task.title}"?`)
    ) {
      const deleteResponse = await api.deleteTask(taskId);

      if (deleteResponse.success) {
        // Invalidar caché después de eliminar
        invalidateCache("tasks");
        renderTasks(currentFilter);
        window.renderCalendar && window.renderCalendar();
      } else {
        throw new Error(deleteResponse.message);
      }
    }
  } catch (error) {
    console.error("Error al eliminar la tarea:", error);
    alert("Error al eliminar la tarea: " + error.message);
  }
}

// Configurar eventos para tareas
function setupTaskEvents() {
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => openTaskModal());
  }

  if (taskForm) {
    taskForm.addEventListener("submit", (e) => handleTaskFormSubmit(e));
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeTaskModal();
    });
  });

  // Cerrar modales si clic fuera
  window.addEventListener("click", (e) => {
    if (e.target === taskModal) {
      closeTaskModal();
    }
  });
}

// Inicializar módulo de tareas
function init() {
  loadTasks();
  setupTaskEvents();

  if (addTaskBtn) {
    addTaskBtn.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", init);

window.loadTasks = loadTasks;
window.renderTasks = renderTasks;
export {
  loadTasks,
  renderTasks,
  createTaskElement,
  openTaskModal,
  closeTaskModal,
};
