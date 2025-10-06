// ========== MÓDULO DE API ==========
// Maneja todas las comunicaciones con el backend Flask

// Configuración de API
const API_CONFIG = {
  BASE_URL: "http://127.0.0.1:5000",
  ENDPOINTS: {
    INVITADOS: "/api/invitados",
    GENERAR_INVITACIONES: "/api/invitaciones/generar",
  },
  MAX_RETRIES: 5,
  RETRY_DELAY: 1000,
};

// ========== FUNCIONES DE INVITADOS ==========

/**
 * Obtiene todos los invitados de la base de datos
 * @param {number} retryCount - Número de reintentos actuales
 * @returns {Promise<Array>} - Array de invitados
 */
async function obtenerInvitados(retryCount = 0) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVITADOS}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const invitados = await response.json();
    return invitados;
  } catch (error) {
    console.error("Error al obtener invitados:", error);

    // Reintentar automáticamente
    if (retryCount < API_CONFIG.MAX_RETRIES) {
      console.log(
        `Reintentando... (${retryCount + 1}/${API_CONFIG.MAX_RETRIES})`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.RETRY_DELAY)
      );
      return obtenerInvitados(retryCount + 1);
    }

    throw error;
  }
}

/**
 * Crea un nuevo invitado
 * @param {Object} data - Datos del invitado
 * @returns {Promise<Object>} - Invitado creado
 */
async function crearInvitado(data) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVITADOS}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Actualiza un invitado existente
 * @param {number} id - ID del invitado
 * @param {Object} data - Datos actualizados
 * @returns {Promise<Object>} - Invitado actualizado
 */
async function actualizarInvitado(id, data) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVITADOS}/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Elimina un invitado
 * @param {number} id - ID del invitado a eliminar
 * @returns {Promise<void>}
 */
async function eliminarInvitado(id) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVITADOS}/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

/**
 * Genera invitaciones para todos los invitados
 * @param {FormData} formData - Datos para generar invitaciones
 * @returns {Promise<Object>} - Resultado de la generación
 */
async function generarInvitaciones(formData) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERAR_INVITACIONES}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Exportar para uso global
window.API = {
  obtenerInvitados,
  crearInvitado,
  actualizarInvitado,
  eliminarInvitado,
  generarInvitaciones,
  CONFIG: API_CONFIG,
};
