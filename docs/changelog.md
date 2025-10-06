# 📝 Registro de Cambios

Este documento resume las mejoras y cambios más significativos aplicados al sistema.

## Versión 2.0 (Octubre 2025)

### 🔥 Cambios Mayores

-   **Reestructuración Completa de la Documentación**: Toda la documentación del proyecto ha sido auditada, actualizada y reescrita para reflejar con precisión el estado actual de la aplicación. Se eliminaron documentos obsoletos y se consolidó la información técnica en una guía de desarrollo unificada.

-   **Modelo de Datos Simplificado**: Se consolidó el modelo de datos de los invitados. Los múltiples campos de `cargo` y `organizacion` fueron reemplazados por dos campos únicos y claros: `puesto_completo` e `institucion`. Esto simplifica la gestión de datos y la creación de plantillas.

-   **Funcionalidad de Importación y Exportación**: Se añadió una nueva sección para importar y exportar invitados de forma masiva utilizando archivos Excel o CSV, agilizando significativamente la carga inicial de datos.

### ✨ Mejoras

-   **Nomenclatura de Archivos Mejorada**: El sistema ahora utiliza un campo de "Abreviación" opcional para generar nombres de archivo PDF más cortos y organizados (ej. `2025.1-DOSSIER-ITM-Nombre.pdf`).
-   **Formato Automático de Fecha**: La fecha de la carta se formatea automáticamente al formato largo en español (ej. `28 de octubre de 2025`), reduciendo la necesidad de formato manual.
-   **Selección de Carpeta de Salida**: El usuario ahora puede seleccionar directamente la carpeta de destino donde se guardarán los dossieres generados, ofreciendo mayor flexibilidad.

### 🗑️ Funcionalidad Eliminada

-   **Vista Previa en Imagen**: La funcionalidad que generaba una vista previa de la invitación en formato de imagen fue eliminada del frontend para simplificar la interfaz y el flujo de trabajo de generación.