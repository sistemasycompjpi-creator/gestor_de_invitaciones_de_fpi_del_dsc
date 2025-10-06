# Guía de Uso

Sigue estos pasos para instalar y utilizar el Gestor de Invitaciones JPi.

## Instalación y Ejecución

1.  **Requisitos**: Asegúrate de tener **Node.js** (v14+) y **Python** (v3.8+) instalados.
2.  **Instala dependencias**: En la carpeta raíz del proyecto, ejecuta `npm install`.
3.  **Inicia la aplicación**: Ejecuta `npm start`.

---

## Funcionalidades

### Gestión de Invitados

-   **Agregar/Editar/Eliminar**: Administra la lista de invitados desde las pestañas "Agregar Invitado" y "Lista de Invitados".
-   **Filtrar**: Usa los botones de filtro para encontrar invitados por su rol específico.

### Generación de Invitaciones

La pestaña **"Generar Invitaciones"** te permite crear los dossieres completos en formato PDF.

**Flujo de trabajo:**

1.  **Cargar Archivos Base**: Sube los tres documentos requeridos: la plantilla de la carta (`.docx`), la convocatoria (`.pdf`) y el cronograma (`.pdf`). Haz clic en **"⬆️ Cargar Archivos"** para enviarlos al servidor.
2.  **Completar Datos del Evento**: Rellena la información del evento, como el año, periodo y fechas.
3.  **Previsualizar (Opcional)**: Selecciona un invitado de la lista desplegable para generar una vista previa en imagen de cómo se verá su invitación.
4.  **Generar Invitaciones**: Haz clic en el botón **"Generar Todas las Invitaciones"**. El sistema creará un dossier en PDF para cada invitado registrado y lo guardará en una nueva carpeta en tu Escritorio (ej. `~/Desktop/2025.1-invitaciones/`).

### Estadísticas

La pestaña **"Estadísticas"** ofrece un resumen visual del número total de invitados y su distribución por roles.
