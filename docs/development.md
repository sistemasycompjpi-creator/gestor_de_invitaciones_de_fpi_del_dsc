# 🔧 Guía de Desarrollo

Esta guía está destinada a desarrolladores que deseen modificar o ampliar la funcionalidad del Gestor de Invitaciones JPi.

## Arquitectura Frontend Modular

El frontend utiliza un patrón de módulos simple donde cada archivo `.js` en `frontend/js/` se encarga de una única responsabilidad. Los módulos exponen sus funciones públicas adjuntándolas al objeto `window`.

### Añadir una Nueva Funcionalidad

1.  **Crear un nuevo archivo de módulo** en `frontend/js/` (ej. `reportes.js`).
2.  **Escribir la lógica** dentro del archivo, siguiendo el patrón de módulo.
3.  **Incluir el nuevo script** en `frontend/index.html`.
4.  **Llamar a las nuevas funciones** desde otros módulos o desde la UI.

---

## Implementación de Generación de PDF

La generación de documentos PDF es gestionada por el backend. El flujo es el siguiente:

1.  **Carga de Assets**: El usuario sube una plantilla `.docx` y dos archivos `.pdf` (convocatoria, cronograma) a través del endpoint `/api/upload-assets`.
2.  **Llamada de Generación**: El frontend envía los detalles del evento al endpoint `/api/generate-all-invitations`.
3.  **Procesamiento en Backend**: El servidor utiliza un módulo Python (`document_generator.py`) para realizar las siguientes acciones por cada invitado:
    a.  Toma la plantilla `.docx`.
    b.  Reemplaza las variables (ej. `{{nombre_completo}}`) con los datos del invitado.
    c.  Convierte el `.docx` resultante a un `.pdf` temporal.
    d.  Une el PDF de la carta con los PDFs de la convocatoria y el cronograma.
    e.  Guarda el dossier final en el Escritorio del usuario.

### Plantilla de la Carta de Invitación

La lógica del backend reemplaza variables en una plantilla `.docx` para generar la carta. La plantilla utiliza la sintaxis de `python-docx-template`, que es similar a Jinja2.

#### Texto de Plantilla Recomendado

```text
{{ nombre_completo }}
{% for puesto in puestos %}{{puesto.cargo}}{% if puesto.organizacion %} - {{ puesto.organizacion }}{% endif %}
{% endfor %}

El Instituto Tecnológico de Morelia, a través del Departamento de Ingeniería en Sistemas y Computación, le extiende una cordial invitación a participar como {{ caracter_invitacion }} en la

Feria de Proyectos de Investigación Tecnológica de Pregrado de la Carrera de Ingeniería en Sistemas Computacionales

{{ edicion_evento }}

(...
[Resto del cuerpo de la carta]
...)

Morelia, Michoacán, {{ fecha_carta }}.

Atentamente,

Claudio Ernesto Florián Arenas
Jefe del Departamento de Ingeniería en Sistemas y Computación
Instituto Tecnológico de Morelia
```

#### Variables Disponibles

-   **`puestos`**: Una lista de objetos, donde cada objeto tiene las claves `cargo` y `organizacion`.
-   **Datos del Invitado (de la BD):** `{{ nombre_completo }}`, `{{ caracter_invitacion }}`.
-   **Datos del Evento (del formulario):** `{{ edicion_evento }}`, `{{ fecha_evento }}`, `{{ fecha_carta }}`.

