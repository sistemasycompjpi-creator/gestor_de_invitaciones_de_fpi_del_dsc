# 📐 Arquitectura del Proyecto

El Gestor de Invitaciones JPi (v2.0) sigue una arquitectura de tres componentes principales que trabajan en conjunto: un frontend modular, un backend de API y un envoltorio de aplicación de escritorio.

---

## 1. Frontend (Interfaz de Usuario Modular)

La interfaz de usuario es una aplicación de página única (SPA) construida con JavaScript modular, HTML5 y CSS3. La refactorización a módulos ha sido el cambio más significativo de la v2.0, mejorando drásticamente la mantenibilidad y escalabilidad.

-   **Tecnologías**: HTML5, CSS3, JavaScript (Módulos ES6 simulados en `window`)
-   **Ubicación**: `frontend/`

### Estructura de Módulos JavaScript (`frontend/js/`)

El código está organizado en 8 módulos especializados, cada uno con una responsabilidad única:

| Módulo | Responsabilidad |
| :--- | :--- |
| `api.js` | Gestiona toda la comunicación con la API del backend (peticiones HTTP). |
| `ui.js` | Controla elementos de UI reusables como modales y notificaciones. |
| `navigation.js` | Maneja la navegación entre las diferentes páginas de la aplicación. |
| `estadisticas.js` | Calcula y renderiza la página de estadísticas. |
| `invitados-lista.js` | Gestiona la visualización, filtrado y acciones (editar/eliminar) de la lista de invitados. |
| `invitados-form.js` | Controla la lógica del formulario para agregar y editar invitados. |
| `invitaciones.js` | Maneja la interfaz para configurar y previsualizar la generación de invitaciones en PDF. |
| `main.js` | Es el punto de entrada que inicializa y coordina todos los demás módulos. |

*Para más detalles sobre cómo desarrollar con esta arquitectura, consulta la **Guía de Desarrollo**.* 

---

## 2. Backend (API REST)

El backend es un microservidor construido en Python que expone una API REST para que el frontend la consuma. Se encarga de la lógica de negocio y la persistencia de datos.

-   **Tecnologías**: Flask, Flask-SQLAlchemy, Flask-CORS.
-   **Ubicación**: `backend/`
-   **Archivos Clave**:
    -   `main.py`: Define el modelo de datos `Invitado` y todos los endpoints de la API para el CRUD y los filtros.
    -   `db.sqlite`: Archivo de la base de datos SQLite.

*Para más detalles, consulta la **Referencia de la API**.* 

---

## 3. Envoltorio de Escritorio (Electron)

Para empaquetar la aplicación web en una experiencia de escritorio nativa para Windows, se utiliza Electron.

-   **Tecnología**: Electron.js
-   **Ubicación**: `electron-app/`
-   **Archivo Clave** (`main.js`):
    -   **Gestión de Procesos**: Inicia y detiene el servidor backend de Flask automáticamente.
    -   **Creación de Ventanas**: Crea la ventana principal de la aplicación y la ventana de documentación.
    -   **Menú Nativo**: Define el menú personalizado de la aplicación (`Archivo`, `Ver`, `Ayuda`).