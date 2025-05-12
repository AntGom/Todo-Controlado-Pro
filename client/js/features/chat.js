import api from "../api/api.js";
import { isAuthenticated, isAdmin, currentUser } from "../auth/auth.js";
import { formatDate } from "../utils/utils.js";
import { getMessages, invalidateCache } from "../api/dataCache.js";
import { getWeather } from "../services/apiService.js";

// Socket.io para chat en tiempo real
let socket;

// Referencias a elementos del DOM
const chatMessages = document.getElementById("chatMessages");
const chatMessageInput = document.getElementById("chatMessageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const onlineCountElement = document.getElementById("onlineCount");
const onlineUsersList = document.getElementById("onlineUsersList");
const roomGeneral = document.getElementById("roomGeneral");
const currentChatTitle = document.getElementById("currentChatTitle");
const cityInput = document.getElementById("cityInput");
const searchWeatherBtn = document.getElementById("searchWeather");
const weatherInfo = document.getElementById("weatherInfo");

const defaultCity = "Sevilla";
let lastSearchedCity = defaultCity;

// Busca info del clima para una ciudad
async function searchWeather(city) {
  try {
    weatherInfo.innerHTML = "<p>Cargando información del clima...</p>";
    lastSearchedCity = city;

    // Obtener datos reales del clima
    const weatherText = await getWeather(city);

    // Mostrar resultado en input y aplicar estilo
    cityInput.value = weatherText;
    cityInput.classList.add("weather-result");
  } catch (error) {
    weatherInfo.innerHTML = "<p>Error al obtener el clima.</p>";
    console.error("Error al buscar el clima:", error);
  }
}

// Restaurar el input a su estado de búsqueda
function resetWeatherInput() {
  cityInput.value = lastSearchedCity;
  cityInput.classList.remove("weather-result");
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
searchWeather(defaultCity);
setupWeatherEvents();


// Estado del chat
let onlineUsers = [];
let allUsers = [];
let isConnected = false;
let currentRoom = "general";
let activePrivateChats = {};
let unreadMessages = {};

// Obtener o generar un ID de sala para chat privado
function getPrivateRoomId(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort();
  return `private_${sortedIds[0]}_${sortedIds[1]}`;
}

// Inicializar chat
async function initChat() {
  if (!isAuthenticated) return;

  // Cargar historial de mensajes de la sala general
  await loadMessages(currentRoom);

  // Cargar usuarios
  await loadAllUsers();

  // Conectar socket
  connectSocket();

  // Configurar eventos
  setupChatEvents();
}

// Cargar mensajes históricos para una sala
async function loadMessages(room = "general") {
  try {
    const response = await api.getMessages(room);
    if (response.success) {
      renderMessages(response.data.reverse());
    }
  } catch (error) {
    console.error("Error al cargar mensajes:", error);
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="chat-empty">
          <i class="fas fa-comment-slash"></i>
          <p>No se pudieron cargar los mensajes</p>
        </div>
      `;
    }
  }
}

// Cargar todos usuarios
async function loadAllUsers() {
  try {
    const response = await api.getUsers();
    if (response.success) {
      allUsers = response.data;
      updateAllUsersList();

      // Forzar actualización NO leídos
      if (socket && socket.connected) {
        socket.emit("request_unread_updates");
      }
    }
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
  }
}

// Conectar WebSocket
function connectSocket() {
  try {
    // Asegurarse de que usamos la URL correcta
    const socketURL =
      window.location.hostname === "localhost"
        ? `http://${window.location.hostname}:5000`
        : window.location.origin;

    socket = io(socketURL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Eventos del socket
    socket.on("connect", () => {
      isConnected = true;
      console.log("Conectado al servidor de chat");

      // Añadir mensaje de sistema
      addSystemMessage("Conectado al chat");
    });

    socket.on("disconnect", () => {
      isConnected = false;
      console.log("Desconectado del servidor de chat");

      // Añadir mensaje de sistema
      addSystemMessage("Desconectado del chat");
    });

    socket.on("user_connected", (data) => {
      console.log("Usuario conectado:", data);
      onlineUsers = data.onlineUsers;
      updateOnlineCount();
      updateAllUsersList();

      // Si no somos nosotros, mensaje de bienvenida en sala general
      if (
        data.userId !== currentUser._id.toString() &&
        currentRoom === "general"
      ) {
        addSystemMessage(`${data.username} se ha unido al chat`);
      }
    });

    socket.on("user_disconnected", (data) => {
      console.log("Usuario desconectado:", data);
      onlineUsers = data.onlineUsers;
      updateOnlineCount();
      updateAllUsersList();

      if (currentRoom === "general") {
        addSystemMessage(`${data.username} ha salido del chat`);
      }
    });

    socket.on("new_message", (message) => {
      // 1. Invalidar caché
      invalidateCache("messages");

      // 2. Determinar si el mensaje es propio
      const isOwnMessage =
        message.user &&
        message.user._id.toString() === currentUser._id.toString();

      // 3. Si es para la sala actual
      if (message.room === currentRoom) {
        appendMessage(message);

        // Scroll al final
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

        // 4. Resetear contador si es chat privado
        if (message.room.startsWith("private_") && !isOwnMessage) {
          const otherUserId = message.room
            .replace("private_", "")
            .replace(currentUser._id.toString(), "")
            .replace("_", "");
          unreadMessages[message.room] = 0;
          updateUnreadIndicator(otherUserId);
        }
      }
      // 5. Si es mensaje privado para nosotros (en otra sala)
      else if (
        message.room.startsWith("private_") &&
        message.room.includes(currentUser._id.toString()) &&
        !isOwnMessage
      ) {
        const otherUserId = message.room
          .replace("private_", "")
          .replace(currentUser._id.toString(), "")
          .replace("_", "");

        // Incrementar contador
        unreadMessages[message.room] = (unreadMessages[message.room] || 0) + 1;
        updateUnreadIndicator(otherUserId);
      }
    });

    // Dentro de connectSocket():
    socket.on("initial_unread_counts", (counts) => {
      Object.assign(unreadMessages, counts);
      updateAllUnreadIndicators();
    });

    function updateAllUnreadIndicators() {
      document.querySelectorAll(".user-item").forEach((item) => {
        const roomId = item.dataset.roomId;
        if (roomId && unreadMessages[roomId] > 0) {
          item.classList.add("unread");
        } else {
          item.classList.remove("unread");
        }
      });
    }

    socket.on("error", (error) => {
      console.error("Error en socket:", error);
      addSystemMessage(`Error: ${error.message}`);
    });
  } catch (error) {
    console.error("Error al inicializar socket:", error);
    addSystemMessage(`Error de conexión: ${error.message}`);
  }
}

// Configurar eventos del chat
function setupChatEvents() {
  if (!sendMessageBtn || !chatMessageInput) return;

  // Evento para enviar mensajes
  sendMessageBtn.addEventListener("click", sendMessage);

  chatMessageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Evento para sala general
  if (roomGeneral) {
    roomGeneral.addEventListener("click", () => {
      switchRoom("general");
    });
  }

  // Evento para eliminar mensajes
  if (chatMessages) {
    chatMessages.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("delete-message-btn") ||
        (e.target.parentElement &&
          e.target.parentElement.classList.contains("delete-message-btn"))
      ) {
        const button = e.target.classList.contains("delete-message-btn")
          ? e.target
          : e.target.parentElement;

        const messageId = button.dataset.id;
        if (messageId) {
          deleteMessage(messageId);
        }
      }
    });
  }
}

// Actualizar lista todos los usuarios (on/offline)
function updateAllUsersList() {
  if (!onlineUsersList || !currentUser || !allUsers.length) return;

  onlineUsersList.innerHTML = "";

  // Convertir array de usuarios online a un Map para fácil búsqueda
  const onlineUsersMap = new Map(
    onlineUsers.map((user) => [user.userId, user])
  );

  // Filtrar usuarios (exceptuando a uno mismo)
  const otherUsers = allUsers.filter((user) => user._id !== currentUser._id);

  if (otherUsers.length === 0) {
    onlineUsersList.innerHTML = `
      <div class="chat-notice">
        No hay otros usuarios registrados
      </div>
    `;
    return;
  }

  otherUsers.forEach((user) => {
    const userInitial = user.name.charAt(0).toUpperCase();
    const privateRoomId = getPrivateRoomId(
      currentUser._id.toString(),
      user._id
    );
    const hasUnread =
      unreadMessages[privateRoomId] && unreadMessages[privateRoomId] > 0;
    const isOnline = onlineUsersMap.has(user._id);

    const userElement = document.createElement("div");
    userElement.className = `user-item ${
      currentRoom === privateRoomId ? "active" : ""
    } ${hasUnread ? "unread" : ""}`;
    userElement.dataset.userId = user._id;
    userElement.dataset.roomId = privateRoomId;

    const avatarClass = user.role === "admin" ? "admin-bg" : "user-bg";

    userElement.innerHTML = `
      <div class="user-avatar-small ${avatarClass}">${userInitial}</div>
      <div>${user.name}</div>
      <div class="user-status ${isOnline ? "online" : "offline"}"></div>
    `;

    userElement.addEventListener("click", () => {
      const userId = userElement.dataset.userId;
      const roomId = userElement.dataset.roomId;
      switchRoom(roomId, user.name);

      // Limpiar indicador de no leídos
      unreadMessages[roomId] = 0;
      updateUnreadIndicator(userId);
    });

    onlineUsersList.appendChild(userElement);
  });
}

// Actualizar contador de usuarios online
function updateOnlineCount() {
  if (onlineCountElement) {
    onlineCountElement.textContent = onlineUsers.length;
  }
}

// Actualizar indicador de mensajes no leídos
function updateUnreadIndicator(userId) {
  const userElement = document.querySelector(
    `.user-item[data-user-id="${userId}"]`
  );
  if (!userElement) return;

  const roomId = userElement.dataset.roomId;

  if (unreadMessages[roomId] && unreadMessages[roomId] > 0) {
    userElement.classList.add("unread");
  } else {
    userElement.classList.remove("unread");
  }
}

// Cambiar de sala
async function switchRoom(roomId, username = null) {
  // 1. Actualizar estado local
  const previousRoom = currentRoom;
  currentRoom = roomId;

  // 2. Actualizar UI
  updateRoomUI(roomId, username);

  // 3. Cargar mensajes
  await loadMessages(roomId);

  // 4. Marcar como leídos si es chat privado
  if (roomId.startsWith("private_")) {
    try {
      const response = await api.markMessagesAsRead(roomId);

      if (response.success) {
        socket.emit("mark_as_read", { room: roomId });

        // Extraer ID del otro usuario
        const otherUserId = roomId
          .replace("private_", "")
          .replace(currentUser._id.toString(), "")
          .replace("_", "");

        // Resetear contador
        unreadMessages[roomId] = 0;
        updateUnreadIndicator(otherUserId);
      }
    } catch (error) {
      console.error("Error al marcar mensajes como leídos:", error);
    }
  }

  // 5. Scroll al final
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función auxiliar para actualizar UI
function updateRoomUI(roomId, username) {
  // Actualizar título
  if (currentChatTitle) {
    if (roomId === "general") {
      currentChatTitle.textContent = "Sala General";
      currentChatTitle.previousElementSibling.className = "fas fa-comments";
    } else {
      currentChatTitle.textContent = `Chat con ${username}`;
      currentChatTitle.previousElementSibling.className = "fas fa-user";
    }
  }

  // Actualizar sala activa
  if (roomGeneral) {
    roomGeneral.classList.toggle("active", roomId === "general");
  }

  // Actualizar usuarios destacados
  document.querySelectorAll(".user-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.roomId === roomId);
  });
}

// Enviar mensaje
function sendMessage() {
  const text = chatMessageInput.value.trim();

  if (!text || !isConnected) return;

  // Enviar mensaje a través de WebSocket
  socket.emit("send_message", {
    text,
    room: currentRoom,
  });

  // Limpiar input
  chatMessageInput.value = "";
}

// Eliminar mensaje (solo admin)
async function deleteMessage(messageId) {
  if (!isAdmin && !isOwnMessage(messageId)) return;

  try {
    const response = await api.deleteMessage(messageId);

    if (response.success) {
      // Invalidar caché
      invalidateCache("messages");

      // Recargar mensajes
      await loadMessages(currentRoom);

      addSystemMessage("Mensaje eliminado correctamente");
    }
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    addSystemMessage("Error al eliminar el mensaje");
  }
}

// Comprobar si un mensaje es propio
async function isOwnMessage(messageId) {
  if (!currentUser) return false;

  try {
    const response = await getMessages(currentRoom);
    if (!response.success) return false;

    const message = response.data.find((m) => m._id === messageId);
    return message && message.user && message.user._id === currentUser._id;
  } catch (error) {
    return false;
  }
}

// Añadir mensaje de sistema
function addSystemMessage(text) {
  if (!chatMessages) return;

  const systemMessage = document.createElement("div");
  systemMessage.className = "chat-notice";
  systemMessage.textContent = text;

  chatMessages.appendChild(systemMessage);

  // Scroll al último mensaje
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Renderizar todos los mensajes
function renderMessages(messages) {
  if (!chatMessages) return;

  chatMessages.innerHTML = "";

  if (!messages || messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="chat-empty">
        <i class="fas fa-comments"></i>
        <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
      </div>
    `;
    return;
  }

  messages.forEach((message) => {
    appendMessage(message);
  });

  // Scroll al último mensaje
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Añadir un mensaje individual al DOM
function appendMessage(message) {
  if (!currentUser || !chatMessages) return;

  const isOwnMessage = String(message.user._id) === String(currentUser._id);

  const messageElement = document.createElement("div");
  messageElement.className = `chat-message ${isOwnMessage ? "own" : "other"}`;
  messageElement.dataset.id = message._id;

  const adminBadge =
    message.user.role === "admin"
      ? '<span class="admin-badge">ADMIN</span>'
      : "";

  messageElement.innerHTML = `
    <div class="message-sender">${message.user.name} ${adminBadge} </div>
    <div class="message-text">${message.text}</div>
    <div class="message-time">${formatDate(
      new Date(message.createdAt),
      true
    )}</div>
    ${
      isAdmin || isOwnMessage
        ? `
      <div class="message-actions">
        <button class="delete-message-btn" data-id="${message._id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `
        : ""
    }
  `;

  chatMessages.appendChild(messageElement);
}

// Limpiar recursos al desconectarse
function cleanup() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  isConnected = false;
  onlineUsers = [];
}

export { initChat, cleanup };
