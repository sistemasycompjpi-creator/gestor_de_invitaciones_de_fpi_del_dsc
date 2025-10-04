// Estado global de la aplicación
let invitadosData = [];
let filtroActual = "todos";

// Configuración de reintentos
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const API_URL = "http://127.0.0.1:5000/api/invitados";

// Inicialización cuando el DOM está listo
window.addEventListener("DOMContentLoaded", () => {
  cargarInvitados();
  configurarFormulario();
  configurarFiltros();
});

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

  // Cargos y organizaciones
  let puestosHTML = "";
  if (invitado.puestos && invitado.puestos.length > 0) {
    puestosHTML = '<div class="puestos">';
    invitado.puestos.forEach((puesto) => {
      if (puesto.cargo || puesto.organizacion) {
        puestosHTML += `
          <div class="puesto-item">
            <span class="cargo">💼 ${puesto.cargo || "N/A"}</span>
            <span class="organizacion">${puesto.organizacion || "N/A"}</span>
          </div>
        `;
      }
    });
    puestosHTML += "</div>";
  }

  card.innerHTML = `
    <div class="card-header">
      <h3 class="nombre">${invitado.nombre_completo}</h3>
      <span class="id-badge">ID: ${invitado.id}</span>
    </div>
    <div class="card-body">
      <div class="roles">
        ${
          rolesHTML ||
          '<span class="badge badge-default">Sin roles asignados</span>'
        }
      </div>
      ${puestosHTML}
    </div>
    <div class="card-footer">
      <button class="btn-delete" onclick="eliminarInvitado(${invitado.id})">
        🗑️ Eliminar
      </button>
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
      cargarInvitados();

      // Mostrar mensaje de éxito
      mostrarNotificacion("✅ Invitado agregado correctamente", "success");
    } catch (error) {
      console.error("Error al agregar invitado:", error);
      mostrarNotificacion(
        "❌ Error al agregar invitado: " + error.message,
        "error"
      );
    }
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

// ========== SISTEMA DE NOTIFICACIONES ==========

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

// Hacer disponible globalmente para onclick
window.eliminarInvitado = eliminarInvitado;
