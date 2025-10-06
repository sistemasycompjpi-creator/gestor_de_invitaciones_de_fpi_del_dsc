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
};

/**
 * Inicializa el módulo de invitaciones
 */
function inicializarInvitaciones() {
  configurarSubidaArchivos();
  configurarGeneracion();
  configurarPeriodo();
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
  // Obtener valores de los campos
  const periodoAnio = document.getElementById("periodo-anio")?.value;
  const periodoNumero = document.getElementById("periodo-numero")?.value;
  const edicionEvento = document.getElementById("edicion-evento")?.value;
  const fechaEvento = document.getElementById("fecha-evento")?.value;
  const fechaCarta = document.getElementById("fecha-carta")?.value;

  // Validaciones
  if (!periodoAnio || !periodoNumero) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Campos Incompletos",
        "Por favor configura el año y periodo.",
        "⚠️"
      );
    }
    return;
  }

  if (!edicionEvento || !fechaEvento || !fechaCarta) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Campos Incompletos",
        "Por favor completa todos los campos requeridos del evento.",
        "⚠️"
      );
    }
    return;
  }

  if (!invitacionesState.archivosSubidos) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Archivos no cargados",
        "Primero debes cargar los archivos base usando el botón '⬆️ Cargar Archivos'.",
        "⚠️"
      );
    }
    return;
  }

  const btnGenerar = document.getElementById("btn-generar");
  if (btnGenerar) btnGenerar.disabled = true;

  // ============= BLOQUEAR TODA LA UI =============
  // Deshabilitar navegación
  const navButtons = document.querySelectorAll(".nav-item");
  navButtons.forEach((btn) => (btn.disabled = true));

  // Deshabilitar todos los inputs y botones de la página
  const allInputs = document.querySelectorAll(
    "input, button, select, textarea"
  );
  allInputs.forEach((el) => {
    el.dataset.wasDisabled = el.disabled ? "true" : "false";
    el.disabled = true;
  });

  // Crear modal de progreso animado CON z-index alto para bloquear todo
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.style.zIndex = "99999"; // Asegurar que esté por encima de todo
  modalOverlay.style.pointerEvents = "all"; // Bloquear clicks
  modalOverlay.innerHTML = `
    <div class="modal-progress">
      <div class="modal-header-progress">
        <h3>🚀 Generando Invitaciones</h3>
        <p style="font-size: 14px; color: #666; margin-top: 10px;">
          ⚠️ No cierres esta ventana ni cambies de pestaña
        </p>
      </div>
      <div class="modal-body-progress">
        <div class="progress-spinner"></div>
        <p class="progress-status" id="progress-status-text">Preparando generación...</p>
        <div class="progress-bar-large">
          <div class="progress-fill-large" id="progress-fill-large"></div>
        </div>
        <p class="progress-percentage" id="progress-percentage">0%</p>
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  const statusText = document.getElementById("progress-status-text");
  const progressFill = document.getElementById("progress-fill-large");
  const progressPercentage = document.getElementById("progress-percentage");

  try {
    // Preparar datos del evento
    const eventData = {
      anio: periodoAnio,
      periodo: periodoNumero,
      edicion_evento: edicionEvento,
      fecha_evento: fechaEvento,
      fecha_carta: fechaCarta,
    };

    // Animar progreso inicial
    setTimeout(() => {
      statusText.textContent = "📤 Enviando datos al servidor...";
      progressFill.style.width = "20%";
      progressPercentage.textContent = "20%";
    }, 300);

    // Llamar al backend
    const response = await fetch(
      "http://127.0.0.1:5000/api/generate-all-invitations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );

    // Animar progreso medio
    statusText.textContent = "📝 Procesando plantillas...";
    progressFill.style.width = "50%";
    progressPercentage.textContent = "50%";

    const result = await response.json();

    // Animar progreso avanzado
    statusText.textContent = "📄 Generando PDFs...";
    progressFill.style.width = "80%";
    progressPercentage.textContent = "80%";

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (result.success) {
      // Completar progreso
      statusText.textContent = "✅ ¡Completado!";
      progressFill.style.width = "100%";
      progressPercentage.textContent = "100%";

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Cerrar modal de progreso
      document.body.removeChild(modalOverlay);

      // Mostrar modal de éxito con detalles
      const successMessage = `
        <div style="text-align: left;">
          <p style="font-size: 18px; margin-bottom: 15px;">
            ✅ <strong>${
              result.generated_count || result.count || 0
            } invitaciones generadas exitosamente</strong>
          </p>
          <p style="margin: 10px 0;">
            📂 <strong>Ubicación:</strong><br>
            <code style="background: #f0f0f0; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">
              ~/Desktop/${periodoAnio}.${periodoNumero}-invitaciones/
            </code>
          </p>
          <p style="margin: 10px 0;">
            🎯 <strong>Nomenclatura:</strong><br>
            <code style="font-size: 12px;">${periodoAnio}.${periodoNumero}-FPiT-DOSSIER-[Org]-[Nombre].pdf</code>
          </p>
          ${
            result.errors && result.errors.length > 0
              ? `
          <p style="margin-top: 15px; color: #ff9800;">
            ⚠️ <strong>Errores encontrados:</strong><br>
            ${result.errors
              .map((err) => `• ${err.invitado}: ${err.error}`)
              .join("<br>")}
          </p>
          `
              : ""
          }
        </div>
      `;

      if (window.UI && window.UI.mostrarModal) {
        window.UI.mostrarModal(
          "✅ Generación Completada",
          successMessage,
          result.errors && result.errors.length > 0 ? "⚠️" : "✅"
        );
      }

      // Limpiar formulario después del éxito
      limpiarFormularioInvitaciones();
    } else {
      throw new Error(result.error || "Error desconocido");
    }
  } catch (error) {
    console.error("Error al generar invitaciones:", error);

    // Cerrar modal de progreso
    if (document.body.contains(modalOverlay)) {
      document.body.removeChild(modalOverlay);
    }

    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "❌ Error",
        `No se pudieron generar las invitaciones.\n\nError: ${error.message}`,
        "❌"
      );
    }
  } finally {
    // ============= DESBLOQUEAR TODA LA UI =============
    // Restaurar navegación
    navButtons.forEach((btn) => (btn.disabled = false));

    // Restaurar todos los inputs y botones a su estado original
    allInputs.forEach((el) => {
      if (el.dataset.wasDisabled === "false") {
        el.disabled = false;
      }
      delete el.dataset.wasDisabled;
    });

    if (btnGenerar) btnGenerar.disabled = false;
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

// Exportar para uso global
window.Invitaciones = {
  inicializar: inicializarInvitaciones,
  limpiarFormulario: limpiarFormularioInvitaciones,
};
