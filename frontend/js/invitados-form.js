// ========== MÓDULO DE FORMULARIO DE INVITADOS ==========
// Maneja el formulario de agregar/editar invitados

let invitadoEnEdicion = null;

/**
 * Configura el formulario de invitados
 */
function configurarFormulario() {
  const form = document.getElementById("form-invitado");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {};

    // Obtener todos los campos
    formData.forEach((value, key) => {
      // Solo agregar si el valor no está vacío
      if (value.trim() !== "") {
        data[key] = value;
      }
    });

    // Asegurar que los checkboxes no marcados sean false
    data.es_asesor_t1 = formData.has("es_asesor_t1");
    data.es_asesor_t2 = formData.has("es_asesor_t2");

    // Verificar si estamos en modo edición
    const submitBtn = form.querySelector('button[type="submit"]');
    const isEditMode = submitBtn.dataset.editMode === "true";

    if (isEditMode && invitadoEnEdicion) {
      await actualizarInvitado(invitadoEnEdicion.id, data);
    } else {
      await crearInvitado(data);
    }
  });

  // Evento para limpiar modo edición al resetear el formulario
  form.addEventListener("reset", () => {
    limpiarModoEdicion();
  });
}

/**
 * Crea un nuevo invitado
 */
async function crearInvitado(data) {
  try {
    const invitadoCreado = await window.API.crearInvitado(data);
    console.log("Invitado creado:", invitadoCreado);

    // Recargar lista en la página de lista
    if (window.InvitadosLista && window.InvitadosLista.cargar) {
      await window.InvitadosLista.cargar();
    }

    // Limpiar formulario
    document.getElementById("form-invitado").reset();

    // Mostrar modal de éxito con redirección
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "¡Invitado Agregado!",
        "El invitado se ha registrado correctamente. Redirigiendo a la lista de invitados...",
        "✅",
        () => {
          // Redirigir a la página de lista
          if (window.Navigation) {
            window.Navigation.cambiarPagina("lista");
            document
              .querySelector('[data-page="lista"]')
              .classList.add("active");
            document
              .querySelector('[data-page="agregar"]')
              .classList.remove("active");
          }
        }
      );
    }
  } catch (error) {
    console.error("Error al crear invitado:", error);
    if (window.UI && window.UI.mostrarNotificacion) {
      window.UI.mostrarNotificacion(
        "❌ Error al crear invitado: " + error.message,
        "error"
      );
    }
  }
}

/**
 * Actualiza un invitado existente
 */
async function actualizarInvitado(id, data) {
  try {
    const invitadoActualizado = await window.API.actualizarInvitado(id, data);
    console.log("Invitado actualizado:", invitadoActualizado);

    // Recargar lista
    if (window.InvitadosLista && window.InvitadosLista.cargar) {
      await window.InvitadosLista.cargar();
    }

    // Limpiar modo edición
    limpiarModoEdicion();

    // Mostrar modal de éxito con redirección
    if (window.UI && window.UI.mostrarModal) {
      window.UI.mostrarModal(
        "¡Invitado Actualizado!",
        "Los cambios se han guardado correctamente. Redirigiendo a la lista de invitados...",
        "✅",
        () => {
          // Redirigir a la página de lista
          if (window.Navigation) {
            window.Navigation.cambiarPagina("lista");
            document
              .querySelector('[data-page="lista"]')
              .classList.add("active");
            document
              .querySelector('[data-page="agregar"]')
              .classList.remove("active");
          }
        }
      );
    }
  } catch (error) {
    console.error("Error al actualizar invitado:", error);
    if (window.UI && window.UI.mostrarNotificacion) {
      window.UI.mostrarNotificacion(
        "❌ Error al actualizar invitado: " + error.message,
        "error"
      );
    }
  }
}

/**
 * Carga un invitado para edición
 */
function cargarParaEdicion(invitado) {
  invitadoEnEdicion = invitado;

  const form = document.getElementById("form-invitado");

  // Nombre
  form.querySelector("#nombre_completo").value = invitado.nombre_completo || "";

  // Carácter de la invitación
  form.querySelector("#caracter_invitacion").value =
    invitado.caracter_invitacion || "";

  // Nota del invitado
  form.querySelector("#nota").value = invitado.nota || "";

  // Puesto e institución
  form.querySelector("#puesto_completo").value = invitado.puesto_completo || "";
  form.querySelector("#institucion").value = invitado.institucion || "";
  form.querySelector("#abreviacion_org").value = invitado.abreviacion_org || "";

  // Checkbox de invitado especial
  form.querySelector("#es_invitado_especial").checked =
    invitado.es_invitado_especial || false;

  // Checkboxes de asesoría
  form.querySelector("#es_asesor_t1").checked = invitado.es_asesor_t1 || false;
  form.querySelector("#es_asesor_t2").checked = invitado.es_asesor_t2 || false;

  // Cambiar el texto del botón submit
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "💾 Actualizar Invitado";
  submitBtn.dataset.editMode = "true";

  // Scroll al inicio
  window.scrollTo(0, 0);

  if (window.UI && window.UI.mostrarNotificacion) {
    window.UI.mostrarNotificacion(
      "📝 Editando invitado: " + invitado.nombre_completo,
      "info"
    );
  }
}

/**
 * Limpia el modo de edición
 */
function limpiarModoEdicion() {
  invitadoEnEdicion = null;
  const form = document.getElementById("form-invitado");
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "✅ Guardar Invitado";
  delete submitBtn.dataset.editMode;
}

// Exportar para uso global
window.InvitadosForm = {
  configurar: configurarFormulario,
  cargarParaEdicion,
  limpiarModoEdicion,
};
