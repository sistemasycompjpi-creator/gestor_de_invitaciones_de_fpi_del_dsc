// ========== MÓDULO DE GENERACIÓN DE INVITACIONES ==========
// Maneja toda la lógica de generación de invitaciones en PDF

// Plantilla de la carta de invitación
const PLANTILLA_INVITACION = `{{ nombre_completo }}
{{ cargo_1 }}
{{ organizacion_1 }}

El Instituto Tecnológico de Morelia, a través del Departamento de Ingeniería en Sistemas y Computación, le extiende una cordial invitación a participar como {{ motivo_invitacion }} en la

Feria de Proyectos de Investigación Tecnológica de Pregrado de la Carrera de Ingeniería en Sistemas Computacionales 

{{ edicion_evento }}

cuyos objetivos son:
* difundir ante actores relevantes los trabajos de investigación de pregrado de la carrera de Ingeniería en Sistemas Computacionales (ISC) 

* propiciar en los alumnos el acercamiento a problemáticas científico-tecnológicas en diversos contextos en el ámbito de su especialidad, y a su solución 

* impulsar un semillero de proyectos científicos y tecnológicos que conduzcan a la obtención de grado por Titulación Integral por Proyecto de Investigación y a la participación en eventos nacionales o internacionales de ciencia, tecnología e innovación 

La FPiT se llevará a cabo el 

{{ fecha_evento }}, con el evento inaugural en la Sala Audiovisual 1 del Campus Principal (Edificio F). 

Me permito anexar convocatoria, programa general y croquis del evento. Favor de considerar protocolo de vestimenta semiformal. 

Esperamos contar con su valiosa participación y quedamos atentos a su respuesta; 

así como a cualquier duda o información adicional que se requiera. 

Morelia, Michoacán, {{ fecha_carta }}.

Atentamente,

{{ nombre_firmante }}
{{ cargo_firmante }}
Instituto Tecnológico de Morelia 

Favor de confirmar su participación mediante correo: 

sistemas.investigacion@morelia.tecnm.mx`;

// Estado de invitaciones
let invitacionesState = {
  archivos: {
    plantillaDoc: null,
    convocatoria: null,
    cronograma: null,
  },
  invitadosSeleccionados: [],
  zoomLevel: 100,
  previewIndex: 0,
};

/**
 * Inicializa el módulo de invitaciones
 */
function inicializarInvitaciones() {
  configurarSubidaArchivos();
  cargarInvitadosParaPreview();
  configurarControlesPreview();
  configurarGeneracion();
  configurarPeriodo();
}

/**
 * Configura la subida de archivos PDF
 */
function configurarSubidaArchivos() {
  const fileInputs = [
    {
      id: "file-plantilla-doc",
      status: "status-plantilla-doc",
      key: "plantillaDoc",
    },
    {
      id: "file-convocatoria",
      status: "status-convocatoria",
      key: "convocatoria",
    },
    { id: "file-cronograma", status: "status-cronograma", key: "cronograma" },
  ];

  fileInputs.forEach(({ id, status, key }) => {
    const input = document.getElementById(id);
    const statusEl = document.getElementById(status);

    if (!input || !statusEl) return;

    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        invitacionesState.archivos[key] = file;
        statusEl.textContent = `✅ ${file.name}`;
        statusEl.style.color = "var(--success-green)";
      } else {
        invitacionesState.archivos[key] = null;
        statusEl.textContent = "Sin seleccionar";
        statusEl.style.color = "var(--text-secondary)";
      }
    });
  });
}

/**
 * Carga invitados para preview (todos los de la BD)
 */
async function cargarInvitadosParaPreview() {
  try {
    // Obtener invitados de la lista
    const invitados =
      window.InvitadosLista && window.InvitadosLista.obtenerInvitados
        ? window.InvitadosLista.obtenerInvitados()
        : [];

    // Si no hay invitados, intentar cargar desde API
    if (invitados.length === 0) {
      const invitadosAPI = await window.API.obtenerInvitados();
      invitacionesState.invitadosSeleccionados = [...invitadosAPI];
    } else {
      invitacionesState.invitadosSeleccionados = [...invitados];
    }

    actualizarPreview();
  } catch (error) {
    console.error("Error al cargar invitados para preview:", error);
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

  // Listener para actualizar folder name y preview
  const updateFolder = () => {
    actualizarFolderName();
    actualizarPreview();
  };
  if (anioInput) anioInput.addEventListener("change", updateFolder);
  if (periodoInput) periodoInput.addEventListener("change", updateFolder);

  // Actualizar inicialmente
  actualizarFolderName();
}

/**
 * Configura los controles de preview
 */
function configurarControlesPreview() {
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnPrev = document.getElementById("btn-preview-prev");
  const btnNext = document.getElementById("btn-preview-next");

  // Configurar listeners de campos para actualizar preview
  const campos = ["edicion-evento", "fecha-evento", "fecha-carta"];
  campos.forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", () => actualizarPreview());
    }
  });

  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", () => {
      if (invitacionesState.zoomLevel < 200) {
        invitacionesState.zoomLevel += 10;
        actualizarZoom();
      }
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", () => {
      if (invitacionesState.zoomLevel > 50) {
        invitacionesState.zoomLevel -= 10;
        actualizarZoom();
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (invitacionesState.previewIndex > 0) {
        invitacionesState.previewIndex--;
        actualizarPreview();
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (
        invitacionesState.previewIndex <
        invitacionesState.invitadosSeleccionados.length - 1
      ) {
        invitacionesState.previewIndex++;
        actualizarPreview();
      }
    });
  }
}

/**
 * Actualiza el nivel de zoom
 */
function actualizarZoom() {
  const zoomLevelEl = document.getElementById("zoom-level");
  if (zoomLevelEl) {
    zoomLevelEl.textContent = `${invitacionesState.zoomLevel}%`;
  }
}

/**
 * Actualiza la vista previa
 */
function actualizarPreview() {
  const previewCounter = document.getElementById("preview-counter");
  const btnPrev = document.getElementById("btn-preview-prev");
  const btnNext = document.getElementById("btn-preview-next");
  const previewContent = document.getElementById("preview-content");

  const count = invitacionesState.invitadosSeleccionados.length;
  const index = invitacionesState.previewIndex;

  if (previewCounter) {
    previewCounter.textContent =
      count > 0 ? `Invitado ${index + 1} de ${count}` : "Cargando invitados...";
  }

  if (btnPrev) {
    btnPrev.disabled = index === 0 || count === 0;
  }

  if (btnNext) {
    btnNext.disabled = index >= count - 1 || count === 0;
  }

  // Generar preview con la plantilla
  if (previewContent && count > 0) {
    const invitado = invitacionesState.invitadosSeleccionados[index];
    const periodoAnio =
      document.getElementById("periodo-anio")?.value || "[año]";
    const periodoNumero =
      document.getElementById("periodo-numero")?.value || "[periodo]";
    const edicionEvento =
      document.getElementById("edicion-evento")?.value ||
      "[Edición del evento]";
    const fechaEvento =
      document.getElementById("fecha-evento")?.value || "[Fecha del evento]";
    const fechaCartaInput = document.getElementById("fecha-carta")?.value;

    // Formatear fecha de carta
    let fechaCarta = "[Fecha de la carta]";
    if (fechaCartaInput) {
      const fecha = new Date(fechaCartaInput + "T00:00:00");
      fechaCarta = fecha.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Generar nombre de archivo según nomenclatura
    const organizacion = invitado.organizacion_1 || "SIN_ORG";
    const nombreLimpio = invitado.nombre_completo.replace(/\s+/g, " ").trim();
    const nombreArchivo = `${periodoAnio}.${periodoNumero}-FPiT-DOSSIER-${organizacion}-${nombreLimpio}.pdf`;

    // Reemplazar variables en la plantilla
    let cartaGenerada = PLANTILLA_INVITACION.replace(
      "{{ nombre_completo }}",
      invitado.nombre_completo || ""
    )
      .replace("{{ cargo_1 }}", invitado.cargo_1 || "")
      .replace("{{ organizacion_1 }}", invitado.organizacion_1 || "")
      .replace(
        "{{ motivo_invitacion }}",
        invitado.caracter_invitacion || "[Motivo de invitación]"
      )
      .replace("{{ edicion_evento }}", edicionEvento)
      .replace("{{ fecha_evento }}", fechaEvento)
      .replace("{{ fecha_carta }}", fechaCarta)
      .replace("{{ nombre_firmante }}", "M. en C. Isaac Ayala Barajas")
      .replace(
        "{{ cargo_firmante }}",
        "Jefe del Departamento de Ingeniería en Sistemas Computacionales"
      );

    previewContent.innerHTML = `
      <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; font-family: 'Times New Roman', serif; line-height: 1.8;">
        <div style="white-space: pre-wrap; font-size: 14px; text-align: justify;">
${cartaGenerada}
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--primary-blue); text-align: center; color: #666; font-size: 0.85rem; font-family: sans-serif;">
          <p><strong>📄 Vista Previa</strong></p>
          <p style="margin: 8px 0;">Página 1: Carta de invitación</p>
          <p style="margin: 8px 0;">Página 2: Convocatoria (PDF anexado)</p>
          <p style="margin: 8px 0;">Página 3+: Cronograma y Croquis (PDF anexado)</p>
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
          <p style="margin: 8px 0;"><strong>📁 Nombre de archivo:</strong></p>
          <p style="font-family: monospace; font-size: 0.75rem; word-break: break-all; padding: 5px; background: #f5f5f5; border-radius: 4px;">${nombreArchivo}</p>
        </div>
      </div>
    `;
  }
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
 * Genera las invitaciones
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

  if (invitacionesState.invitadosSeleccionados.length === 0) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Sin Invitados",
        "No hay invitados registrados en la base de datos. Por favor agrega invitados primero.",
        "⚠️"
      );
    }
    return;
  }

  if (!invitacionesState.archivos.plantillaDoc) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Archivo Faltante",
        "Debes cargar el archivo de plantilla PDF base.",
        "⚠️"
      );
    }
    return;
  }

  if (!invitacionesState.archivos.convocatoria) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Archivo Faltante",
        "Debes cargar el PDF de convocatoria.",
        "⚠️"
      );
    }
    return;
  }

  if (!invitacionesState.archivos.cronograma) {
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "⚠️ Archivo Faltante",
        "Debes cargar el PDF de cronograma y croquis.",
        "⚠️"
      );
    }
    return;
  }

  // Mostrar progreso
  const progressContainer = document.getElementById("progress-container");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const btnGenerar = document.getElementById("btn-generar");

  if (progressContainer) progressContainer.style.display = "block";
  if (btnGenerar) btnGenerar.disabled = true;

  try {
    // Preparar datos para enviar al backend
    const formData = new FormData();

    // Agregar archivos PDF
    formData.append("plantilla_doc", invitacionesState.archivos.plantillaDoc);
    formData.append("convocatoria", invitacionesState.archivos.convocatoria);
    formData.append("cronograma", invitacionesState.archivos.cronograma);

    // Agregar configuración de periodo
    formData.append("periodo_anio", periodoAnio);
    formData.append("periodo_numero", periodoNumero);

    // Agregar datos del evento
    formData.append("edicion_evento", edicionEvento);
    formData.append("fecha_evento", fechaEvento);
    formData.append("fecha_carta", fechaCarta);

    // Datos del firmante (hardcoded)
    formData.append("nombre_firmante", "M. en C. Isaac Ayala Barajas");
    formData.append(
      "cargo_firmante",
      "Jefe del Departamento de Ingeniería en Sistemas Computacionales"
    );

    // Agregar plantilla de texto
    formData.append("plantilla_texto", PLANTILLA_INVITACION);

    // Agregar datos completos de invitados
    formData.append(
      "invitados_data",
      JSON.stringify(invitacionesState.invitadosSeleccionados)
    );

    // Simular progreso
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      if (progress <= 90) {
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText)
          progressText.textContent = `Generando... ${progress}%`;
      }
    }, 200);

    // Llamar al backend
    const result = await window.API.generarInvitaciones(formData);

    clearInterval(progressInterval);

    // Completar progreso
    if (progressFill) progressFill.style.width = "100%";
    if (progressText) progressText.textContent = "¡Completado! 100%";

    // Mostrar resultado
    setTimeout(() => {
      if (progressContainer) progressContainer.style.display = "none";
      if (progressFill) progressFill.style.width = "0%";
      if (progressText) progressText.textContent = "Generando... 0%";

      if (window.UI && window.UI.mostrarModal) {
        window.UI.mostrarModal(
          "✅ Invitaciones Generadas",
          `Se han generado ${invitacionesState.invitadosSeleccionados.length} invitaciones correctamente.\n\nRevisa la carpeta: ~/Desktop/${periodoAnio}.${periodoNumero}-invitaciones/`,
          "✅"
        );
      }

      limpiarFormularioInvitaciones();
    }, 500);
  } catch (error) {
    console.error("Error al generar invitaciones:", error);
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "❌ Error",
        `No se pudieron generar las invitaciones.\n\nNota: El backend aún no está implementado. Este es un preview del frontend.\n\nError: ${error.message}`,
        "❌"
      );
    }
  } finally {
    if (progressContainer) {
      setTimeout(() => {
        progressContainer.style.display = "none";
        if (progressFill) progressFill.style.width = "0%";
        if (progressText) progressText.textContent = "Generando... 0%";
      }, 3000);
    }
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

  // Limpiar archivos PDF
  ["file-plantilla-doc", "file-convocatoria", "file-cronograma"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    }
  );

  ["status-plantilla-doc", "status-convocatoria", "status-cronograma"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = "Sin seleccionar";
        el.style.color = "var(--text-secondary)";
      }
    }
  );

  // Resetear estado
  invitacionesState = {
    archivos: {
      plantillaDoc: null,
      convocatoria: null,
      cronograma: null,
    },
    invitadosSeleccionados:
      window.InvitadosLista && window.InvitadosLista.obtenerInvitados
        ? window.InvitadosLista.obtenerInvitados()
        : [],
    zoomLevel: 100,
    previewIndex: 0,
  };

  // Actualizar preview
  actualizarPreview();
}

// Exportar para uso global
window.Invitaciones = {
  inicializar: inicializarInvitaciones,
  limpiarFormulario: limpiarFormularioInvitaciones,
};
