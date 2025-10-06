// ========== MÓDULO DE LISTA DE INVITADOS ==========
// Maneja la visualización, filtrado y acciones en la lista de invitados

let invitadosData = [];
let filtroActual = "todos";

/**
 * Carga los invitados desde el backend
 */
async function cargarInvitados() {
  const listaContainer = document.getElementById("lista-invitados");
  listaContainer.innerHTML = '<div class="loading">Cargando...</div>';

  try {
    invitadosData = await window.API.obtenerInvitados();
    mostrarInvitados(invitadosData);
    actualizarContador();

    // Actualizar estadísticas si el módulo está disponible
    if (window.Estadisticas && window.Estadisticas.actualizar) {
      window.Estadisticas.actualizar(invitadosData);
    }
  } catch (error) {
    console.error("Error al obtener los invitados:", error);
    mostrarError(error);
  }
}

/**
 * Muestra error en la interfaz
 */
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
    cargarInvitados();
  });
}

/**
 * Muestra los invitados en la interfaz
 */
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

/**
 * Crea un card HTML para un invitado
 */
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

  // Puesto e institución
  let puestoHTML = "";
  if (invitado.puesto_completo || invitado.institucion) {
    puestoHTML = `
      <div class="puesto-institucion">
        ${
          invitado.puesto_completo
            ? `<div class="puesto">${invitado.puesto_completo}</div>`
            : ""
        }
        ${
          invitado.institucion
            ? `<div class="institucion">${invitado.institucion}</div>`
            : ""
        }
      </div>
    `;
  }

  // Badge de Invitado Especial
  let especialHTML = "";
  if (invitado.es_invitado_especial) {
    especialHTML =
      '<span class="badge badge-especial">🌟 Invitado Especial</span>';
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
            ${especialHTML}
            ${
              rolesHTML ||
              '<span class="badge badge-default">Sin roles asignados</span>'
            }
          </div>
        </div>
        <span class="id-badge">ID: ${invitado.id}</span>
      </div>
      ${puestoHTML}
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
          <button class="btn-edit" onclick="InvitadosLista.editar(${
            invitado.id
          })">
            ✏️ Editar
          </button>
          <button class="btn-delete" onclick="InvitadosLista.eliminar(${
            invitado.id
          })">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}

/**
 * Filtra invitados según el filtro actual
 */
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

/**
 * Configura los filtros de la lista
 */
function configurarFiltros() {
  const botonesFiltro = document.querySelectorAll(".btn-filter");

  botonesFiltro.forEach((boton) => {
    boton.addEventListener("click", () => {
      // Remover active de todos
      botonesFiltro.forEach((btn) => btn.classList.remove("active"));
      // Agregar active al clickeado
      boton.classList.add("active");
      // Actualizar filtro
      filtroActual = boton.dataset.filter;
      // Mostrar invitados filtrados
      mostrarInvitados(invitadosData);
    });
  });
}

/**
 * Actualiza el contador de invitados
 */
function actualizarContador(cantidad = null) {
  const contador = document.getElementById("contador-filtro");
  if (!contador) return;

  const count = cantidad !== null ? cantidad : invitadosData.length;
  contador.textContent = `Total: ${count} invitado${count !== 1 ? "s" : ""}`;
}

/**
 * Edita un invitado
 */
async function editarInvitado(id) {
  try {
    const invitado = invitadosData.find((inv) => inv.id === id);
    if (!invitado) {
      throw new Error("Invitado no encontrado");
    }

    // Llamar al módulo de formulario para editar
    if (window.InvitadosForm && window.InvitadosForm.cargarParaEdicion) {
      window.InvitadosForm.cargarParaEdicion(invitado);
      // Cambiar a la página de agregar
      window.Navigation.cambiarPagina("agregar");
      document.querySelector('[data-page="agregar"]').classList.add("active");
      document.querySelector('[data-page="lista"]').classList.remove("active");
    }
  } catch (error) {
    console.error("Error al cargar invitado para editar:", error);
    if (window.UI && window.UI.mostrarNotificacion) {
      window.UI.mostrarNotificacion(
        "❌ Error al cargar datos del invitado",
        "error"
      );
    }
  }
}

/**
 * Elimina un invitado
 */
async function eliminarInvitado(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar este invitado?")) {
    return;
  }

  try {
    await window.API.eliminarInvitado(id);
    console.log("Invitado eliminado:", id);

    // Recargar lista
    await cargarInvitados();

    // Mostrar notificación de éxito
    if (window.UI && window.UI.mostrarNotificacion) {
      window.UI.mostrarNotificacion(
        "✅ Invitado eliminado correctamente",
        "success"
      );
    }
  } catch (error) {
    console.error("Error al eliminar invitado:", error);
    if (window.UI && window.UI.mostrarNotificacion) {
      window.UI.mostrarNotificacion(
        "❌ Error al eliminar invitado: " + error.message,
        "error"
      );
    }
  }
}

/**
 * Obtiene los datos de invitados
 */
function obtenerInvitados() {
  return invitadosData;
}

// Exportar para uso global
window.InvitadosLista = {
  cargar: cargarInvitados,
  configurarFiltros,
  editar: editarInvitado,
  eliminar: eliminarInvitado,
  obtenerInvitados,
};
