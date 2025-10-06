const InvitadosLista = (() => {
  let invitadosData = [];
  let filtroActual = "todos";

  // Referencias al DOM
  let listaContainer;
  let modalOverlay, modalTitle, modalGuestName, modalForm, btnCancel, btnGenerate;
  let currentGuestId = null;

  /**
   * Inicializa el módulo, obtiene referencias del DOM y configura listeners.
   */
  function inicializar() {
    listaContainer = document.getElementById("lista-invitados");
    
    // Listeners para acciones en la lista (editar, eliminar, generar single)
    listaContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-edit')) {
        const id = e.target.closest('.invitado-card').dataset.id;
        editarInvitado(parseInt(id));
      }
      if (e.target.classList.contains('btn-delete')) {
        const id = e.target.closest('.invitado-card').dataset.id;
        eliminarInvitado(parseInt(id));
      }
      if (e.target.classList.contains('btn-generar-single')) {
        const id = e.target.closest('.invitado-card').dataset.id;
        const nombre = e.target.closest('.invitado-card').querySelector('.nombre').textContent;
        abrirModalGeneracionIndividual(parseInt(id), nombre);
      }
    });

    configurarFiltros();
  }

  /**
   * Carga los invitados desde el backend
   */
  async function cargarInvitados() {
    if (!listaContainer) {
      inicializar();
    }
    listaContainer.innerHTML = '<div class="loading">Cargando...</div>';

    try {
      invitadosData = await window.API.obtenerInvitados();
      mostrarInvitados(invitadosData);
      actualizarContador();

      if (window.Estadisticas && window.Estadisticas.actualizar) {
        window.Estadisticas.actualizar(invitadosData);
      }
    } catch (error) {
      console.error("Error al obtener los invitados:", error);
      mostrarError(error);
    }
  }

  function mostrarError(error) {
    let message = `Error al cargar los datos: ${error.message}`;
    if (error.message.includes("Failed to fetch")) {
      message += " — No se pudo conectar al servidor. El backend puede estar iniciándose.";
    }
    listaContainer.innerHTML = `
      <div class="error-container">
        <p class="error-message">❌ ${message}</p>
        <button id="btn-recargar" class="btn btn-secondary">🔄 Recargar Datos</button>
      </div>
    `;
    document.getElementById("btn-recargar")?.addEventListener("click", cargarInvitados);
  }

  function mostrarInvitados(invitados) {
    const invitadosFiltrados = filtrarInvitados(invitados);
    if (invitadosFiltrados.length === 0) {
      listaContainer.innerHTML = '<div class="empty-state"><p>📭 No hay invitados que coincidan con el filtro.</p></div>';
    } else {
      listaContainer.innerHTML = "";
      invitadosFiltrados.forEach((invitado) => {
        const card = crearCardInvitado(invitado);
        listaContainer.appendChild(card);
      });
    }
    actualizarContador(invitadosFiltrados.length);
  }

  function crearCardInvitado(invitado) {
    const card = document.createElement("div");
    card.className = "invitado-card";
    card.dataset.id = invitado.id;

    let rolesHTML = "";
    if (invitado.es_asesor_t1) rolesHTML += '<span class="badge badge-t1">👨‍🏫 Asesor T1</span>';
    if (invitado.es_asesor_t2) rolesHTML += '<span class="badge badge-t2">👩‍🏫 Asesor T2</span>';
    if (invitado.puede_ser_jurado_protocolo) rolesHTML += '<span class="badge badge-protocolo">📝 Jurado Protocolo</span>';
    if (invitado.puede_ser_jurado_informe) rolesHTML += '<span class="badge badge-informe">📄 Jurado Informe</span>';

    let puestoHTML = (invitado.puesto_completo || invitado.institucion) ? `
      <div class="puesto-institucion">
        ${invitado.puesto_completo ? `<div class="puesto">${invitado.puesto_completo}</div>` : ""}
        ${invitado.institucion ? `<div class="institucion">${invitado.institucion}</div>` : ""}
      </div>` : "";

    let especialHTML = invitado.es_invitado_especial ? '<span class="badge badge-especial">🌟 Invitado Especial</span>' : "";
    let notaHTML = (invitado.nota && invitado.nota.trim() !== "") ? `<span class="nota-invitado">${invitado.nota}</span>` : "";

    card.innerHTML = `
      <div class="card-content">
        <div class="card-line-1">
          <div class="card-line-1-left">
            <h3 class="nombre">${invitado.nombre_completo}</h3>
            <div class="roles">${especialHTML} ${rolesHTML || '<span class="badge badge-default">Sin roles</span>'}</div>
          </div>
          <span class="id-badge">ID: ${invitado.id}</span>
        </div>
        ${puestoHTML}
        <div class="caracter-line">
          <div class="caracter-invitacion">${invitado.caracter_invitacion || "Sin especificar"}</div>
        </div>
        <div class="actions-line">
          <div class="actions-line-left">${notaHTML}</div>
          <div class="actions-line-right">
            <button class="btn-generar-single btn-secondary">📄 Generar</button>
            <button class="btn-edit">✏️ Editar</button>
            <button class="btn-delete">🗑️ Eliminar</button>
          </div>
        </div>
      </div>`;
    return card;
  }

  function filtrarInvitados(invitados) {
    switch (filtroActual) {
      case "asesor_t1": return invitados.filter(inv => inv.es_asesor_t1);
      case "asesor_t2": return invitados.filter(inv => inv.es_asesor_t2);
      case "jurado_protocolo": return invitados.filter(inv => inv.puede_ser_jurado_protocolo);
      case "jurado_informe": return invitados.filter(inv => inv.puede_ser_jurado_informe);
      default: return invitados;
    }
  }

  function configurarFiltros() {
    const botonesFiltro = document.querySelectorAll(".btn-filter");
    botonesFiltro.forEach(boton => {
      boton.addEventListener("click", () => {
        botonesFiltro.forEach(btn => btn.classList.remove("active"));
        boton.classList.add("active");
        filtroActual = boton.dataset.filter;
        mostrarInvitados(invitadosData);
      });
    });
  }

  function actualizarContador(cantidad = null) {
    const contador = document.getElementById("contador-filtro");
    if (!contador) return;
    const count = cantidad !== null ? cantidad : invitadosData.length;
    contador.textContent = `Total: ${count} invitado${count !== 1 ? "s" : ""}`;
  }

  async function editarInvitado(id) {
    const invitado = invitadosData.find(inv => inv.id === id);
    if (invitado && window.InvitadosForm && window.InvitadosForm.cargarParaEdicion) {
      window.InvitadosForm.cargarParaEdicion(invitado);
      window.Navigation.cambiarPagina("agregar");
    }
  }

  async function eliminarInvitado(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este invitado?")) return;
    try {
      await window.API.eliminarInvitado(id);
      await cargarInvitados();
      window.UI.mostrarNotificacion("✅ Invitado eliminado correctamente", "success");
    } catch (error) {
      window.UI.mostrarNotificacion(`❌ Error al eliminar invitado: ${error.message}`, "error");
    }
  }

  // --- LÓGICA DEL MODAL DE GENERACIÓN INDIVIDUAL ---

  function abrirModalGeneracionIndividual(id, nombre) {
    currentGuestId = id;
    modalOverlay = document.getElementById('modal-single-generation-overlay');
    modalTitle = document.getElementById('modal-single-generation-title');
    modalGuestName = document.getElementById('modal-single-guest-name');
    modalForm = document.getElementById('form-single-generation');
    btnCancel = document.getElementById('modal-btn-single-cancel');
    btnGenerate = document.getElementById('modal-btn-single-generate');

    modalGuestName.textContent = nombre;
    modalOverlay.style.display = 'flex';

    btnCancel.addEventListener('click', cerrarModalGeneracionIndividual);
    btnGenerate.addEventListener('click', handleGenerateClick);
  }

  function cerrarModalGeneracionIndividual() {
    if(modalOverlay) modalOverlay.style.display = 'none';
    // Limpiar listeners para evitar duplicados
    btnGenerate.removeEventListener('click', handleGenerateClick);
    btnCancel.removeEventListener('click', cerrarModalGeneracionIndividual);
  }

  async function handleGenerateClick() {
    const form = document.getElementById('form-single-generation');
    const data = {
        anio: form.querySelector('#single-periodo-anio').value,
        periodo: form.querySelector('#single-periodo-numero').value,
        edicion_evento: form.querySelector('#single-edicion-evento').value,
        fecha_evento: form.querySelector('#single-fecha-evento').value,
        fecha_carta: form.querySelector('#single-fecha-carta').value,
    };

    // Validar
    if (!data.anio || !data.periodo || !data.edicion_evento || !data.fecha_evento || !data.fecha_carta) {
        window.UI.mostrarNotificacion("Por favor, completa todos los campos del evento.", "error");
        return;
    }

    window.UI.mostrarNotificacion("Generando invitación...", "info");
    cerrarModalGeneracionIndividual();

    try {
        const resultado = await window.API.generateSingleInvitation(currentGuestId, data);
        window.UI.mostrarNotificacion(resultado.message, "success");
    } catch (error) {
        window.UI.mostrarNotificacion(`Error al generar: ${error.message}`, "error");
    }
  }

  function obtenerInvitados() {
    return invitadosData;
  }

  // Inicializar al cargar el script
  document.addEventListener('DOMContentLoaded', inicializar);

  return {
    cargar: cargarInvitados,
    obtenerInvitados,
  };
})();

window.InvitadosLista = InvitadosLista;
