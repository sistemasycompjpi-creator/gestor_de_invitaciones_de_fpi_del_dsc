/**
 * ==============================================
 * MÓDULO DE IMPORTACIÓN Y EXPORTACIÓN DE DATOS
 * ==============================================
 * 
 * Maneja la lógica para:
 * - Descargar una plantilla de Excel.
 * - Importar invitados desde un archivo Excel o CSV.
 * - Exportar la lista completa de invitados a Excel o CSV.
 */

const ImportExport = (() => {

  // URLs de la API
  const URL_PLANTILLA = 'http://127.0.0.1:5000/api/invitados/plantilla';
  const URL_IMPORTAR = 'http://127.0.0.1:5000/api/invitados/importar';
  const URL_EXPORTAR = 'http://127.0.0.1:5000/api/invitados/exportar';

  // Elementos del DOM
  let btnGenerarPlantilla;
  let btnImportar;
  let btnExportarExcel;
  let btnExportarCSV;
  let inputFile;
  let feedbackDiv;

  /**
   * Inicializa el módulo, obteniendo referencias a los elementos del DOM
   * y configurando los listeners de eventos.
   */
  function inicializar() {
    // Asignar elementos del DOM a las variables
    btnGenerarPlantilla = document.getElementById('btn-generar-plantilla');
    btnImportar = document.getElementById('btn-importar-archivo');
    btnExportarExcel = document.getElementById('btn-exportar-excel');
    btnExportarCSV = document.getElementById('btn-exportar-csv');
    inputFile = document.getElementById('input-file-import');
    feedbackDiv = document.getElementById('import-feedback');

    // Validar que todos los elementos existan antes de agregar listeners
    if (!btnGenerarPlantilla || !btnImportar || !btnExportarExcel || !btnExportarCSV || !inputFile || !feedbackDiv) {
      console.error("No se encontraron todos los elementos del DOM para el módulo de Import/Export.");
      return;
    }

    // Configurar listeners
    btnGenerarPlantilla.addEventListener('click', descargarPlantilla);
    btnImportar.addEventListener('click', importarArchivo);
    btnExportarExcel.addEventListener('click', () => exportarDatos('excel'));
    btnExportarCSV.addEventListener('click', () => exportarDatos('csv'));
    
    console.log("Módulo Import/Export inicializado.");
  }

  /**
   * Muestra un mensaje de feedback al usuario.
   * @param {string} message - El mensaje a mostrar.
   * @param {boolean} isError - Si es true, el mensaje se mostrará como un error.
   */
  function mostrarFeedback(message, isError = false) {
    if (!feedbackDiv) return;
    feedbackDiv.textContent = message;
    feedbackDiv.className = isError ? 'feedback-error' : 'feedback-success';
    feedbackDiv.style.display = 'block';
  }

  /**
   * Descarga la plantilla de Excel desde el backend.
   */
  async function descargarPlantilla() {
    try {
      const response = await fetch(URL_PLANTILLA);
      if (!response.ok) {
        throw new Error('No se pudo generar la plantilla en el servidor.');
      }
      const blob = await response.blob();
      // Crear un enlace temporal para iniciar la descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'plantilla_invitados.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error al descargar la plantilla:', error);
      mostrarFeedback('Error al descargar la plantilla.', true);
    }
  }

  /**
   * Sube el archivo seleccionado al backend para su importación.
   */
  async function importarArchivo() {
    if (!inputFile.files || inputFile.files.length === 0) {
      mostrarFeedback('Por favor, selecciona un archivo para importar.', true);
      return;
    }

    const file = inputFile.files[0];
    const formData = new FormData();
    formData.append('file', file);

    mostrarFeedback('Importando archivo, por favor espera...');

    try {
      const response = await fetch(URL_IMPORTAR, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error desconocido en el servidor.');
      }

      mostrarFeedback(result.message || 'Importación completada con éxito.');
      // Opcional: Recargar la lista de invitados si la página está visible
      if (window.InvitadosLista && typeof window.InvitadosLista.cargar === 'function') {
        window.InvitadosLista.cargar();
      }

    } catch (error) {
      console.error('Error al importar el archivo:', error);
      mostrarFeedback(`Error: ${error.message}`, true);
    }
  }

  /**
   * Exporta los datos de invitados en el formato especificado (Excel o CSV).
   * @param {string} formato - 'excel' o 'csv'.
   */
  async function exportarDatos(formato) {
    try {
      const response = await fetch(`${URL_EXPORTAR}?formato=${formato}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al exportar a ${formato}.`);
      }

      const blob = await response.blob();
      const filename = formato === 'excel' ? 'exportacion_invitados.xlsx' : 'exportacion_invitados.csv';
      
      // Crear enlace temporal para la descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error(`Error al exportar a ${formato}:`, error);
      // Aquí podrías usar un modal o un div de feedback si existiera en la página principal
      alert(`Error al exportar: ${error.message}`);
    }
  }

  // Exponer la función de inicialización para ser llamada desde fuera
  return {
    inicializar: inicializar
  };

})();

// Asignar al objeto global para poder llamarlo desde otros scripts
window.ImportExport = ImportExport;
