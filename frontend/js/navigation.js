// ========== MÓDULO DE NAVEGACIÓN ==========
// Maneja la navegación entre páginas de la aplicación

let paginaActual = "lista";

/**
 * Configura los listeners de navegación
 */
function configurarNavegacion() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const pagina = item.dataset.page;

      // Remover clase active de todos
      navItems.forEach((nav) => nav.classList.remove("active"));

      // Agregar clase active al clickeado
      item.classList.add("active");

      // Cambiar página
      cambiarPagina(pagina);
    });
  });
}

/**
 * Cambia a una página específica
 * @param {string} nombrePagina - Nombre de la página a mostrar
 */
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

    // Callbacks especiales por página
    onCambioPagina(nombrePagina);
  }
}

/**
 * Callback que se ejecuta al cambiar de página
 * @param {string} nombrePagina - Nombre de la nueva página
 */
function onCambioPagina(nombrePagina) {
  switch (nombrePagina) {
    case "lista":
      // Recargar lista de invitados
      if (window.InvitadosLista && window.InvitadosLista.cargar) {
        window.InvitadosLista.cargar();
      }
      break;

    case "estadisticas":
      // Actualizar estadísticas
      if (window.Estadisticas && window.Estadisticas.actualizar) {
        window.Estadisticas.actualizar();
      }
      break;

    case "invitaciones":
      // Inicializar módulo de invitaciones
      if (window.Invitaciones && window.Invitaciones.inicializar) {
        setTimeout(() => {
          window.Invitaciones.inicializar();
        }, 100);
      }
      break;

    case "importar-exportar":
      // Inicializar módulo de importación/exportación
      if (window.ImportExport && window.ImportExport.inicializar) {
        window.ImportExport.inicializar();
      }
      break;
  }
}

/**
 * Obtiene la página actual
 * @returns {string} - Nombre de la página actual
 */
function obtenerPaginaActual() {
  return paginaActual;
}

// Exportar para uso global
window.Navigation = {
  configurar: configurarNavegacion,
  cambiarPagina,
  obtenerPaginaActual,
};
