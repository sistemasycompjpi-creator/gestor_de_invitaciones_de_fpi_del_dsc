# Guía de Uso

Sigue estos pasos para instalar y ejecutar el Gestor de Invitaciones JPi en tu sistema.

## Requisitos Previos

- **Node.js**: Versión 14 o superior. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
- **Python**: Versión 3.8 o superior. Puedes descargarlo desde [python.org](https://www.python.org/).
- **npm**: Se instala automáticamente con Node.js.

## Instalación

1.  **Clona o descarga el proyecto** en tu máquina local.

2.  **Abre una terminal** en la carpeta raíz del proyecto (`Invitaciones/`).

3.  **Instala las dependencias de Node.js** (principalmente Electron). Este comando leerá el `package.json` y descargará lo necesario en la carpeta `node_modules/`.

    ```bash
    npm install
    ```

    *Nota: El entorno virtual de Python y sus dependencias ya están incluidos en la carpeta `backend/`, por lo que no se requiere una configuración manual de Python.*

## Ejecución de la Aplicación

Para iniciar la aplicación, simplemente ejecuta el siguiente comando en la terminal desde la carpeta raíz del proyecto:

```bash
npm start
```

Este comando realiza las siguientes acciones en secuencia:

1.  Inicia el script principal de Electron definido en `package.json`.
2.  Electron, a su vez, ejecuta el servidor de backend Flask (`backend/main.py`) en un proceso secundario.
3.  El sistema espera a que el backend confirme que está listo (`health check`).
4.  Finalmente, se abre la ventana de la aplicación de escritorio, cargando la interfaz de usuario.

## Funcionalidades Principales

### Agregar un Invitado

1.  Navega a la pestaña **"Agregar Invitado"**.
2.  Completa el formulario. El **nombre completo** y el **carácter de la invitación** son campos requeridos.
3.  Puedes añadir hasta 4 cargos y organizaciones, así como una nota opcional.
4.  Marca los roles de asesoría (T1/T2) si corresponde. La elegibilidad como jurado se calculará automáticamente.
5.  Haz clic en **"Guardar Invitado"**. Verás una notificación de éxito y serás redirigido a la lista.

### Ver y Filtrar Invitados

1.  La pestaña **"Lista de Invitados"** muestra a todos los participantes por defecto.
2.  Usa los botones de filtro en la parte superior para acotar la lista por roles: `Asesor T1`, `Asesor T2`, `Jurado Protocolo` o `Jurado Informe`.
3.  El contador junto a los filtros se actualiza dinámicamente para mostrar cuántos invitados coinciden con el filtro actual.

### Editar un Invitado

1.  En la lista de invitados, haz clic en el botón **"✏️ Editar"** en la tarjeta del invitado que deseas modificar.
2.  Serás llevado a la pantalla del formulario, que se llenará automáticamente con los datos del invitado.
3.  Realiza los cambios necesarios en el formulario.
4.  Haz clic en el botón **"💾 Actualizar Invitado"**.
5.  Los cambios se guardarán y serás redirigido de nuevo a la lista.

### Eliminar un Invitado

1.  En la lista de invitados, haz clic en el botón **"🗑️ Eliminar"** en la tarjeta del invitado.
2.  Aparecerá un diálogo de confirmación para evitar eliminaciones accidentales.
3.  Confirma la acción para eliminar permanentemente al invitado de la base de datos.

### Ver Estadísticas

1.  Navega a la pestaña **"Estadísticas"**.
2.  Aquí encontrarás un resumen cuantitativo de los invitados registrados, desglosado por roles.
