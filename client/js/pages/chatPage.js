import { checkAuth } from "../auth/auth.js";
import { initChat } from "../features/chat.js";
import { formatDate } from "../utils/utils.js";

// Referencias a elementos del DOM
const currentDateTime = document.getElementById("currentDateTime");

// Actualiza fecha/hora
function updateDateTime() {
  const now = new Date();
  if (currentDateTime) {
    currentDateTime.textContent = formatDate(now, true);
    setTimeout(updateDateTime, 60000);
  }
}

// Inicializar chat
async function initChatPage() {
  const isUserAuthenticated = await checkAuth();

  if (isUserAuthenticated) {
    updateDateTime();

    // Verificar si el script de socket.io ya está cargado
    if (typeof io === "undefined") {
      console.warn(
        "Socket.io no está cargado correctamente. El chat puede no funcionar."
      );
      const errorElement = document.getElementById("chatMessages");
      if (errorElement) {
        errorElement.innerHTML = `
          <div class="chat-notice error">
            Error: Socket.io no está cargado correctamente.
            <a href="javascript:location.reload()">Recargar página</a>
          </div>
        `;
      }
      return;
    }

    initChat();
  }
}

document.addEventListener("DOMContentLoaded", initChatPage);
