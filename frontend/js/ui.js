// ========== MÓDULO DE UI (INTERFAZ DE USUARIO) ==========
// Maneja modales, notificaciones y otros elementos de UI compartidos

/**
 * Muestra un modal con título, mensaje e icono
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje del modal
 * @param {string} icono - Icono a mostrar (emoji)
 * @param {Function} callback - Función a ejecutar al cerrar el modal
 */
function mostrarModal(titulo, mensaje, icono = "✅", callback = null) {
  const overlay = document.getElementById("modal-overlay");
  const modalIcon = document.getElementById("modal-icon");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const btnOk = document.getElementById("modal-btn-ok");

  if (!overlay || !modalIcon || !modalTitle || !modalMessage || !btnOk) {
    console.error("Elementos del modal no encontrados");
    return;
  }

  modalIcon.textContent = icono;
  modalTitle.textContent = titulo;
  modalMessage.innerHTML = mensaje; // Permitir HTML en mensajes

  overlay.classList.add("show");

  // Manejador del botón OK
  const handleClick = () => {
    overlay.classList.remove("show");
    btnOk.removeEventListener("click", handleClick);
    if (callback) {
      callback();
    }
  };

  btnOk.addEventListener("click", handleClick);

  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      overlay.classList.remove("show");
      btnOk.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEsc);
      if (callback) {
        callback();
      }
    }
  };
  document.addEventListener("keydown", handleEsc);
}

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - Mensaje de la notificación
 * @param {string} tipo - Tipo de notificación: "info", "success", "error", "warning"
 */
function mostrarNotificacion(mensaje, tipo = "info") {
  // Crear notificación
  const notificacion = document.createElement("div");
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.textContent = mensaje;

  // Agregar al body
  document.body.appendChild(notificacion);

  // Animar entrada
  setTimeout(() => {
    notificacion.classList.add("show");
  }, 10);

  // Remover después de 3 segundos
  setTimeout(() => {
    notificacion.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(notificacion);
    }, 300);
  }, 3000);
}

/**
 * Muestra un diálogo de confirmación
 * @param {string} titulo - Título del diálogo
 * @param {string} mensaje - Mensaje del diálogo
 * @param {Function} onConfirm - Función a ejecutar si se confirma
 * @param {Function} onCancel - Función a ejecutar si se cancela
 */
function mostrarConfirmacion(titulo, mensaje, onConfirm, onCancel = null) {
  const overlay = document.getElementById("modal-overlay");
  const modalIcon = document.getElementById("modal-icon");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const modalFooter = overlay.querySelector(".modal-footer");

  if (!overlay || !modalIcon || !modalTitle || !modalMessage || !modalFooter) {
    // Fallback a confirm nativo
    if (confirm(`${titulo}\n\n${mensaje}`)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
    return;
  }

  modalIcon.textContent = "❓";
  modalTitle.textContent = titulo;
  modalMessage.textContent = mensaje;

  // Crear botones de confirmación/cancelar
  modalFooter.innerHTML = `
    <button class="modal-btn modal-btn-secondary" id="modal-btn-cancel">
      Cancelar
    </button>
    <button class="modal-btn modal-btn-primary" id="modal-btn-confirm">
      Confirmar
    </button>
  `;

  overlay.classList.add("show");

  const btnConfirm = document.getElementById("modal-btn-confirm");
  const btnCancel = document.getElementById("modal-btn-cancel");

  // Manejador de confirmación
  const handleConfirm = () => {
    overlay.classList.remove("show");
    // Restaurar botón original
    modalFooter.innerHTML = `
      <button class="modal-btn modal-btn-primary" id="modal-btn-ok">
        Aceptar
      </button>
    `;
    onConfirm();
  };

  // Manejador de cancelación
  const handleCancel = () => {
    overlay.classList.remove("show");
    // Restaurar botón original
    modalFooter.innerHTML = `
      <button class="modal-btn modal-btn-primary" id="modal-btn-ok">
        Aceptar
      </button>
    `;
    if (onCancel) {
      onCancel();
    }
  };

  btnConfirm.addEventListener("click", handleConfirm);
  btnCancel.addEventListener("click", handleCancel);

  // Cerrar con ESC (equivale a cancelar)
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      handleCancel();
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);
}

/**
 * Muestra un loader/spinner
 * @param {string} mensaje - Mensaje a mostrar junto al loader
 */
function mostrarLoader(mensaje = "Cargando...") {
  const overlay = document.getElementById("modal-overlay");
  const modal = overlay?.querySelector(".modal");

  if (!overlay || !modal) {
    console.warn("No se puede mostrar loader: elementos no encontrados");
    return;
  }

  modal.innerHTML = `
    <div class="loader-container">
      <div class="spinner"></div>
      <p>${mensaje}</p>
    </div>
  `;

  overlay.classList.add("show");
}

/**
 * Oculta el loader/spinner
 */
function ocultarLoader() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) {
    overlay.classList.remove("show");
  }
}

// Exportar para uso global
window.UI = {
  mostrarModal,
  mostrarNotificacion,
  mostrarConfirmacion,
  mostrarLoader,
  ocultarLoader,
};
