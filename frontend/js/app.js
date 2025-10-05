// Estado global de la aplicación
let invitadosData = [];
let filtroActual = "todos";
let paginaActual = "lista";

// Configuración de reintentos
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const API_URL = "http://127.0.0.1:5000/api/invitados";

// Inicialización cuando el DOM está listo
window.addEventListener("DOMContentLoaded", () => {
  configurarNavegacion();
  cargarInvitados();
  configurarFormulario();
  configurarFiltros();
  actualizarEstadisticas();
});

// ========== SISTEMA DE NAVEGACIÓN ==========

function configurarNavegacion() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const pagina = item.dataset.page;
      cambiarPagina(pagina);

      // Actualizar navegación activa
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });
}

function cambiarPagina(nombrePagina) {
  // Ocultar todas las páginas
  const todasLasPaginas = document.querySelectorAll(".page");
  todasLasPaginas.forEach((pagina) => {
    pagina.classList.remove("active");
  });

  // Mostrar la página seleccionada
  const paginaSeleccionada = document.getElementById(`page-${nombrePagina}`);
  if (paginaSeleccionada) {
    paginaSeleccionada.classList.add("active");
    paginaActual = nombrePagina;

    // Actualizar datos si es necesario
    if (nombrePagina === "lista") {
      mostrarInvitados(invitadosData);
    } else if (nombrePagina === "estadisticas") {
      actualizarEstadisticas();
    }
  }
}

// ========== FUNCIONES DE CARGA DE DATOS ==========

function cargarInvitados(retryCount = 0) {
  const listaContainer = document.getElementById("lista-invitados");

  fetch(API_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "La respuesta de la red no fue exitosa. Código: " + response.status
        );
      }
      return response.json();
    })
    .then((invitados) => {
      invitadosData = invitados;
      mostrarInvitados(invitados);
      actualizarContador();
      actualizarEstadisticas();
    })
    .catch((error) => {
      console.error("Error al obtener los invitados:", error);

      // Reintentar automáticamente
      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1;
        console.log(`Reintentando conexión... (${nextRetry}/${MAX_RETRIES})`);
        listaContainer.innerHTML = `
          <div class="loading">
            Conectando al servidor... (intento ${nextRetry}/${MAX_RETRIES})
          </div>
        `;

        setTimeout(() => {
          cargarInvitados(nextRetry);
        }, RETRY_DELAY);
        return;
      }

      // Mostrar error con botón de recarga
      mostrarError(error);
    });
}

function mostrarError(error) {
  const listaContainer = document.getElementById("lista-invitados");
  let message = `Error al cargar los datos: ${error.message}`;

  if (
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError")
  ) {
    message +=
      " — No se pudo conectar al servidor. El backend Flask puede estar iniciándose.";
  }

  listaContainer.innerHTML = `
    <div class="error-container">
      <p class="error-message">❌ ${message}</p>
      <button id="btn-recargar" class="btn btn-secondary">
        🔄 Recargar Datos
      </button>
    </div>
  `;

  document.getElementById("btn-recargar")?.addEventListener("click", () => {
    listaContainer.innerHTML = '<div class="loading">Cargando...</div>';
    cargarInvitados(0);
  });
}

// ========== FUNCIONES DE VISUALIZACIÓN ==========

function mostrarInvitados(invitados) {
  const listaContainer = document.getElementById("lista-invitados");

  // Filtrar según el filtro activo
  const invitadosFiltrados = filtrarInvitados(invitados);

  if (invitadosFiltrados.length === 0) {
    listaContainer.innerHTML = `
      <div class="empty-state">
        <p>📭 No hay invitados que coincidan con el filtro seleccionado.</p>
      </div>
    `;
    return;
  }

  listaContainer.innerHTML = "";

  invitadosFiltrados.forEach((invitado) => {
    const card = crearCardInvitado(invitado);
    listaContainer.appendChild(card);
  });

  actualizarContador(invitadosFiltrados.length);
}

function crearCardInvitado(invitado) {
  const card = document.createElement("div");
  card.className = "invitado-card";
  card.dataset.id = invitado.id;

  // Nombre y roles
  let rolesHTML = "";
  if (invitado.es_asesor_t1) {
    rolesHTML += '<span class="badge badge-t1">👨‍🏫 Asesor T1</span>';
  }
  if (invitado.es_asesor_t2) {
    rolesHTML += '<span class="badge badge-t2">👩‍🏫 Asesor T2</span>';
  }
  if (invitado.puede_ser_jurado_protocolo) {
    rolesHTML +=
      '<span class="badge badge-protocolo">📝 Jurado Protocolo</span>';
  }
  if (invitado.puede_ser_jurado_informe) {
    rolesHTML += '<span class="badge badge-informe">📄 Jurado Informe</span>';
  }

  // Cargos y organizaciones - cada uno en su propia línea
  let puestosHTML = "";
  if (invitado.puestos && invitado.puestos.length > 0) {
    invitado.puestos.forEach((puesto) => {
      if (puesto.cargo || puesto.organizacion) {
        puestosHTML += `
          <div class="puesto-line">
            <span class="cargo">💼 ${puesto.cargo || "N/A"}</span>
            <span class="organizacion"> - ${puesto.organizacion || "N/A"}</span>
          </div>
        `;
      }
    });
  }

  // Nota opcional
  let notaHTML = "";
  if (invitado.nota && invitado.nota.trim() !== "") {
    notaHTML = `<span class="nota-invitado">${invitado.nota}</span>`;
  }

  card.innerHTML = `
    <div class="card-content">
      <div class="card-line-1">
        <div class="card-line-1-left">
          <h3 class="nombre">${invitado.nombre_completo}</h3>
          <div class="roles">
            ${
              rolesHTML ||
              '<span class="badge badge-default">Sin roles asignados</span>'
            }
          </div>
        </div>
        <span class="id-badge">ID: ${invitado.id}</span>
      </div>
      ${puestosHTML}
      <div class="caracter-line">
        <div class="caracter-invitacion">${
          invitado.caracter_invitacion || "Sin especificar"
        }</div>
      </div>
      <div class="actions-line">
        <div class="actions-line-left">
          ${notaHTML}
        </div>
        <div class="actions-line-right">
          <button class="btn-edit" onclick="editarInvitado(${invitado.id})">
            ✏️ Editar
          </button>
          <button class="btn-delete" onclick="eliminarInvitado(${invitado.id})">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}

// ========== FUNCIONES DE FILTRADO ==========

function filtrarInvitados(invitados) {
  switch (filtroActual) {
    case "asesor_t1":
      return invitados.filter((inv) => inv.es_asesor_t1);
    case "asesor_t2":
      return invitados.filter((inv) => inv.es_asesor_t2);
    case "jurado_protocolo":
      return invitados.filter((inv) => inv.puede_ser_jurado_protocolo);
    case "jurado_informe":
      return invitados.filter((inv) => inv.puede_ser_jurado_informe);
    case "todos":
    default:
      return invitados;
  }
}

function configurarFiltros() {
  const botonesFiltro = document.querySelectorAll(".btn-filter");

  botonesFiltro.forEach((boton) => {
    boton.addEventListener("click", () => {
      // Actualizar estado activo
      botonesFiltro.forEach((b) => b.classList.remove("active"));
      boton.classList.add("active");

      // Aplicar filtro
      filtroActual = boton.dataset.filter;
      mostrarInvitados(invitadosData);
    });
  });
}

function actualizarContador(cantidad = null) {
  const contador = document.getElementById("contador-filtro");
  const count = cantidad !== null ? cantidad : invitadosData.length;
  contador.textContent = `Total: ${count} invitado${count !== 1 ? "s" : ""}`;
}

// ========== FUNCIONES DEL FORMULARIO ==========

function configurarFormulario() {
  const form = document.getElementById("form-invitado");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {};

    // Obtener todos los campos
    formData.forEach((value, key) => {
      if (key.startsWith("es_asesor_")) {
        data[key] = true; // Checkbox marcado
      } else {
        data[key] = value.trim() || null;
      }
    });

    // Asegurar que los checkboxes no marcados sean false
    data.es_asesor_t1 = formData.has("es_asesor_t1");
    data.es_asesor_t2 = formData.has("es_asesor_t2");

    // Verificar si estamos en modo edición
    const submitBtn = form.querySelector('button[type="submit"]');
    const isEditMode = submitBtn.dataset.editMode === "true";

    if (isEditMode && invitadoEnEdicion) {
      // Actualizar invitado existente
      await actualizarInvitado(invitadoEnEdicion.id, data);
      form.reset();
      return;
    }

    // Crear nuevo invitado
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al crear el invitado");
      }

      const nuevoInvitado = await response.json();
      console.log("Invitado creado:", nuevoInvitado);

      // Limpiar formulario
      form.reset();

      // Recargar lista
      await cargarInvitados();

      // Actualizar estadísticas
      actualizarEstadisticas();

      // Mostrar modal de éxito con redirección
      mostrarModal(
        "¡Invitado Agregado!",
        "El invitado se ha registrado correctamente. Redirigiendo a la lista de invitados...",
        "✅",
        () => {
          cambiarPagina("lista");
          document.querySelector('[data-page="lista"]').classList.add("active");
          document
            .querySelector('[data-page="agregar"]')
            .classList.remove("active");
        }
      );
    } catch (error) {
      console.error("Error al agregar invitado:", error);
      mostrarNotificacion(
        "❌ Error al agregar invitado: " + error.message,
        "error"
      );
    }
  });

  // Evento para limpiar modo edición al resetear el formulario
  form.addEventListener("reset", () => {
    invitadoEnEdicion = null;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "✅ Guardar Invitado";
    delete submitBtn.dataset.editMode;
  });
}

// ========== FUNCIÓN PARA ELIMINAR INVITADO ==========

async function eliminarInvitado(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este invitado?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error al eliminar el invitado");
    }

    console.log("Invitado eliminado:", id);

    // Recargar lista
    cargarInvitados();

    // Actualizar estadísticas
    actualizarEstadisticas();

    // Mostrar mensaje de éxito
    mostrarNotificacion("✅ Invitado eliminado correctamente", "success");
  } catch (error) {
    console.error("Error al eliminar invitado:", error);
    mostrarNotificacion(
      "❌ Error al eliminar invitado: " + error.message,
      "error"
    );
  }
}

// ========== ESTADÍSTICAS ==========

function actualizarEstadisticas() {
  if (invitadosData.length === 0) return;

  // Total de invitados
  document.getElementById("stat-total").textContent = invitadosData.length;

  // Asesores T1
  const t1Count = invitadosData.filter((inv) => inv.es_asesor_t1).length;
  document.getElementById("stat-t1").textContent = t1Count;

  // Asesores T2
  const t2Count = invitadosData.filter((inv) => inv.es_asesor_t2).length;
  document.getElementById("stat-t2").textContent = t2Count;

  // Jurados Protocolo
  const protocoloCount = invitadosData.filter(
    (inv) => inv.puede_ser_jurado_protocolo
  ).length;
  document.getElementById("stat-protocolo").textContent = protocoloCount;

  // Jurados Informe
  const informeCount = invitadosData.filter(
    (inv) => inv.puede_ser_jurado_informe
  ).length;
  document.getElementById("stat-informe").textContent = informeCount;

  // Ambos jurados (protocolo E informe)
  const ambosCount = invitadosData.filter(
    (inv) => inv.puede_ser_jurado_protocolo && inv.puede_ser_jurado_informe
  ).length;
  document.getElementById("stat-ambos").textContent = ambosCount;
}

// ========== SISTEMA DE MODAL ==========

function mostrarModal(titulo, mensaje, icono = "✅", callback = null) {
  const overlay = document.getElementById("modal-overlay");
  const modalIcon = document.getElementById("modal-icon");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const btnOk = document.getElementById("modal-btn-ok");

  modalIcon.textContent = icono;
  modalTitle.textContent = titulo;
  modalMessage.textContent = mensaje;

  overlay.classList.add("show");

  // Manejador del botón OK
  const handleClick = () => {
    overlay.classList.remove("show");
    btnOk.removeEventListener("click", handleClick);
    if (callback) {
      setTimeout(callback, 300);
    }
  };

  btnOk.addEventListener("click", handleClick);

  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      overlay.classList.remove("show");
      document.removeEventListener("keydown", handleEsc);
      if (callback) {
        setTimeout(callback, 300);
      }
    }
  };
  document.addEventListener("keydown", handleEsc);
}

// ========== SISTEMA DE NOTIFICACIONES (Deprecado) ==========

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
      notificacion.remove();
    }, 300);
  }, 3000);
}

// ========== FUNCIÓN PARA EDITAR INVITADO ==========

let invitadoEnEdicion = null;

async function editarInvitado(id) {
  try {
    // Obtener datos del invitado
    const invitado = invitadosData.find((inv) => inv.id === id);
    if (!invitado) {
      throw new Error("Invitado no encontrado");
    }

    // Guardar referencia del invitado en edición
    invitadoEnEdicion = invitado;

    // Cambiar a la página de agregar
    cambiarPagina("agregar");
    document.querySelector('[data-page="agregar"]').classList.add("active");
    document.querySelector('[data-page="lista"]').classList.remove("active");

    // Llenar formulario con datos del invitado
    const form = document.getElementById("form-invitado");

    // Nombre
    form.querySelector("#nombre_completo").value =
      invitado.nombre_completo || "";

    // Carácter de la invitación
    form.querySelector("#caracter_invitacion").value =
      invitado.caracter_invitacion || "";

    // Nota del invitado
    form.querySelector("#nota").value = invitado.nota || "";

    // Cargos y organizaciones
    if (invitado.puestos && invitado.puestos.length > 0) {
      invitado.puestos.forEach((puesto, index) => {
        const num = index + 1;
        const cargoInput = form.querySelector(`#cargo_${num}`);
        const orgInput = form.querySelector(`#organizacion_${num}`);

        if (cargoInput) cargoInput.value = puesto.cargo || "";
        if (orgInput) orgInput.value = puesto.organizacion || "";
      });
    }

    // Checkboxes de asesoría
    form.querySelector("#es_asesor_t1").checked =
      invitado.es_asesor_t1 || false;
    form.querySelector("#es_asesor_t2").checked =
      invitado.es_asesor_t2 || false;

    // Cambiar el texto del botón submit
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "💾 Actualizar Invitado";
    submitBtn.dataset.editMode = "true";

    // Scroll al inicio
    window.scrollTo(0, 0);

    mostrarNotificacion(
      "📝 Editando invitado: " + invitado.nombre_completo,
      "info"
    );
  } catch (error) {
    console.error("Error al cargar invitado para editar:", error);
    mostrarNotificacion("❌ Error al cargar datos del invitado", "error");
  }
}

async function actualizarInvitado(id, data) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar el invitado");
    }

    const invitadoActualizado = await response.json();
    console.log("Invitado actualizado:", invitadoActualizado);

    // Recargar lista
    await cargarInvitados();

    // Actualizar estadísticas
    actualizarEstadisticas();

    // Limpiar modo edición
    invitadoEnEdicion = null;

    // Restaurar botón submit
    const form = document.getElementById("form-invitado");
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = "✅ Guardar Invitado";
    delete submitBtn.dataset.editMode;

    // Mostrar modal de éxito con redirección
    mostrarModal(
      "¡Invitado Actualizado!",
      "Los cambios se han guardado correctamente. Redirigiendo a la lista de invitados...",
      "✅",
      () => {
        cambiarPagina("lista");
        document.querySelector('[data-page="lista"]').classList.add("active");
        document
          .querySelector('[data-page="agregar"]')
          .classList.remove("active");
      }
    );
  } catch (error) {
    console.error("Error al actualizar invitado:", error);
    mostrarNotificacion(
      "❌ Error al actualizar invitado: " + error.message,
      "error"
    );
  }
}

// Hacer disponible globalmente para onclick
window.eliminarInvitado = eliminarInvitado;
