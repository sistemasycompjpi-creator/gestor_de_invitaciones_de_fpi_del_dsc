# 🔧 Guía de Desarrollo

Esta guía está destinada a desarrolladores que deseen modificar o ampliar la funcionalidad del Gestor de Invitaciones JPi.

## Arquitectura Frontend Modular

El frontend utiliza un patrón de módulos simple donde cada archivo `.js` en `frontend/js/` se encarga de una única responsabilidad. Los módulos exponen sus funciones públicas adjuntándolas al objeto `window`.

### Estructura de un Módulo

```javascript
// ========== MÓDULO DE [NOMBRE] ==========
// Descripción de la responsabilidad del módulo.

// Variables y estado privados del módulo
let miVariablePrivada = [];

// Funciones privadas (no se exponen en window)
function funcionAuxiliar() {
  //...
}

// Funciones públicas
function miFuncionPublica() {
  //...
}

// Se exponen las funciones públicas en el objeto window
window.MiModulo = {
  miFuncionPublica,
};
```

### Añadir una Nueva Funcionalidad

1.  **Crear un nuevo archivo de módulo** en `frontend/js/` (ej. `reportes.js`).
2.  **Escribir la lógica** dentro del archivo, siguiendo el patrón de módulo.
3.  **Incluir el nuevo script** en `frontend/index.html` al final de la lista de módulos, justo antes de `main.js`.
    ```html
    <script src="./js/reportes.js"></script>
    <script src="./js/main.js"></script>
    ```
4.  **Llamar a las nuevas funciones** desde otros módulos o desde la UI según sea necesario.
    ```javascript
    window.Reportes.generar();
    ```

---

## Tarea Pendiente: Implementar Endpoint de Generación de PDF

El frontend para la generación de invitaciones está completo, pero el endpoint del backend no está implementado. 

### Especificación del Endpoint

-   **Ruta**: `POST /api/invitaciones/generar`
-   **Método**: `POST`
-   **Tipo de Contenido**: `multipart/form-data`

### Datos que Recibirá del Frontend

El backend recibirá un `FormData` con los siguientes campos:

-   **Archivos PDF**:
    -   `plantilla_doc`: El PDF con el membrete.
    -   `convocatoria`: El PDF de la convocatoria.
    -   `cronograma`: El PDF del cronograma.
-   **Datos del Evento (texto)**:
    -   `periodo_anio`, `periodo_numero`
    -   `edicion_evento`, `fecha_evento`, `fecha_carta`
-   **Plantilla de Texto (texto)**:
    -   `plantilla_texto`: El cuerpo de la carta con variables como `{{ nombre_completo }}`.
-   **Datos de Invitados (JSON string)**:
    -   `invitados_data`: Un string JSON que contiene un array con todos los invitados de la base de datos.

### Lógica a Implementar en el Backend

1.  Parsear el `FormData`.
2.  Decodificar el string `invitados_data` a un objeto Python.
3.  Crear la carpeta de destino en el Escritorio del usuario si no existe: `~/Desktop/{{año}}.{{periodo}}-invitaciones/`.
4.  Iterar sobre cada invitado en `invitados_data`:
    a.  Reemplazar las variables en `plantilla_texto` con los datos del invitado.
    b.  Crear un PDF temporal a partir de este texto (usando `reportlab` o similar).
    c.  Unir los PDFs en este orden: `plantilla_doc` (membrete) + el PDF de texto recién creado + `convocatoria` + `cronograma` (usando `PyPDF2` o similar).
    d.  Guardar el PDF final en la carpeta de destino con la nomenclatura: `{{año}}.{{periodo}}-FPiT-DOSSIER-{{Organización_1}}-{{Nombre_completo}}.pdf`.
5.  Devolver una respuesta JSON indicando el éxito y la ruta de la carpeta donde se guardaron los archivos.