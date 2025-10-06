# 🧪 Guía de Pruebas

Esta guía detalla los pasos para verificar el correcto funcionamiento del sistema de invitaciones.

---

## 📋 Pre-requisitos

1.  **Verificar Dependencias de Python**: Asegúrate de que todas las librerías del backend estén instaladas ejecutando `pip install -r requirements.txt` dentro del entorno virtual del backend.
2.  **Verificar Estructura de Carpetas**: Confirma que existan las carpetas `backend/assets/` y `backend/temp_output/`.

---

## 🎯 PASO 1: Preparar Archivos de Prueba

1.  **¡IMPORTANTE! Borrar Base de Datos Antigua**: Debido a cambios en la estructura, debes eliminar el archivo `backend/db.sqlite` si existe.

   ```cmd
   del backend\db.sqlite
   ```

2.  **Crear Plantilla `invitacion.docx`**: Crea un archivo de Word con el contenido y las variables (`{{ variable }}`) descritas en la **Guía de Desarrollo**.
3.  **Preparar PDFs**: Ten a la mano dos archivos PDF para usar como `convocatoria.pdf` y `cronograma.pdf`.

---

## 🚀 PASO 2: Iniciar el Sistema

1.  **Iniciar Backend**: Ejecuta `npm start` en la raíz del proyecto. Esto iniciará tanto el backend como el frontend.

---

## ✅ PASO 3: Pruebas Funcionales

1.  **Agregar Invitados**: Ve a la pestaña "Agregar Invitado" y crea 2 o 3 invitados de prueba con datos completos.

2.  **Cargar Archivos Base**: 
    -   Ve a la pestaña "Generar Invitaciones".
    -   Sube los 3 archivos (`.docx` y los dos `.pdf`).
    -   Haz clic en **"⬆️ Cargar Archivos"** y espera la confirmación.

3.  **Configurar Evento**: Llena todos los campos del evento (año, periodo, fechas, etc.).

4.  **Generar Vista Previa**:
    -   En el panel derecho, selecciona un invitado del menú desplegable.
    -   Verifica que se genere una imagen de la invitación con los datos correctos.

5.  **Generar Todas las Invitaciones**:
    -   Haz clic en **"🚀 Generar Todas las Invitaciones"**.
    -   Espera el modal de confirmación.
    -   Busca la nueva carpeta en tu Escritorio (ej. `~/Desktop/2025.1-invitaciones/`).
    -   Abre un PDF generado y verifica que contenga la carta personalizada, la convocatoria y el cronograma.

---

## 🐛 Resolución de Problemas Comunes

-   **Error "docx2pdf failed"**: Este error ocurre si no tienes Microsoft Word instalado en Windows. Una alternativa gratuita es instalar [LibreOffice](https://www.libreoffice.org/).
-   **La vista previa no carga**: Verifica que el backend esté corriendo, que los archivos base se hayan cargado y que todos los campos del evento estén llenos. Revisa la consola del navegador (F12) para ver posibles errores.
-   **PDFs generados sin anexos**: Asegúrate de que `convocatoria.pdf` y `cronograma.pdf` se hayan cargado correctamente y existan en la carpeta `backend/assets/`.
