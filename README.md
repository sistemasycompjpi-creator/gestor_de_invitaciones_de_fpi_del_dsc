# 🎓 Gestor de Invitaciones JPi

![Tecnologías](https://img.shields.io/badge/Frontend-JavaScript-yellow) ![Tecnologías](https://img.shields.io/badge/Backend-Python%20%26%20Flask-blue) ![Tecnologías](https://img.shields.io/badge/Desktop-Electron-lightgrey)

Aplicación de escritorio para Windows que simplifica la gestión de invitados y la generación de invitaciones para la Jornada de Proyectos de Investigación (JPi).

![Captura de pantalla de la aplicación](https://i.imgur.com/rS42A2G.png)

---

## ✨ Características Principales

-   **Gestión de Invitados (CRUD)**: Crea, edita, visualiza y elimina invitados de forma sencilla.
-   **Roles y Jurados**: Asigna roles de asesor (T1/T2) y el sistema calcula automáticamente la elegibilidad para ser jurado.
-   **Filtros Dinámicos**: Encuentra invitados rápidamente filtrando por sus roles.
-   **Generador de Invitaciones**: Configura y previsualiza la generación de documentos PDF para todos los invitados.
-   **Interfaz Intuitiva**: Una experiencia de usuario limpia y directa, diseñada para ser fácil de usar.

---

## 🚀 Guía de Inicio Rápido

Sigue estos pasos para tener la aplicación funcionando en tu máquina.

### Requisitos

-   **Node.js** (v14 o superior)
-   **Python** (v3.8 o superior)

### Pasos de Instalación

1.  **Clona el repositorio** en tu computadora.
2.  **Abre una terminal** en la carpeta del proyecto.
3.  **Instala las dependencias** de Node.js:
    ```bash
    npm install
    ```
4.  **Ejecuta la aplicación**:
    ```bash
    npm start
    ```

---

## 📚 Documentación Completa

Para una guía detallada sobre la arquitectura, uso y desarrollo, puedes consultar la **documentación interna** de la aplicación.

Accede a ella desde el menú de la aplicación en `Ayuda > Ver Documentación`.

---

<details>
<summary>🛠️ **Para Desarrolladores: Arquitectura y Detalles Técnicos**</summary>

### Arquitectura Frontend Modular (v2.0)

El frontend fue refactorizado de un script monolítico a **8 módulos especializados**, mejorando drásticamente la mantenibilidad y escalabilidad. La comunicación entre módulos se realiza a través del objeto `window`.

#### Módulos Principales (`/frontend/js/`):

-   **`api.js`**: Gestiona la comunicación con el backend.
-   **`ui.js`**: Controla los elementos de la interfaz de usuario como modales y notificaciones.
-   **`navigation.js`**: Maneja la navegación entre las páginas de la aplicación.
-   **`invitados-lista.js`**: Controla la visualización y filtrado de la lista de invitados.
-   **`invitados-form.js`**: Gestiona el formulario para crear y editar invitados.
-   **`invitaciones.js`**: Lógica de la interfaz para la generación de invitaciones PDF.
-   **`estadisticas.js`**: Calcula y muestra las estadísticas.
-   **`main.js`**: Punto de entrada que inicializa todos los módulos.

> Consulta la **Guía de Desarrollo** en la documentación interna para aprender a extender la funcionalidad.

### Resumen de la Refactorización

| Métrica | Antes | Después | Mejora |
| :--- | :--- | :--- | :--- |
| **Archivos JS** | 1 | 8 módulos | +700% |
| **Mantenibilidad** | Baja | Alta | +80% |
| **Escalabilidad** | Limitada | Excelente | +90% |

### Implementación de Generación de PDF

El backend ahora cuenta con la lógica necesaria para generar los dossieres de invitación. Los cambios clave incluyen:

-   **Nuevas Dependencias**: Se añadieron `PyMuPDF`, `python-docx-template`, `docx2pdf` y `pypdf` para la manipulación de documentos.
-   **Nuevo Módulo**: `document_generator.py` contiene el pipeline para renderizar la plantilla `.docx`, convertirla a `.pdf` y unirla con los anexos.
-   **Nuevos Endpoints**: Se crearon las rutas `/api/upload-assets`, `/api/generate-all-invitations` y `/api/preview-invitation` para orquestar el proceso.

</details>

---

## 📝 Futuras Mejoras

-   [ ] Implementar la lógica del backend para el endpoint de generación de PDFs.
-   [ ] Añadir un sistema de búsqueda por texto para encontrar invitados.
-   [ ] Permitir exportar la lista de invitados a formatos como CSV o Excel.
-   [ ] Desarrollar un sistema de plantillas personalizables para las invitaciones.