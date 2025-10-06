# Backend para Generación de Invitaciones

## Endpoint requerido

```
POST /api/invitaciones/generar
```

## Cambios importantes

1. **Se generan invitaciones para TODOS los invitados** registrados en la BD (no hay selector)
2. **El firmante es siempre el mismo** (hardcoded):
   - Nombre: "M. en C. Isaac Ayala Barajas"
   - Cargo: "Jefe del Departamento de Ingeniería en Sistemas Computacionales"
3. **Solo se generan invitaciones individuales** (no hay opción de compilado)
4. **Nomenclatura específica de archivos**:
   ```
   {{año}}.{{periodo}}-FPiT-DOSSIER-{{Organización_1}}-{{Nombre_completo}}
   ```
   Ejemplo: `2025.1-FPiT-DOSSIER-ABV-Eloy Hernández Hurtado.pdf`

## Datos recibidos desde el frontend

El frontend envía un `FormData` con los siguientes campos:

### Archivos PDF (multipart/form-data)

- `plantilla_doc`: PDF con el formato/membrete de carta (plantilla base)
- `convocatoria`: PDF con la convocatoria del evento
- `cronograma`: PDF con el cronograma y croquis del evento

### Configuración del periodo

- `periodo_anio`: Año (string) - Ej: "2025"
- `periodo_numero`: Periodo (string) - "1" o "3"
  - 1 = Enero-Junio
  - 3 = Agosto-Diciembre

### Datos del evento

- `edicion_evento`: Texto libre - Ej: "XVI Edición 2025.1"
- `fecha_evento`: Texto libre - Ej: "viernes 13 de junio de 2025"
- `fecha_carta`: Fecha ISO (YYYY-MM-DD) - Ej: "2025-06-01"

### Datos del firmante (hardcoded)

- `nombre_firmante`: "M. en C. Isaac Ayala Barajas"
- `cargo_firmante`: "Jefe del Departamento de Ingeniería en Sistemas Computacionales"

### Plantilla de texto

- `plantilla_texto`: String con la plantilla de la carta que incluye las variables:
  - `{{ nombre_completo }}`
  - `{{ cargo_1 }}`
  - `{{ organizacion_1 }}`
  - `{{ motivo_invitacion }}` (viene del campo `caracter_invitacion` del invitado)
  - `{{ edicion_evento }}`
  - `{{ fecha_evento }}`
  - `{{ fecha_carta }}`
  - `{{ nombre_firmante }}`
  - `{{ cargo_firmante }}`

### Datos de invitados

- `invitados_data`: JSON string con array de TODOS los invitados de la BD
  ```json
  [
    {
      "id": 1,
      "nombre_completo": "Dr. Juan Pérez",
      "caracter_invitacion": "Jurado en evento académico",
      "cargo_1": "Director",
      "organizacion_1": "Instituto Tecnológico",
      "cargo_2": "...",
      "organizacion_2": "..."
      // ... resto de campos
    }
  ]
  ```

## Proceso de generación (sugerido)

1. **Recibir y validar** todos los archivos y datos
2. **Por cada invitado de la BD**:
   a. Tomar la plantilla de texto
   b. Reemplazar todas las variables `{{ variable }}` con los datos del invitado y del evento
   c. Convertir el texto a PDF (usando reportlab, fpdf2, o similar)
   d. Sobreponer/combinar con el PDF de plantilla_doc (membrete)
   e. Concatenar el PDF de convocatoria
   f. Concatenar el PDF de cronograma
   g. **Generar nombre de archivo** según nomenclatura:
   ```
   {{año}}.{{periodo}}-FPiT-DOSSIER-{{Organización_1}}-{{Nombre_completo}}.pdf
   ```
   h. Guardar el PDF individual
3. **Guardar en**: `~/Desktop/{periodo_anio}.{periodo_numero}-invitaciones/`

## Nomenclatura de archivos

**Formato:**

```
{{año}}.{{periodo}}-FPiT-DOSSIER-{{Organización_1}}-{{Nombre_completo}}.pdf
```

**Ejemplos:**

- `2025.1-FPiT-DOSSIER-ABV-Eloy Hernández Hurtado.pdf`
- `2025.1-FPiT-DOSSIER-ITM-Dr. María López García.pdf`
- `2025.3-FPiT-DOSSIER-UNAM-Ing. Carlos Ruiz Mendoza.pdf`

**Notas:**

- `Organización_1` es el valor del campo `organizacion_1` del invitado
- `Nombre_completo` se usa tal cual está en la BD (sin sanitizar espacios ni caracteres especiales)
- Si `organizacion_1` está vacío, usar "SIN_ORG" como valor por defecto

## Ejemplo de estructura de carpeta resultante

```
/ruta/de/salida/2025.1-invitaciones/
├── 2025.1-FPiT-DOSSIER-ABV-Eloy Hernández Hurtado.pdf
├── 2025.1-FPiT-DOSSIER-ITM-Dra. María López.pdf
├── 2025.1-FPiT-DOSSIER-UNAM-Mtro. Carlos Ruiz.pdf
└── 2025.1-FPiT-DOSSIER-TEC-Dr. Ana Torres.pdf
```

## Respuesta esperada

```json
{
  "success": true,
  "folder_path": "/ruta/de/salida/2025.1-invitaciones",
  "archivos_generados": [
    "2025.1-FPiT-DOSSIER-ABV-Eloy Hernández Hurtado.pdf",
    "2025.1-FPiT-DOSSIER-ITM-Dra. María López.pdf"
  ],
  "total_invitaciones": 2
}
```

## Librerías Python recomendadas

### Para manipulación de PDFs:

- **PyPDF2** o **pypdf**: Para unir/concatenar PDFs
- **reportlab**: Para crear PDFs desde texto
- **fpdf2**: Alternativa para crear PDFs
- **pdfkit** + **wkhtmltopdf**: Para convertir HTML a PDF

### Ejemplo de estructura en Flask:

```python
from flask import request, jsonify
import json
import os
from pypdf import PdfMerger, PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

@app.route('/api/invitaciones/generar', methods=['POST'])
def generar_invitaciones():
    # 1. Extraer archivos
    plantilla_doc = request.files['plantilla_doc']
    convocatoria = request.files['convocatoria']
    cronograma = request.files['cronograma']

    # 2. Extraer datos
    periodo_anio = request.form['periodo_anio']
    periodo_numero = request.form['periodo_numero']
    edicion_evento = request.form['edicion_evento']
    fecha_evento = request.form['fecha_evento']
    fecha_carta = request.form['fecha_carta']
    plantilla_texto = request.form['plantilla_texto']

    # Firmante (siempre el mismo)
    nombre_firmante = request.form['nombre_firmante']
    cargo_firmante = request.form['cargo_firmante']

    invitados = json.loads(request.form['invitados_data'])

    # 3. Crear carpeta de destino
    desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
    folder_name = f"{periodo_anio}.{periodo_numero}-invitaciones"
    output_folder = os.path.join(desktop, folder_name)
    os.makedirs(output_folder, exist_ok=True)

    # 4. Generar invitaciones (UNA POR CADA INVITADO)
    archivos_generados = []

    for invitado in invitados:
        # Reemplazar variables en plantilla
        carta = plantilla_texto
        carta = carta.replace('{{ nombre_completo }}', invitado.get('nombre_completo', ''))
        carta = carta.replace('{{ cargo_1 }}', invitado.get('cargo_1', ''))
        carta = carta.replace('{{ organizacion_1 }}', invitado.get('organizacion_1', ''))
        carta = carta.replace('{{ motivo_invitacion }}', invitado.get('caracter_invitacion', ''))
        carta = carta.replace('{{ edicion_evento }}', edicion_evento)
        carta = carta.replace('{{ fecha_evento }}', fecha_evento)

        # Formatear fecha_carta
        from datetime import datetime
        fecha_obj = datetime.fromisoformat(fecha_carta)
        meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        fecha_formateada = f"{fecha_obj.day} de {meses[fecha_obj.month - 1]} de {fecha_obj.year}"
        carta = carta.replace('{{ fecha_carta }}', fecha_formateada)

        carta = carta.replace('{{ nombre_firmante }}', nombre_firmante)
        carta = carta.replace('{{ cargo_firmante }}', cargo_firmante)

        # Generar nombre de archivo según nomenclatura
        organizacion = invitado.get('organizacion_1', 'SIN_ORG')
        nombre_completo = invitado.get('nombre_completo', 'Sin nombre')
        nombre_archivo = f"{periodo_anio}.{periodo_numero}-FPiT-DOSSIER-{organizacion}-{nombre_completo}.pdf"

        # TODO: Convertir 'carta' (texto) a PDF y combinar con plantilla_doc
        # TODO: Añadir convocatoria y cronograma
        # TODO: Guardar PDF final con nombre_archivo

        archivos_generados.append(nombre_archivo)

    # 5. Retornar resultado
    return jsonify({
        'success': True,
        'folder_path': output_folder,
        'archivos_generados': archivos_generados,
        'total_invitaciones': len(invitados)
    })
```

## Notas importantes

1. **Formato de fecha**: El frontend envía `fecha_carta` en formato ISO (YYYY-MM-DD), el backend debe formatearla a español (ej: "13 de junio de 2025")

2. **Campo motivo_invitacion**: Este dato viene del campo `caracter_invitacion` del invitado en la base de datos

3. **Orden de páginas en PDF final**:

   - Página 1: Carta con membrete (texto de invitación + plantilla_doc)
   - Página 2+: Convocatoria (PDF completo)
   - Página N+: Cronograma y Croquis (PDF completo)

4. **Nomenclatura de archivos**:

   - Usar el formato EXACTO: `{{año}}.{{periodo}}-FPiT-DOSSIER-{{Organización_1}}-{{Nombre_completo}}.pdf`
   - NO sanitizar el nombre (mantener espacios, acentos, caracteres especiales)
   - Si `organizacion_1` está vacío, usar "SIN_ORG"

5. **Firmante**: Siempre es el mismo (hardcoded en el frontend):

   - Nombre: "M. en C. Isaac Ayala Barajas"
   - Cargo: "Jefe del Departamento de Ingeniería en Sistemas Computacionales"

6. **Todos los invitados**: El sistema genera invitaciones para TODOS los invitados registrados en la BD, no hay selector.

El frontend envía un `FormData` con los siguientes campos:

### Archivos PDF (multipart/form-data)

- `plantilla_doc`: PDF con el formato/membrete de carta (plantilla base)
- `convocatoria`: PDF con la convocatoria del evento
- `cronograma`: PDF con el cronograma y croquis del evento

### Configuración del periodo

- `periodo_anio`: Año (string) - Ej: "2025"
- `periodo_numero`: Periodo (string) - "1" o "3"
  - 1 = Enero-Junio
  - 3 = Agosto-Diciembre

### Datos del evento

- `edicion_evento`: Texto libre - Ej: "XVI Edición 2025.1"
- `fecha_evento`: Texto libre - Ej: "viernes 13 de junio de 2025"
- `fecha_carta`: Fecha ISO (YYYY-MM-DD) - Ej: "2025-06-01"

### Datos del firmante

- `nombre_firmante`: Nombre completo - Ej: "Dr. Juan Pérez García"
- `cargo_firmante`: Cargo - Ej: "Jefe del Departamento de Ingeniería en Sistemas"

### Plantilla de texto

- `plantilla_texto`: String con la plantilla de la carta que incluye las variables:
  - `{{ nombre_completo }}`
  - `{{ cargo_1 }}`
  - `{{ organizacion_1 }}`
  - `{{ motivo_invitacion }}` (viene del campo `caracter_invitacion` del invitado)
  - `{{ edicion_evento }}`
  - `{{ fecha_evento }}`
  - `{{ fecha_carta }}`
  - `{{ nombre_firmante }}`
  - `{{ cargo_firmante }}`

### Opciones de generación

- `generar_individual`: Boolean (string "true"/"false") - Si generar PDFs individuales
- `generar_compilado`: Boolean (string "true"/"false") - Si generar un PDF compilado con todos

### Datos de invitados

- `invitados_data`: JSON string con array de objetos invitado completos
  ```json
  [
    {
      "id": 1,
      "nombre_completo": "Dr. Juan Pérez",
      "caracter_invitacion": "Jurado en evento académico",
      "cargo_1": "Director",
      "organizacion_1": "Instituto Tecnológico",
      "cargo_2": "...",
      "organizacion_2": "..."
      // ... resto de campos
    }
  ]
  ```

## Proceso de generación (sugerido)

1. **Recibir y validar** todos los archivos y datos
2. **Por cada invitado**:
   a. Tomar la plantilla de texto
   b. Reemplazar todas las variables `{{ variable }}` con los datos del invitado y del evento
   c. Convertir el texto a PDF (usando reportlab, fpdf2, o similar)
   d. Sobreponer/combinar con el PDF de plantilla_doc (membrete)
   e. Concatenar el PDF de convocatoria
   f. Concatenar el PDF de cronograma
   g. Guardar el PDF final
3. **Si generar_individual**: Guardar cada invitación por separado
4. **Si generar_compilado**: Unir todos los PDFs en uno solo
5. **Guardar en**: `~/Desktop/{periodo_anio}.{periodo_numero}-invitaciones/`

## Ejemplo de estructura de carpeta resultante

```
C:/Users/DarkK/Desktop/2025.1-invitaciones/
├── invitacion_dr_juan_perez.pdf
├── invitacion_dra_maria_lopez.pdf
├── invitacion_mtro_carlos_ruiz.pdf
└── compilado_todas_invitaciones.pdf (si opt_compilado = true)
```

## Respuesta esperada

```json
{
  "success": true,
  "folder_path": "C:/Users/DarkK/Desktop/2025.1-invitaciones",
  "archivos_generados": [
    "invitacion_dr_juan_perez.pdf",
    "invitacion_dra_maria_lopez.pdf",
    "compilado_todas_invitaciones.pdf"
  ],
  "total_invitaciones": 2
}
```

## Librerías Python recomendadas

### Para manipulación de PDFs:

- **PyPDF2** o **pypdf**: Para unir/concatenar PDFs
- **reportlab**: Para crear PDFs desde texto
- **fpdf2**: Alternativa para crear PDFs
- **pdfkit** + **wkhtmltopdf**: Para convertir HTML a PDF

### Ejemplo de estructura en Flask:

```python
from flask import request, jsonify
import json
import os
from pypdf import PdfMerger, PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

@app.route('/api/invitaciones/generar', methods=['POST'])
def generar_invitaciones():
    # 1. Extraer archivos
    plantilla_doc = request.files['plantilla_doc']
    convocatoria = request.files['convocatoria']
    cronograma = request.files['cronograma']

    # 2. Extraer datos
    periodo_anio = request.form['periodo_anio']
    periodo_numero = request.form['periodo_numero']
    edicion_evento = request.form['edicion_evento']
    fecha_evento = request.form['fecha_evento']
    fecha_carta = request.form['fecha_carta']
    nombre_firmante = request.form['nombre_firmante']
    cargo_firmante = request.form['cargo_firmante']
    plantilla_texto = request.form['plantilla_texto']

    generar_individual = request.form['generar_individual'] == 'true'
    generar_compilado = request.form['generar_compilado'] == 'true'

    invitados = json.loads(request.form['invitados_data'])

    # 3. Crear carpeta de destino
    desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
    folder_name = f"{periodo_anio}.{periodo_numero}-invitaciones"
    output_folder = os.path.join(desktop, folder_name)
    os.makedirs(output_folder, exist_ok=True)

    # 4. Generar invitaciones
    archivos_generados = []
    merger_compilado = PdfMerger() if generar_compilado else None

    for invitado in invitados:
        # Reemplazar variables en plantilla
        carta = plantilla_texto
        carta = carta.replace('{{ nombre_completo }}', invitado.get('nombre_completo', ''))
        carta = carta.replace('{{ cargo_1 }}', invitado.get('cargo_1', ''))
        carta = carta.replace('{{ organizacion_1 }}', invitado.get('organizacion_1', ''))
        carta = carta.replace('{{ motivo_invitacion }}', invitado.get('caracter_invitacion', ''))
        carta = carta.replace('{{ edicion_evento }}', edicion_evento)
        carta = carta.replace('{{ fecha_evento }}', fecha_evento)

        # Formatear fecha_carta
        from datetime import datetime
        fecha_obj = datetime.fromisoformat(fecha_carta)
        fecha_formateada = fecha_obj.strftime('%d de %B de %Y')
        carta = carta.replace('{{ fecha_carta }}', fecha_formateada)

        carta = carta.replace('{{ nombre_firmante }}', nombre_firmante)
        carta = carta.replace('{{ cargo_firmante }}', cargo_firmante)

        # TODO: Convertir 'carta' (texto) a PDF y combinar con plantilla_doc
        # TODO: Añadir convocatoria y cronograma
        # TODO: Guardar PDF final

        # ... implementar lógica de generación ...

    # 5. Retornar resultado
    return jsonify({
        'success': True,
        'folder_path': output_folder,
        'archivos_generados': archivos_generados,
        'total_invitaciones': len(invitados)
    })
```

## Notas importantes

1. **Formato de fecha**: El frontend envía `fecha_carta` en formato ISO (YYYY-MM-DD), el backend debe formatearla a español (ej: "13 de junio de 2025")

2. **Campo motivo_invitacion**: Este dato viene del campo `caracter_invitacion` del invitado en la base de datos

3. **Orden de páginas en PDF final**:

   - Página 1: Carta con membrete (texto de invitación + plantilla_doc)
   - Página 2+: Convocatoria (PDF completo)
   - Página N+: Cronograma y Croquis (PDF completo)

4. **Nomenclatura de archivos**: Se recomienda usar el nombre del invitado sanitizado:

   - "Dr. Juan Pérez García" → "invitacion_dr_juan_perez_garcia.pdf"
   - Remover caracteres especiales, convertir a minúsculas, reemplazar espacios por guiones bajos

5. **Manejo de errores**: Validar que todos los archivos PDF sean válidos antes de procesarlos
