// Formatea una fecha para mostrarla
export function formatDate(date, includeTime = false) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric"
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return date.toLocaleDateString("es-ES", options);
}

// Compara si dos fechas corresponden al mismo día
export function isSameDay(date1, date2) {
  if (!(date1 instanceof Date)) date1 = new Date(date1);
  if (!(date2 instanceof Date)) date2 = new Date(date2);
  
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Obtiene un elemento por su ID de una lista
export function findById(list, id) {
  return list.find(item => item._id === id || item.id === id) || null;
}

