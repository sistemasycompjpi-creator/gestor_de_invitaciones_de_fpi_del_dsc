# Arquitectura del Proyecto

El Gestor de Invitaciones JPi sigue una arquitectura de tres componentes principales que trabajan en conjunto para ofrecer una aplicación de escritorio robusta.

## 1. Frontend (Interfaz de Usuario)

La interfaz de usuario es una aplicación web estándar construida con tecnologías web clásicas.

- **Tecnologías**: HTML5, CSS3, JavaScript (Vanilla).
- **Ubicación**: `frontend/`
- **Archivos Clave**:
  - `index.html`: Estructura principal de la aplicación, contiene el layout de las diferentes páginas (lista, agregar, estadísticas).
  - `styles/style.css`: Hoja de estilos que define la apariencia visual, incluyendo el diseño responsive, las animaciones y los temas de color.
  - `js/app.js`: Contiene toda la lógica de la interfaz. Se encarga de:
    - Realizar peticiones a la API del backend para obtener y manipular datos.
    - Renderizar dinámicamente la lista de invitados.
    - Gestionar los filtros y la navegación entre páginas.
    - Manejar los eventos del formulario para agregar y editar invitados.
    - Mostrar notificaciones y modales de confirmación.

## 2. Backend (Servidor y Lógica de Negocio)

El backend es un microservidor construido en Python que expone una API REST para que el frontend la consuma.

- **Tecnologías**: Flask, Flask-SQLAlchemy, Flask-CORS.
- **Ubicación**: `backend/`
- **Archivos y Carpetas Clave**:
  - `main.py`: Corazón del backend. Define:
    - La configuración de la aplicación Flask.
    - El modelo de datos `Invitado` utilizando SQLAlchemy.
    - Todos los endpoints de la API REST para el CRUD (Crear, Leer, Actualizar, Eliminar) y los filtros.
    - La lógica de negocio para calcular los roles de jurado.
  - `db.sqlite`: Archivo de la base de datos SQLite donde se almacenan todos los datos de los invitados.
  - `requirements.txt`: Lista de las dependencias de Python necesarias para el backend.
  - `venv/`: Entorno virtual de Python que contiene las dependencias instaladas, asegurando un ambiente de ejecución aislado.

## 3. Envoltorio de Escritorio (Electron)

Para convertir la aplicación web en una aplicación de escritorio nativa, se utiliza Electron.

- **Tecnología**: Electron.js.
- **Ubicación**: `electron-app/`
- **Archivo Clave**:
  - `main.js`: El script principal de Electron. Sus responsabilidades son:
    - **Iniciar y detener el backend**: Inicia el servidor Flask de Python como un proceso secundario cuando la aplicación de Electron arranca y se asegura de detenerlo cuando la aplicación se cierra.
    - **Crear la ventana principal**: Crea la `BrowserWindow` que carga el archivo `frontend/index.html`.
    - **Comunicación y Sincronización**: Incluye una lógica de sondeo (`health check`) para esperar a que el servidor backend esté completamente funcional antes de cargar la interfaz, mejorando la fiabilidad del arranque.

## Estructura General de Carpetas

```
Invitaciones/
├── assets/               # Recursos globales (iconos, etc.)
├── backend/              # Lógica del servidor (API Flask)
├── docs/                 # Documentación del proyecto
├── electron-app/         # Configuración de la aplicación de escritorio
├── frontend/             # Interfaz de usuario (HTML, CSS, JS)
├── node_modules/         # Dependencias de Node.js (para Electron)
├── output/               # Carpeta para archivos generados (ignorada por Git)
├── .gitignore            # Archivos y carpetas ignorados por Git
├── notas.md              # Notas de desarrollo y planificación
├── package.json          # Metadatos y scripts del proyecto Node.js
└── README.md             # Resumen del proyecto
```
