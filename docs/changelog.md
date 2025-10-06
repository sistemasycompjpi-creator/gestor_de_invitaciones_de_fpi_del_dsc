# 📝 Registro de Cambios Recientes

Este documento resume las últimas correcciones y mejoras aplicadas al sistema de generación de invitaciones.

---

## ✅ Cambios Aplicados

1.  **Renderizado de Múltiples Puestos**: La plantilla ahora utiliza un bucle para mostrar correctamente todos los cargos y organizaciones de un invitado, cada uno en su propia línea.

2.  **Formato Automático de Fecha**: El backend ahora convierte la fecha de la carta (ej. `2025-10-28`) a un formato de texto largo en español (ej. `28 de octubre de 2025`).

3.  **Abreviación de Organización**: 
    -   Se añadió un campo "Abreviación" en el formulario de invitados.
    -   Esta abreviación (ej. `ITM`) se utiliza ahora para generar nombres de archivo más cortos y limpios (ej. `2025.1-FPiT-DOSSIER-ITM-Dr. Juan Pérez.pdf`).

4.  **Eliminación de Vista Previa**: La funcionalidad de vista previa en imagen fue eliminada del frontend para simplificar la interfaz y el flujo de trabajo.

---

## 📋 Resumen de Correcciones en el Código

-   **Backend (`main.py`)**: 
    -   Se añadió una función para formatear fechas.
    -   Se actualizó el modelo de la base de datos y las rutas CRUD para incluir el campo `abreviacion_org_1`.

-   **Backend (`document_generator.py`)**:
    -   Se actualizó la función de creación de nombres de archivo para que use la nueva abreviatura de la organización.

-   **Frontend (`index.html` y `invitaciones.js`)**:
    -   Se añadió el campo de abreviación al formulario.
    -   Se eliminó toda la lógica y los elementos de la interfaz relacionados con la vista previa de imágenes.

---

## 🧪 Cómo Probar los Últimos Cambios

1.  **¡MUY IMPORTANTE! Borra la base de datos anterior**, ya que la estructura de la tabla de invitados ha cambiado:
    ```cmd
    del backend\db.sqlite
    ```

2.  **Reinicia el backend** para que se cree la nueva base de datos.

3.  **Agrega un invitado de prueba**, asegurándote de llenar el nuevo campo **"Abreviación Org. 1"** (ej. `ITM`).

4.  **Genera las invitaciones** y verifica que el nombre del archivo PDF utilice la abreviatura y que la fecha en la carta aparezca en formato de texto largo.
