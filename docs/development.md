# 🔧 Guía de Desarrollo

Esta guía proporciona la información técnica necesaria para desarrolladores que deseen modificar, ampliar o entender el funcionamiento interno del Gestor de Invitaciones JPi.

## 📐 Arquitectura del Sistema

La aplicación sigue una arquitectura de tres componentes principales que operan en conjunto:

### 1. Envoltorio de Escritorio (Electron)

El núcleo de la aplicación de escritorio es un proceso principal de Electron que gestiona la ventana de la aplicación y la comunicación con el sistema operativo.

-   **Tecnología**: Electron.js
-   **Ubicación**: `electron-app/`
-   **Archivo Clave**: `main.js`
    -   **Gestión de Procesos**: Inicia y detiene el servidor backend de Flask automáticamente cuando la aplicación se abre o se cierra.
    -   **Creación de Ventanas**: Crea la ventana principal de la aplicación y expone APIs nativas al frontend (como el selector de directorios) a través de un script de `preload`.

### 2. Frontend (Interfaz de Usuario)

La interfaz es una Aplicación de Página Única (SPA) construida con HTML5, CSS3 y JavaScript modular. La comunicación entre módulos se realiza a través de funciones y objetos expuestos en el objeto `window`.

-   **Tecnologías**: HTML, CSS, JavaScript
-   **Ubicación**: `frontend/`
-   **Estructura de Módulos (`frontend/js/`)**: El código está organizado en módulos con responsabilidades únicas:
    -   `api.js`: Gestiona la comunicación con la API del backend.
    -   `ui.js`: Controla elementos de UI reusables como modales y notificaciones.
    -   `navigation.js`: Maneja la navegación entre las páginas.
    -   `invitados-lista.js` y `invitados-form.js`: Lógica para el CRUD de invitados.
    -   `invitaciones.js`: Orquesta el flujo de generación de dossieres.
    -   `import-export.js`: Lógica para la importación y exportación de datos.
    -   `main.js`: Punto de entrada que inicializa todos los demás módulos.

### 3. Backend (API REST)

Un microservidor construido en Python proporciona una API REST que el frontend consume. Se encarga de toda la lógica de negocio y la persistencia de datos.

-   **Tecnologías**: Flask, Flask-SQLAlchemy.
-   **Ubicación**: `backend/`
-   **Archivos Clave**:
    -   `main.py`: Define el modelo de datos de la base de datos (`Invitado`) y todos los endpoints de la API.
    -   `document_generator.py`: Contiene la lógica para renderizar plantillas `.docx`, convertirlas a PDF y unirlas con otros documentos.
    -   `db.sqlite`: La base de datos del sistema.

---

## 📦 Empaquetado y Distribución

Para empaquetar la aplicación en un ejecutable `.exe` para Windows, se utiliza `electron-builder`.

1.  **Configuración**: El archivo `package.json` contiene la configuración de `electron-builder`. La directiva `extraResources` es crucial, ya que se encarga de copiar el directorio completo del `backend` (incluyendo el entorno virtual de Python) a la carpeta de recursos de la aplicación empaquetada.
2.  **Comando de Build**: Para iniciar el proceso de empaquetado, ejecuta el siguiente comando desde la raíz del proyecto:
    ```bash
    npm run build:win
    ```
3.  **Artefactos**: Los ejecutables (instalador y versión portable) se encontrarán en la carpeta `dist/`.

---

## ⚙️ Referencia de la API

El backend expone los siguientes endpoints. La URL base en el entorno de desarrollo es `http://127.0.0.1:5000`.

### Endpoints de Invitados (CRUD)

-   `GET /api/invitados`: Devuelve una lista de todos los invitados.
-   `POST /api/invitados`: Crea un nuevo invitado. El cuerpo de la solicitud debe ser un JSON con los datos del invitado.
-   `PUT /api/invitados/<id>`: Actualiza un invitado existente.
-   `DELETE /api/invitados/<id>`: Elimina un invitado.

### Endpoints de Filtros

-   `GET /api/invitados/asesores_t1`: Devuelve todos los Asesores de Taller 1.
-   `GET /api/invitados/asesores_t2`: Devuelve todos los Asesores de Taller 2.
-   `GET /api/invitados/jurados_protocolo`: Devuelve los invitados elegibles como Jurado de Protocolo.
-   `GET /api/invitados/jurados_informe`: Devuelve los invitados elegibles como Jurado de Informe.

### Endpoints de Generación de Documentos

-   `POST /api/upload-files`
    -   **Descripción**: Sube los archivos base (plantilla, convocatoria, cronograma) al servidor.
    -   **Cuerpo**: `multipart/form-data`.

-   `POST /api/generate-all-invitations`
    -   **Descripción**: Inicia el proceso de generación de dossieres para todos los invitados.
    -   **Cuerpo (JSON)**: Contiene los datos del evento (`anio`, `periodo`, `fecha_evento`, etc.) y la ruta de la carpeta de salida (`output_dir`).

-   `POST /api/generate-single-invitation/<invitado_id>`
    -   **Descripción**: Genera el dossier para un único invitado.
    -   **Cuerpo (JSON)**: Igual que el endpoint para generar todas las invitaciones.

### Endpoints de Importación/Exportación

-   `GET /api/invitados/plantilla`: Descarga una plantilla de Excel (`.xlsx`) con instrucciones para la importación masiva de invitados.
-   `GET /api/invitados/exportar`: Exporta todos los invitados a un archivo. Acepta un parámetro de consulta `?formato=excel` o `?formato=csv`.
-   `POST /api/invitados/importar`: Importa invitados desde un archivo Excel o CSV. El archivo se envía como `multipart/form-data`.

---

## 📄 Guía de Plantillas DOCX

El sistema utiliza plantillas de Microsoft Word (`.docx`) para generar las cartas de invitación personalizadas. La librería `python-docx-template` reemplaza variables en la plantilla con los datos del invitado y del evento.

### Variables Disponibles

Puedes usar las siguientes variables en tu archivo `plantilla_base.docx`. Deben ir entre llaves dobles, como `{{ variable }}`.

#### Variables del Invitado

| Variable                | Descripción                                      | Ejemplo                                    |
| ----------------------- | ------------------------------------------------ | ------------------------------------------ |
| `{{ nombre_completo }}` | Nombre completo del invitado.                    | `Dr. Juan Pérez García`                    |
| `{{ puesto_completo }}` | El cargo o puesto completo del invitado.         | `Jefe del Departamento de Investigación`   |
| `{{ institucion }}`     | La organización o empresa a la que pertenece.    | `Instituto Tecnológico de Morelia`         |
| `{{ caracter_invitacion }}` | El motivo de la invitación (ej. rol en el evento). | `Jurado de protocolo en la FPI 2025.1`     |

#### Variables del Evento

| Variable             | Descripción                                     | Ejemplo                               |
| -------------------- | ----------------------------------------------- | ------------------------------------- |
| `{{ anio }}`           | Año del evento.                                 | `2025`                                |
| `{{ periodo }}`        | Periodo académico del evento.                   | `1`                                   |
| `{{ edicion_evento }}` | Texto libre para la edición del evento.         | `noviembre 2025`                      |
| `{{ fecha_evento }}`   | Fecha específica del evento.                    | `13 de junio de 2025`                 |
| `{{ fecha_carta }}`    | Fecha de la carta (formateada automáticamente). | `28 de octubre de 2025`               |
| `{{ nombre_firmante }}`| Nombre de la persona que firma la carta.        | `Claudio Ernesto Florián Arenas`      |
| `{{ cargo_firmante }}` | Cargo de la persona que firma.                  | `Jefe del Departamento de...`         |

### Ejemplo de Uso en la Plantilla

Un extracto de una plantilla podría verse así:

```
Morelia, Michoacán, a {{ fecha_carta }}

{{ nombre_completo }}
{{ puesto_completo }}
{{ institucion }}
Presente

Estimado(a) {{ nombre_completo }}:

Por medio de la presente, se le extiende una cordial invitación para participar como {{ caracter_invitacion }} en nuestra Feria de Proyectos...
```