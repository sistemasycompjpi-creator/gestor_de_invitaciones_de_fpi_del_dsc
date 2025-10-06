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

## 🚀 Guía de Inicio Rápido (Entorno de Desarrollo)

Sigue estos pasos para tener la aplicación funcionando en tu máquina local para desarrollo.

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
4.  **Configura el entorno virtual de Python** y activa las dependencias:
    ```bash
    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
    ```
5.  **Ejecuta la aplicación**:
    ```bash
    npm start
    ```

---

## 📦 Guía de Empaquetado y Distribución

Esta sección explica cómo empaquetar la aplicación en un ejecutable `.exe` para Windows.

### 1. Configuración del Empaquetado

El archivo `package.json` está configurado con `electron-builder` para manejar el proceso.

-   **`files`**: Define qué archivos del frontend y electron se incluyen.
-   **`extraResources`**: Copia el directorio completo del `backend` (incluyendo el `venv`) a la carpeta `resources` de la aplicación empaquetada. Se aplican filtros para excluir archivos innecesarios como `__pycache__` o paquetes de `pip`.
-   **`win` y `nsis`**: Configuran la creación de un instalador (`.exe` con asistente) y una versión portable (`.exe` standalone).

El script `electron-app/main.js` detecta si la aplicación se ejecuta en modo de producción (`app.isPackaged`) y ajusta las rutas del backend para que apunten a `process.resourcesPath`.

### 2. Cómo Empaquetar la Aplicación

#### Checklist Pre-Empaquetado
- [ ] `npm start` funciona correctamente.
- [ ] El backend se conecta sin errores.
- [ ] Todas las funciones han sido probadas (CRUD, generación de PDF).
- [ ] `requirements.txt` está actualizado, especialmente `pywin32`.
- [ ] El ícono `assets/JPi-fondo-blanco.ico` existe.

#### Pasos para Empaquetar
1.  **Limpia artefactos de compilaciones anteriores** (opcional pero recomendado). Puedes usar el script `clean-before-build.bat`.
2.  **Ejecuta el comando de build** desde la raíz del proyecto:
    ```bash
    npm run build:win
    ```
3.  **Espera** a que el proceso termine (puede tardar varios minutos).
4.  **Encuentra los ejecutables** en la carpeta `dist/`.

### 3. Archivos Generados

-   `Gestor Invitaciones JPi Setup 1.0.0.exe`: Instalador completo con asistente. **Recomendado para distribución**.
-   `Gestor Invitaciones JPi 1.0.0.exe`: Versión portable que no requiere instalación.
-   `win-unpacked/`: Carpeta con la aplicación descomprimida, útil para depuración.

### 4. Probar el Ejecutable
- **Prueba la versión portable** ejecutándola directamente.
- **Prueba el instalador**, sigue los pasos y ejecuta la aplicación desde el acceso directo creado.
- **Verifica la funcionalidad clave**:
    - En la consola de DevTools (`Ctrl+Shift+I`) debe aparecer `🚀 Ejecutando en modo PRODUCCIÓN`.
    - El backend debe conectar correctamente.
    - La generación de invitaciones debe funcionar y guardar los archivos en el Escritorio.

---

## 🔧 Solución de Problemas (Troubleshooting)

### Error de COM en Windows (`CoInitialize`)

-   **Error:** `(-2147221008, 'No se ha llamado a CoInitialize.', None, None)` al generar PDFs.
-   **Causa:** La librería `docx2pdf` usa el COM de Windows para automatizar Microsoft Word, y requiere que cada hilo de ejecución inicialice el COM antes de usarlo.
-   **Solución:** En `backend/document_generator.py`, se implementó el siguiente patrón dentro de las funciones que usan `docx2pdf`:
    ```python
    import pythoncom

    try:
        # 1. Inicializar COM al inicio
        pythoncom.CoInitialize()

        # ... código que llama a convert() de docx2pdf ...

    finally:
        # 2. Desinicializar COM al final, sí o sí
        pythoncom.CoUninitialize()
    ```
-   **Dependencia Crítica:** Asegúrate de que `pywin32` esté en `requirements.txt` y se instale correctamente.

### Errores Comunes de Empaquetado

-   **Error: "Backend no responde" en la app empaquetada.**
    - **Causa:** El `venv` de Python o el script principal no se copiaron correctamente.
    - **Solución:** Revisa la configuración de `extraResources` en `package.json` y asegúrate de que las rutas sean correctas. Vuelve a empaquetar.

-   **Error: "Cannot find module 'electron-builder'"**
    - **Causa:** La dependencia de desarrollo no está instalada.
    - **Solución:** Ejecuta `npm install --save-dev electron-builder`.

-   **Error: El `.exe` es demasiado grande (>300 MB).**
    - **Causa:** Se están incluyendo paquetes innecesarios del `venv`.
    - **Solución:** Verifica que el `filter` en `extraResources` excluya directorios como `pip*` y `setuptools*`.

---

## 🛠️ Para Desarrolladores: Arquitectura y Detalles Técnicos

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

### Implementación de Generación de PDF

El backend ahora cuenta con la lógica necesaria para generar los dossieres de invitación. Los cambios clave incluyen:

-   **Nuevas Dependencias**: Se añadieron `PyMuPDF`, `python-docx-template`, `docx2pdf` y `pypdf` para la manipulación de documentos.
-   **Nuevo Módulo**: `document_generator.py` contiene el pipeline para renderizar la plantilla `.docx`, convertirla a `.pdf` y unirla con los anexos.
-   **Nuevos Endpoints**: Se crearon las rutas `/api/upload-assets`, `/api/generate-all-invitations` y `/api/preview-invitation` para orquestar el proceso.

---

## 📝 Futuras Mejoras

-   [ ] Añadir un sistema de búsqueda por texto para encontrar invitados.
-   [ ] Permitir exportar la lista de invitados a formatos como CSV o Excel.
-   [ ] Desarrollar un sistema de plantillas personalizables para las invitaciones.
