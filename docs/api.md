# Referencia de la API

El backend de Flask proporciona una API RESTful para gestionar los recursos de los invitados. Todas las rutas tienen el prefijo `/api`.

**URL Base**: `http://127.0.0.1:5000`

## Objeto Invitado

Un objeto `Invitado` tiene la siguiente estructura en las respuestas JSON:

```json
{
  "id": 1,
  "nombre_completo": "Dr. Juan Pérez",
  "caracter_invitacion": "Jurado de Protocolo",
  "nota": "Experto en IA.",
  "puestos": [
    {
      "cargo": "Director de Posgrado",
      "organizacion": "Universidad Nacional"
    }
  ],
  "es_asesor_t1": false,
  "es_asesor_t2": true,
  "puede_ser_jurado_protocolo": true,
  "puede_ser_jurado_informe": false
}
```

--- 

## Endpoints de Invitados (CRUD)

### 1. Obtener todos los invitados

- **Endpoint**: `GET /api/invitados`
- **Descripción**: Devuelve una lista de todos los invitados registrados en la base de datos.
- **Respuesta Exitosa (200 OK)**: `[ { ... (objeto invitado) ... }, ... ]`

### 2. Obtener un invitado por ID

- **Endpoint**: `GET /api/invitados/<id>`
- **Descripción**: Devuelve un único invitado que coincide con el `id` proporcionado.
- **Respuesta Exitosa (200 OK)**: `{ ... (objeto invitado) ... }`
- **Respuesta de Error (404 Not Found)**: Si no se encuentra ningún invitado con ese ID.

### 3. Crear un nuevo invitado

- **Endpoint**: `POST /api/invitados`
- **Descripción**: Crea un nuevo invitado con los datos proporcionados en el cuerpo de la solicitud.
- **Cuerpo de la Solicitud (JSON)**:
  ```json
  {
    "nombre_completo": "Dra. Ana García",
    "caracter_invitacion": "Ponente Magistral",
    "nota": "Confirmar asistencia.",
    "cargo_1": "Investigadora Titular",
    "organizacion_1": "Centro de Investigación Científica",
    "es_asesor_t1": false,
    "es_asesor_t2": false
  }
  ```
- **Respuesta Exitosa (201 Created)**: `{ ... (objeto invitado creado) ... }`
- **Respuesta de Error (400 Bad Request)**: Si faltan campos requeridos como `nombre_completo` o `caracter_invitacion`.

### 4. Actualizar un invitado existente

- **Endpoint**: `PUT /api/invitados/<id>`
- **Descripción**: Actualiza los datos de un invitado existente. Solo se modifican los campos presentes en el cuerpo de la solicitud.
- **Cuerpo de la Solicitud (JSON)**: (similar al de creación, puede ser parcial)
  ```json
  {
    "nota": "Asistencia confirmada.",
    "es_asesor_t1": true
  }
  ```
- **Respuesta Exitosa (200 OK)**: `{ ... (objeto invitado actualizado) ... }`
- **Respuesta de Error (404 Not Found)**: Si no se encuentra ningún invitado con ese ID.

### 5. Eliminar un invitado

- **Endpoint**: `DELETE /api/invitados/<id>`
- **Descripción**: Elimina permanentemente a un invitado de la base de datos.
- **Respuesta Exitosa (200 OK)**: `{"result": "deleted"}`
- **Respuesta de Error (404 Not Found)**: Si no se encuentra ningún invitado con ese ID.

--- 

## Endpoints de Filtros Especializados

Estos endpoints devuelven una lista de invitados que cumplen con un criterio específico.

- `GET /api/invitados/asesores_t1`: Devuelve todos los invitados que son Asesores T1.
- `GET /api/invitados/asesores_t2`: Devuelve todos los invitados que son Asesores T2.
- `GET /api/invitados/jurados_protocolo`: Devuelve todos los invitados elegibles como Jurado de Protocolo.
- `GET /api/invitados/jurados_informe`: Devuelve todos los invitados elegibles como Jurado de Informe.

--- 

## Endpoint de Estado del Servidor

### Health Check

- **Endpoint**: `GET /api/health`
- **Descripción**: Se utiliza para verificar que el servidor backend está en funcionamiento. Es crucial para que Electron sepa cuándo puede mostrar la ventana de la aplicación.
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "status": "ok",
    "message": "Backend Flask está funcionando correctamente",
    "database": "connected"
  }
  ```
