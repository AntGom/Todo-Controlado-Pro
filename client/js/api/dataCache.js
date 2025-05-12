import api from "./api.js";

// Estado de la caché
const cache = {
  tasks: {
    data: null,
    timestamp: null,
    filter: "all",
  },
  events: {
    data: null,
    timestamp: null,
  },
  messages: {
    data: null,
    timestamp: null,
  },
  unreadCounts: {
    data: null,
    timestamp: null,
  },
};

// Tiempo de validez (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

// Verificar si la caché es válida
function isCacheValid(cacheItem) {
  if (!cacheItem.data || !cacheItem.timestamp) return false;
  return Date.now() - cacheItem.timestamp < CACHE_TTL;
}

// Obtener tareas
export async function getTasks(filter = "all", forceRefresh = false) {
  // Si cambia el filtro o se fuerza actualización, invalida caché
  if (filter !== cache.tasks.filter || forceRefresh) {
    cache.tasks.data = null;
  }

  cache.tasks.filter = filter;

  if (isCacheValid(cache.tasks)) {
    console.log("Usando caché para tareas");
    return { success: true, data: cache.tasks.data };
  }

  try {
    console.log("Obteniendo tareas desde API");
    const response = await api.getTasks(filter);

    if (response.success) {
      cache.tasks.data = response.data;
      cache.tasks.timestamp = Date.now();
    }

    return response;
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    throw error;
  }
}

// Obtener eventos
export async function getEvents(forceRefresh = false) {
  if (isCacheValid(cache.events) && !forceRefresh) {
    console.log("Usando caché para eventos");
    return { success: true, data: cache.events.data };
  }

  try {
    console.log("Obteniendo eventos desde API");
    const response = await api.getEvents();

    if (response.success) {
      cache.events.data = response.data;
      cache.events.timestamp = Date.now();
    }

    return response;
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    throw error;
  }
}

// Obtener mensajes
export async function getMessages(
  room = "general",
  page = 1,
  limit = 50,
  forceRefresh = false
) {
  if (isCacheValid(cache.messages) && !forceRefresh) {
    console.log("Usando caché para mensajes");
    return { success: true, data: cache.messages.data };
  }

  try {
    console.log("Obteniendo mensajes desde API");
    const response = await api.getMessages(room, page, limit);

    if (response.success) {
      cache.messages.data = response.data;
      cache.messages.timestamp = Date.now();
    }

    return response;
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    throw error;
  }
}

// Obtener contadores de mensajes NO leídos
export async function getUnreadCounts(forceRefresh = false) {
  if (isCacheValid(cache.unreadCounts) && !forceRefresh) {
    console.log("Usando caché para contadores de mensajes no leídos");
    return { success: true, data: cache.unreadCounts.data };
  }

  try {
    console.log("Obteniendo contadores de mensajes no leídos desde API");
    const response = await api.getUnreadCounts();

    if (response.success) {
      cache.unreadCounts.data = response.data;
      cache.unreadCounts.timestamp = Date.now();
    }

    return response;
  } catch (error) {
    console.error("Error al obtener contadores de mensajes no leídos:", error);
    throw error;
  }
}

// Invalidar caché
export function invalidateCache(type) {
  if (type === "all") {
    cache.tasks.data = null;
    cache.events.data = null;
    cache.messages.data = null;
    cache.unreadCounts.data = null;
  } else if (type === "messages" || type === "unread_counts") {
    cache.messages.data = null;
    cache.unreadCounts.data = null; // Invalidar ambos cuando hay cambios
  } else if (cache[type]) {
    cache[type].data = null;
  }
}
