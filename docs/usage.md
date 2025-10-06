# Guía de Uso

Sigue estos pasos para instalar y utilizar el Gestor de Invitaciones JPi.

## Instalación

1.  **Requisitos**: Asegúrate de tener **Node.js** (v14+) y **Python** (v3.8+) instalados.
2.  **Clona el proyecto** y abre una terminal en la carpeta raíz.
3.  **Instala las dependencias** de Node.js con el comando:
    ```bash
    npm install
    ```

## Ejecución

Para iniciar la aplicación, ejecuta:

```bash
npm start
```

La aplicación iniciará el servidor de fondo y abrirá la ventana principal.

---

## Funcionalidades

### Gestión de Invitados

-   **Agregar**: Ve a la pestaña "Agregar Invitado", completa el formulario y guarda.
-   **Editar**: En la lista de invitados, haz clic en el botón "✏️ Editar", modifica los datos y actualiza.
-   **Eliminar**: Haz clic en "🗑️ Eliminar" en la tarjeta de un invitado y confirma la acción.
-   **Filtrar**: Usa los botones en la parte superior de la lista para ver a los invitados por rol.

### Generación de Invitaciones

La pestaña **"Generar Invitaciones"** te permite configurar y previsualizar las invitaciones en PDF.

1.  **Carga los 3 archivos PDF requeridos**: Plantilla, Convocatoria y Cronograma.
2.  **Completa los datos del evento**: Año, periodo, fecha, etc.
3.  **Previsualiza**: Usa los controles de navegación (← / →) y zoom para ver cómo se verá cada invitación.

**Nota Importante**: La interfaz de esta sección está 100% funcional para la configuración y previsualización. Sin embargo, el paso final de **generar los archivos PDF aún no está implementado en el backend**. Para detalles técnicos sobre cómo implementar esta función, consulta la **Guía de Desarrollo**.

### Estadísticas

La pestaña **"Estadísticas"** ofrece un resumen visual del número total de invitados y su distribución por roles.