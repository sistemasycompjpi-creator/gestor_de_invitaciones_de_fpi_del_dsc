# 📖 Guía de Uso

Esta guía describe cómo utilizar el Gestor de Invitaciones JPi para administrar invitados y generar la documentación necesaria para el evento.

## 🚀 Primeros Pasos

La aplicación está diseñada para ser intuitiva. La navegación principal se encuentra en la barra superior, permitiendo cambiar entre las siguientes secciones:

-   **Lista de Invitados**: Ver y filtrar todos los invitados registrados.
-   **Agregar Invitado**: Crear un nuevo registro de invitado.
-   **Generar Invitaciones**: Crear los dossieres en PDF.
-   **Estadísticas**: Ver un resumen de los roles de los invitados.
-   **Importar/Exportar**: Gestionar datos de forma masiva.

## 👥 Gestión de Invitados

La gestión de invitados es el núcleo de la aplicación.

### Agregar o Editar un Invitado

1.  Navega a la sección **"➕ Agregar Invitado"**.
2.  Completa los campos del formulario. Los campos marcados con `*` son obligatorios.
    -   **Puesto e Institución**: Ingresa el cargo completo (`Jefe del Departamento de Sistemas`) y la institución (`Instituto Tecnológico de Morelia`) en sus respectivos campos.
    -   **Abreviación**: Proporciona una abreviatura (ej. `ITM`) para generar nombres de archivo más cortos.
    -   **Invitado Especial**: Marca esta casilla si el invitado es una autoridad o una figura destacada.
    -   **Roles de Asesoría**: Selecciona si el invitado es asesor de Taller 1 o Taller 2. Los roles de jurado se calcularán automáticamente.
3.  Haz clic en **"✅ Guardar Invitado"**.

Para editar, simplemente haz clic en el botón **"✏️ Editar"** de un invitado en la lista, y el formulario se llenará con sus datos.

### Filtrar Invitados

En la sección **"👥 Lista de Invitados"**, puedes usar los botones de filtro para encontrar rápidamente a los invitados según su rol (Asesor T1, Jurado de Protocolo, etc.).

## 📄 Generación de Invitaciones

Esta sección te permite crear los dossieres completos en formato PDF para los invitados.

El flujo de trabajo consta de 4 pasos principales:

1.  **Paso 1: Cargar Archivos Base**
    -   Selecciona los tres documentos requeridos:
        -   Una **plantilla de carta en formato `.docx`** que contenga variables (ej. `{{ nombre_completo }}`).
        -   El **PDF de la convocatoria** del evento.
        -   El **PDF del cronograma y croquis**.
    -   Haz clic en **"⬆️ Cargar Archivos al Servidor"**. El sistema confirmará la carga exitosa.

2.  **Paso 2: Configurar el Periodo**
    -   Define el año y el periodo académico del evento (ej. `2025`, `1` para Enero-Junio).

3.  **Paso 3: Información del Evento**
    -   Completa los detalles que se insertarán en la plantilla, como el mes y año del evento y la fecha de la carta.

4.  **Paso 4: Generar los Documentos**
    -   **Modo de Generación**: Elige si deseas generar un dossier para **todos** los invitados o solo para **uno** en específico.
    -   **Carpeta de Destino**: Haz clic en **"Seleccionar Carpeta"** para elegir dónde se guardarán los archivos PDF generados en tu computadora.
    -   Haz clic en **"🚀 Generar Invitación(es)"**. El sistema procesará la solicitud y guardará los archivos en la ubicación seleccionada.

## 🔄 Importar y Exportar Datos

Esta sección facilita la gestión de datos en volumen.

### Exportar

-   Haz clic en **"📗 Exportar a Excel"** o **"📘 Exportar a CSV"** para descargar la lista completa de invitados registrados.

### Importar

1.  Primero, descarga la plantilla haciendo clic en **"📄 Descargar Plantilla con Instrucciones"**. Este archivo Excel contiene las columnas necesarias y una hoja con explicaciones para cada campo.
2.  Llena la plantilla con los datos de los invitados que deseas agregar.
3.  Selecciona el archivo completado usando el botón de selección de archivo.
4.  Haz clic en **"🚀 Importar Archivo"** para agregar los nuevos registros a la base de datos.