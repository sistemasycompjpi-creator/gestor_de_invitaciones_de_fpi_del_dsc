# 🧪 Guía de Pruebas

Esta guía detalla los pasos recomendados para verificar el correcto funcionamiento de todas las características principales del sistema.

## 📋 Pre-requisitos

1.  **Entorno Configurado**: Asegúrate de que el [entorno de desarrollo](development.md) esté completamente configurado (dependencias de `npm` y `pip` instaladas).
2.  **Base de Datos Limpia (Opcional)**: Para una prueba desde cero, puedes eliminar el archivo `backend/db.sqlite`. El servidor lo creará de nuevo al iniciarse.
3.  **Archivos de Prueba**: Ten a mano los 3 archivos necesarios para la generación de dossieres:
    -   Una plantilla de invitación (`.docx`) con las variables correctas.
    -   Un PDF de la convocatoria.
    -   Un PDF del cronograma/croquis.

## ✅ Flujo de Pruebas Funcionales

### 1. Inicio del Sistema

-   Ejecuta `npm start` en la terminal desde la raíz del proyecto. La aplicación de escritorio debería abrirse y el servidor de backend iniciarse automáticamente.

### 2. Pruebas del CRUD de Invitados

-   **Crear**: Ve a **"➕ Agregar Invitado"** y crea al menos dos invitados de prueba con datos diferentes. Asegúrate de asignarles distintos roles de asesoría para probar la lógica de jurados.
-   **Leer**: Confirma que los invitados aparecen correctamente en la **"👥 Lista de Invitados"**. Usa los filtros para verificar que los roles se asignaron y filtran como es debido.
-   **Actualizar**: Haz clic en **"✏️ Editar"** en un invitado, modifica algunos de sus datos (ej. el puesto o la nota) y guarda los cambios. Verifica que la lista refleje la información actualizada.
-   **Eliminar**: Haz clic en **"🗑️ Eliminar"** en un invitado y confirma la acción. El invitado debería desaparecer de la lista.

### 3. Pruebas de Importación y Exportación

-   **Exportar**: Ve a **"🔄 Importar/Exportar"** y haz clic en **"📗 Exportar a Excel"**. Abre el archivo descargado y verifica que contenga los invitados que creaste.
-   **Importar**: Descarga la plantilla, añade un nuevo invitado de prueba en el archivo Excel, guárdalo y súbelo usando la función de importar. Verifica que el nuevo invitado aparezca en la lista general.

### 4. Pruebas de Generación de Dossieres

1.  **Navegar**: Ve a la sección **"📄 Generar Invitaciones"**.
2.  **Cargar Archivos**: Sube los 3 archivos base (`.docx`, `convocatoria.pdf`, `cronograma.pdf`) y haz clic en **"⬆️ Cargar Archivos al Servidor"**.
3.  **Configurar Evento**: Completa todos los campos de información del evento.
4.  **Seleccionar Destino**: Elige una carpeta en tu computadora donde se guardarán los resultados.
5.  **Generar para Uno**: Selecciona el modo "Generar para UN SOLO invitado", elige uno de la lista y haz clic en **"🚀 Generar Invitación(es)"**.
6.  **Verificar Archivo Individual**: Busca el PDF generado en tu carpeta de destino. Ábrelo y comprueba que:
    -   La carta de invitación tiene los datos correctos del invitado.
    -   El dossier contiene las páginas de la convocatoria y el cronograma después de la carta.
7.  **Generar para Todos**: Cambia al modo "Generar para TODOS los invitados" y repite el proceso. Verifica que se cree un archivo PDF para cada invitado registrado.

## 🐛 Resolución de Problemas Comunes

-   **Error `docx2pdf failed`**: Este error suele ocurrir si Microsoft Word no está instalado. `docx2pdf` depende de la API de Word para la conversión. Instalar [LibreOffice](https://www.libreoffice.org/) puede ser una alternativa, pero la compatibilidad no está garantizada.
-   **El Backend no responde**: Si la aplicación muestra errores de conexión, abre una terminal y ejecuta `cd backend` y `venv\Scripts\activate`, seguido de `python main.py` para ver si hay errores en el inicio del servidor Flask.