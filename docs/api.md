# Referencia de la API

El backend de Flask proporciona una API RESTful para gestionar los recursos del proyecto. Todas las rutas tienen el prefijo `/api`.

**URL Base**: `http://127.0.0.1:5000`

---

## Endpoints de Invitados (CRUD)

-   **GET `/api/invitados`**: Devuelve una lista de todos los invitados.
-   **GET `/api/invitados/<id>`**: Devuelve un único invitado por su ID.
-   **POST `/api/invitados`**: Crea un nuevo invitado.
-   **PUT `/api/invitados/<id>`**: Actualiza un invitado existente.
-   **DELETE `/api/invitados/<id>`**: Elimina un invitado.

---

## Endpoints de Filtros

-   **GET `/api/invitados/asesores_t1`**: Devuelve todos los Asesores T1.
-   **GET `/api/invitados/asesores_t2`**: Devuelve todos los Asesores T2.
-   **GET `/api/invitados/jurados_protocolo`**: Devuelve los elegibles como Jurado de Protocolo.
-   **GET `/api/invitados/jurados_informe`**: Devuelve los elegibles como Jurado de Informe.

---

## Endpoints de Generación de Invitaciones

-   **POST `/api/upload-assets`**
    -   **Descripción**: Sube los archivos base (plantilla `.docx`, convocatoria `.pdf`, cronograma `.pdf`) al servidor para ser usados en la generación de documentos.
    -   **Cuerpo**: `multipart/form-data` con los tres archivos.

-   **POST `/api/generate-all-invitations`**
    -   **Descripción**: Inicia el proceso de generación de dossieres en PDF para todos los invitados registrados en la base de datos.
    -   **Cuerpo (JSON)**: Contiene los datos del evento (`anio`, `periodo`, `fecha_evento`, etc.).

-   **POST `/api/preview-invitation/<invitado_id>`**
    -   **Descripción**: Genera una imagen PNG de vista previa para un invitado específico, permitiendo al usuario ver cómo lucirá la invitación antes de la generación final.
    -   **Cuerpo (JSON)**: Contiene los datos del evento necesarios para rellenar la plantilla.

---

## Endpoint de Estado del Servidor

-   **GET `/api/health`**: Endpoint de diagnóstico para verificar que el servidor está en funcionamiento.
