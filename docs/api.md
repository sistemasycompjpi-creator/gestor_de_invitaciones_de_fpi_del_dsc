# Referencia de la API

El backend de Flask proporciona una API RESTful para gestionar los recursos de los invitados. Todas las rutas tienen el prefijo `/api`.

**URL Base**: `http://127.0.0.1:5000`

---

## Endpoints de Invitados (CRUD)

### 1. Obtener todos los invitados

- **Endpoint**: `GET /api/invitados`
- **Descripción**: Devuelve una lista de todos los invitados registrados.

### 2. Obtener un invitado por ID

- **Endpoint**: `GET /api/invitados/<id>`
- **Descripción**: Devuelve un único invitado por su ID.

### 3. Crear un nuevo invitado

- **Endpoint**: `POST /api/invitados`
- **Descripción**: Crea un nuevo invitado.
- **Cuerpo (JSON)**: Debe incluir `nombre_completo` y `caracter_invitacion`.

### 4. Actualizar un invitado existente

- **Endpoint**: `PUT /api/invitados/<id>`
- **Descripción**: Actualiza los datos de un invitado existente.

### 5. Eliminar un invitado

- **Endpoint**: `DELETE /api/invitados/<id>`
- **Descripción**: Elimina a un invitado de la base de datos.

---

## Endpoints de Filtros

Estos endpoints devuelven una lista de invitados que cumplen con un criterio específico.

- `GET /api/invitados/asesores_t1`: Devuelve todos los Asesores T1.
- `GET /api/invitados/asesores_t2`: Devuelve todos los Asesores T2.
- `GET /api/invitados/jurados_protocolo`: Devuelve los elegibles como Jurado de Protocolo.
- `GET /api/invitados/jurados_informe`: Devuelve los elegibles como Jurado de Informe.

---

## Endpoint de Generación de Invitaciones

-   **Endpoint**: `POST /api/invitaciones/generar`
-   **Estado**: ⚠️ **No Implementado**
-   **Descripción**: Este endpoint está planificado para recibir los datos y archivos PDF desde el frontend y generar las invitaciones finales. La lógica del backend para este endpoint aún debe ser desarrollada.
-   **Para más detalles**, consulta la **Guía de Desarrollo**.

---

## Endpoint de Estado del Servidor

- **Endpoint**: `GET /api/health`
- **Descripción**: Se utiliza para verificar que el servidor backend está en funcionamiento.