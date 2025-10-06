// ========== MÓDULO DE ESTADÍSTICAS ==========
// Calcula y actualiza las estadísticas de invitados

/**
 * Actualiza todas las estadísticas
 * @param {Array} invitados - Array de invitados (opcional, si no se pasa usa los de InvitadosLista)
 */
function actualizarEstadisticas(invitados = null) {
  // Obtener invitados
  let invitadosData = invitados;
  if (!invitadosData && window.InvitadosLista) {
    invitadosData = window.InvitadosLista.obtenerInvitados();
  }

  if (!invitadosData || invitadosData.length === 0) return;

  // Total de invitados
  const statTotal = document.getElementById("stat-total");
  if (statTotal) {
    statTotal.textContent = invitadosData.length;
  }

  // Asesores T1
  const t1Count = invitadosData.filter((inv) => inv.es_asesor_t1).length;
  const statT1 = document.getElementById("stat-t1");
  if (statT1) {
    statT1.textContent = t1Count;
  }

  // Asesores T2
  const t2Count = invitadosData.filter((inv) => inv.es_asesor_t2).length;
  const statT2 = document.getElementById("stat-t2");
  if (statT2) {
    statT2.textContent = t2Count;
  }

  // Jurados Protocolo
  const protocoloCount = invitadosData.filter(
    (inv) => inv.puede_ser_jurado_protocolo
  ).length;
  const statProtocolo = document.getElementById("stat-protocolo");
  if (statProtocolo) {
    statProtocolo.textContent = protocoloCount;
  }

  // Jurados Informe
  const informeCount = invitadosData.filter(
    (inv) => inv.puede_ser_jurado_informe
  ).length;
  const statInforme = document.getElementById("stat-informe");
  if (statInforme) {
    statInforme.textContent = informeCount;
  }

  // Ambos jurados (protocolo E informe)
  const ambosCount = invitadosData.filter(
    (inv) => inv.puede_ser_jurado_protocolo && inv.puede_ser_jurado_informe
  ).length;
  const statAmbos = document.getElementById("stat-ambos");
  if (statAmbos) {
    statAmbos.textContent = ambosCount;
  }
}

/**
 * Obtiene estadísticas en formato objeto
 * @param {Array} invitados - Array de invitados
 * @returns {Object} Objeto con todas las estadísticas
 */
function obtenerEstadisticas(invitados = null) {
  let invitadosData = invitados;
  if (!invitadosData && window.InvitadosLista) {
    invitadosData = window.InvitadosLista.obtenerInvitados();
  }

  if (!invitadosData || invitadosData.length === 0) {
    return {
      total: 0,
      asesoresT1: 0,
      asesoresT2: 0,
      juradosProtocolo: 0,
      juradosInforme: 0,
      juradosAmbos: 0,
    };
  }

  return {
    total: invitadosData.length,
    asesoresT1: invitadosData.filter((inv) => inv.es_asesor_t1).length,
    asesoresT2: invitadosData.filter((inv) => inv.es_asesor_t2).length,
    juradosProtocolo: invitadosData.filter(
      (inv) => inv.puede_ser_jurado_protocolo
    ).length,
    juradosInforme: invitadosData.filter((inv) => inv.puede_ser_jurado_informe)
      .length,
    juradosAmbos: invitadosData.filter(
      (inv) => inv.puede_ser_jurado_protocolo && inv.puede_ser_jurado_informe
    ).length,
  };
}

// Exportar para uso global
window.Estadisticas = {
  actualizar: actualizarEstadisticas,
  obtener: obtenerEstadisticas,
};
