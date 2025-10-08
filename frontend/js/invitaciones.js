// ========== MÓDULO DE GENERACIÓN DE INVITACIONES ==========
// Maneja toda la lógica de generación de invitaciones en PDF

// Estado de invitaciones
let invitacionesState = {
  archivos: {
    plantillaDocx: null,
    convocatoria: null,
    cronograma: null,
  },
  archivosSubidos: false,
  generationMode: "todos", // 'todos' o 'individual'
};

/**
 * Inicializa el módulo de invitaciones
 */
function inicializarInvitaciones() {
  configurarSubidaArchivos();
  configurarGeneracion();
  configurarPeriodo();
  configurarModoGeneracion();
  cargarInvitadosParaSelector();
}

/**
 * Configura los inputs de archivos y el botón de carga
 */
function configurarSubidaArchivos() {
  const btnCargar = document.getElementById("btn-cargar-archivos");

  if (btnCargar) {
    btnCargar.addEventListener("click", cargarArchivos);
  }

  // Listeners para mostrar nombre de archivo seleccionado
  ["file-plantilla-docx", "file-convocatoria", "file-cronograma"].forEach(
    (id) => {
      const fileInput = document.getElementById(id);
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const statusId = id.replace("file-", "status-");
          const statusEl = document.getElementById(statusId);
          if (statusEl && e.target.files[0]) {
            statusEl.textContent = `📄 ${e.target.files[0].name}`;
            statusEl.style.color = "var(--primary)";
          }
        });
      }
    }
  );
}

/**
 * Carga los archivos y los envía al backend
 */
async function cargarArchivos() {
  const fileInputs = {
    plantillaDocx: document.getElementById("file-plantilla-docx"),
    convocatoria: document.getElementById("file-convocatoria"),
    cronograma: document.getElementById("file-cronograma"),
  };

  // Validar que todos los archivos estén seleccionados
  if (
    !fileInputs.plantillaDocx?.files[0] ||
    !fileInputs.convocatoria?.files[0] ||
    !fileInputs.cronograma?.files[0]
  ) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Archivos Incompletos",
        "Por favor selecciona los 3 archivos requeridos:\n• Plantilla DOCX\n• Convocatoria PDF\n• Cronograma PDF",
        "⚠️"
      );
    }
    return;
  }

  const btnCargar = document.getElementById("btn-cargar-archivos");
  if (btnCargar) btnCargar.disabled = true;

  // Crear modal de carga
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.innerHTML = `
    <div class="modal-progress">
      <div class="modal-header-progress">
        <h3>📤 Cargando Archivos</h3>
      </div>
      <div class="modal-body-progress">
        <div class="progress-spinner"></div>
        <p class="progress-status">Subiendo archivos al servidor...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  try {
    // Preparar FormData
    const formData = new FormData();
    formData.append("plantilla_docx", fileInputs.plantillaDocx.files[0]);
    formData.append("convocatoria_pdf", fileInputs.convocatoria.files[0]);
    formData.append("cronograma_pdf", fileInputs.cronograma.files[0]);

    // Enviar al backend
    const response = await fetch("http://127.0.0.1:5000/api/upload-files", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      invitacionesState.archivos = {
        plantillaDocx: result.files.plantilla_docx,
        convocatoria: result.files.convocatoria_pdf,
        cronograma: result.files.cronograma_pdf,
      };
      invitacionesState.archivosSubidos = true;

      // Actualizar UI con checkmarks verdes
      [
        "status-plantilla-docx",
        "status-convocatoria",
        "status-cronograma",
      ].forEach((id) => {
        const statusEl = document.getElementById(id);
        if (statusEl) {
          const fileName = statusEl.textContent.replace("📄 ", "");
          statusEl.innerHTML = `✅ ${fileName}`;
          statusEl.style.color = "var(--success)";
        }
      });

      // Cerrar modal de carga
      document.body.removeChild(modalOverlay);

      // Mostrar modal de éxito
      if (window.UI && window.UI.mostrarModal) {
        window.UI.mostrarModal(
          "✅ Archivos Cargados",
          "Los 3 archivos se cargaron correctamente al servidor.\n\n✓ Plantilla DOCX\n✓ Convocatoria PDF\n✓ Cronograma PDF\n\nYa puedes generar las invitaciones.",
          "✅"
        );
      }
    } else {
      throw new Error(result.error || "Error al cargar archivos");
    }
  } catch (error) {
    console.error("Error al cargar archivos:", error);

    // Cerrar modal de carga
    if (document.body.contains(modalOverlay)) {
      document.body.removeChild(modalOverlay);
    }

    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "❌ Error",
        `No se pudieron cargar los archivos.\n\nError: ${error.message}`,
        "❌"
      );
    }
  } finally {
    if (btnCargar) btnCargar.disabled = false;
  }
}

/**
 * Configura el periodo y actualiza el nombre de carpeta
 */
function configurarPeriodo() {
  const anioInput = document.getElementById("periodo-anio");
  const periodoInput = document.getElementById("periodo-numero");

  // Establecer año actual por defecto
  if (anioInput) {
    const now = new Date();
    anioInput.value = now.getFullYear();
  }

  // Listener para actualizar folder name
  const updateFolder = () => actualizarFolderName();
  if (anioInput) anioInput.addEventListener("change", updateFolder);
  if (periodoInput) periodoInput.addEventListener("change", updateFolder);

  // Actualizar inicialmente
  actualizarFolderName();
}

/**
 * Configura el botón de generación
 */
function configurarGeneracion() {
  const btnGenerar = document.getElementById("btn-generar");

  if (btnGenerar) {
    btnGenerar.addEventListener("click", generarInvitaciones);
  }
}

/**
 * Actualiza el nombre de la carpeta de destino
 */
function actualizarFolderName() {
  const folderNameEl = document.getElementById("folder-name-display");
  if (!folderNameEl) return;

  const anio = document.getElementById("periodo-anio")?.value;
  const periodo = document.getElementById("periodo-numero")?.value;

  if (anio && periodo) {
    folderNameEl.textContent = `${anio}.${periodo}-invitaciones`;
  } else {
    folderNameEl.textContent = "Configurar año y periodo primero";
  }
}

/**
 * Genera las invitaciones llamando al backend
 */
async function generarInvitaciones() {
  // 1. Validar estado y campos
  if (!invitacionesState.archivosSubidos) {
    return window.UI.mostrarModal(
      "⚠️ Archivos no cargados",
      "Primero debes cargar los archivos base.",
      "⚠️"
    );
  }

  const eventData = {
    anio: document.getElementById("periodo-anio").value,
    periodo: document.getElementById("periodo-numero").value,
    edicion_evento: document.getElementById("edicion-evento").value,
    fecha_evento: document.getElementById("fecha-evento").value,
    fecha_carta: document.getElementById("fecha-carta").value,
  };

  if (
    !eventData.anio ||
    !eventData.periodo ||
    !eventData.edicion_evento ||
    !eventData.fecha_evento ||
    !eventData.fecha_carta
  ) {
    return window.UI.mostrarModal(
      "⚠️ Campos Incompletos",
      "Por favor completa todos los campos de configuración del evento.",
      "⚠️"
    );
  }

  let invitadoId = null;
  if (invitacionesState.generationMode === "individual") {
    invitadoId = document.getElementById("invitado-selector").value;
    if (!invitadoId) {
      return window.UI.mostrarModal(
        "⚠️ Invitado no seleccionado",
        "Por favor selecciona un invitado de la lista.",
        "⚠️"
      );
    }
  }

  // 2. Bloquear UI y mostrar progreso
  const btnGenerar = document.getElementById("btn-generar");
  btnGenerar.disabled = true;

  const progressOverlay = document.createElement("div");
  progressOverlay.className = "progress-overlay";
  progressOverlay.innerHTML =
    '<div class="progress-spinner"></div><p>Generando, por favor espera...</p>';
  document.body.appendChild(progressOverlay);

  try {
    let result;
    if (invitacionesState.generationMode === "individual") {
      result = await window.API.generateSingleInvitation(invitadoId, eventData);
    } else {
      const response = await fetch(
        "http://127.0.0.1:5000/api/generate-all-invitations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        }
      );
      result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error en el servidor");
    }

    const successMessage = `
      <div style="text-align: left;">
        <p style="font-size: 18px; margin-bottom: 15px;">✅ <strong>${result.message}</strong></p>
        <p style="margin: 10px 0;"><strong>📂 Ubicación:</strong><br><code class="code-block">${result.output_folder}</code></p>
      </div>`;
    window.UI.mostrarModal("✅ Generación Completada", successMessage, "✅");
  } catch (error) {
    console.error("Error al generar invitaciones:", error);
    window.UI.mostrarModal(
      "❌ Error de Generación",
      `No se pudieron generar las invitaciones: ${error.message}`,
      "❌"
    );
  } finally {
    // 5. Desbloquear UI
    btnGenerar.disabled = false;
    document.body.removeChild(progressOverlay);
  }
}

/**
 * Limpia el formulario de invitaciones
 */
function limpiarFormularioInvitaciones() {
  // Limpiar campos de configuración
  ["edicion-evento", "fecha-evento", "fecha-carta"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // Limpiar archivos
  ["file-plantilla-docx", "file-convocatoria", "file-cronograma"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    }
  );

  ["status-plantilla-docx", "status-convocatoria", "status-cronograma"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = "Sin seleccionar";
        el.style.color = "var(--text-secondary)";
      }
    }
  );

  // Resetear estado
  invitacionesState.archivos = {
    plantillaDocx: null,
    convocatoria: null,
    cronograma: null,
  };
  invitacionesState.archivosSubidos = false;
}

/**
 * Configura los radio buttons para elegir el modo de generación
 */
function configurarModoGeneracion() {
  document
    .querySelectorAll('input[name="generation-type"]')
    .forEach((radio) => {
      radio.addEventListener("change", (e) => {
        invitacionesState.generationMode = e.target.value;
        const selectorContainer = document.getElementById(
          "invitado-selector-container"
        );
        selectorContainer.classList.toggle(
          "hidden",
          invitacionesState.generationMode !== "individual"
        );
      });
    });
}

/**
 * Carga la lista de invitados en el selector
 */
async function cargarInvitadosParaSelector() {
  const selector = document.getElementById("invitado-selector");
  try {
    const invitados = await window.API.obtenerInvitados();
    selector.innerHTML =
      '<option value="">-- Selecciona un invitado --</option>'; // Opción por defecto
    invitados.forEach((inv) => {
      const option = document.createElement("option");
      option.value = inv.id;
      option.textContent = `${inv.nombre_completo} (ID: ${inv.id})`;
      selector.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando invitados para el selector:", error);
    selector.innerHTML = '<option value="">Error al cargar invitados</option>';
  }
}

// Exportar para uso global
window.Invitaciones = {
  inicializar: inicializarInvitaciones,
  limpiarFormulario: limpiarFormularioInvitaciones,
};

