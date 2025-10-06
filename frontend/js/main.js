// ========== ARCHIVO PRINCIPAL (MAIN) ==========
// Coordina la inicialización de todos los módulos

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
window.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Iniciando Gestor de Invitaciones JPi...");

  // 1. Configurar navegación
  if (window.Navigation && window.Navigation.configurar) {
    window.Navigation.configurar();
    console.log("✅ Navegación configurada");
  }

  // 2. Cargar lista de invitados
  if (window.InvitadosLista && window.InvitadosLista.cargar) {
    window.InvitadosLista.cargar();
    console.log("✅ Cargando invitados...");
  }

  // 3. Configurar filtros de lista
  if (window.InvitadosLista && window.InvitadosLista.configurarFiltros) {
    window.InvitadosLista.configurarFiltros();
    console.log("✅ Filtros configurados");
  }

  // 4. Configurar formulario de invitados
  if (window.InvitadosForm && window.InvitadosForm.configurar) {
    window.InvitadosForm.configurar();
    console.log("✅ Formulario configurado");
  }

  // 5. Actualizar estadísticas
  if (window.Estadisticas && window.Estadisticas.actualizar) {
    window.Estadisticas.actualizar();
    console.log("✅ Estadísticas actualizadas");
  }

  console.log("✨ Aplicación inicializada correctamente");
});
