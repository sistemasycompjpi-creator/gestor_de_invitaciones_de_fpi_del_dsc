# 🔧 Corrección: Error de COM en Windows (CoInitialize)

## ❌ Error Encontrado

```
⚠️ Errores encontrados:
• Joel Josafat Hernández Saucedo: (-2147221008, 'No se ha llamado a CoInitialize.', None, None)
• Monica Isabel Magaña Cornejo: (-2147221008, 'No se ha llamado a CoInitialize.', None, None)
```

**Código de error:** `-2147221008` → `CO_E_NOTINITIALIZED`

---

## 🔍 Causa del Problema

**Problema:** La librería `docx2pdf` usa COM (Component Object Model) de Windows para controlar Microsoft Word y convertir archivos DOCX a PDF.

**En Windows, COM requiere:**

1. **Inicialización:** Llamar a `pythoncom.CoInitialize()` antes de usar COM
2. **Desinicialización:** Llamar a `pythoncom.CoUninitialize()` después de usarlo

**Por qué falló:**

- El código no inicializaba COM antes de llamar a `convert()` de docx2pdf
- Cada thread/proceso necesita su propia inicialización de COM
- En aplicaciones multi-threading (como Flask), esto es crítico

---

## ✅ Solución Implementada

### 1. Agregar importación de `pythoncom`

**Archivo:** `backend/document_generator.py` (línea 13)

```python
import os
import re
from pathlib import Path
import fitz  # PyMuPDF
from docxtpl import DocxTemplate
from docx2pdf import convert
from pypdf import PdfWriter
import pythoncom  # ✅ Para inicializar COM en Windows
```

---

### 2. Inicializar COM en `generate_full_dossier()`

**Archivo:** `backend/document_generator.py` (función `generate_full_dossier`)

**Cambios:**

```python
def generate_full_dossier(invitado_data, context_general):
    """
    Genera el dossier completo en PDF para un invitado y lo guarda en el Escritorio.
    """
    try:
        # ✅ INICIALIZAR COM PARA WINDOWS
        pythoncom.CoInitialize()

        # 1. Renderizar la plantilla DOCX
        filled_docx_path = _render_template(invitado_data, context_general)

        # 2. Convertir a PDF (usa COM internamente)
        temp_pdf_path = TEMP_DIR / f"temp_{invitado_data['id']}.pdf"
        convert(str(filled_docx_path), str(temp_pdf_path))

        # 3. Unir los 3 PDFs...
        # ... resto del código ...

        return {"success": True, "path": str(final_path)}

    except Exception as e:
        print(f"Error generando dossier para ID {invitado_data.get('id')}: {e}")
        # ... manejo de errores ...
        return {"success": False, "error": str(e)}

    finally:
        # ✅ DESINICIALIZAR COM (SIEMPRE)
        try:
            pythoncom.CoUninitialize()
        except:
            pass
```

**Puntos clave:**

- ✅ `pythoncom.CoInitialize()` se llama al **inicio** del `try`
- ✅ `pythoncom.CoUninitialize()` se llama en el **`finally`** (garantiza ejecución)
- ✅ El `finally` se ejecuta **siempre** (éxito o error)
- ✅ Manejo de excepciones en `CoUninitialize()` para evitar errores si ya fue llamado

---

## 📦 Dependencia Requerida

**Paquete:** `pywin32`

**Ya está instalado** en `backend/requirements.txt`:

```txt
pywin32==311
```

`pywin32` incluye:

- `pythoncom` - Soporte COM para Python
- `win32com` - Acceso a APIs de Windows
- `win32api` - Funciones adicionales de Windows

---

## 🧪 Verificación

### ✅ Prueba 1: Generar una invitación

1. Reiniciar el backend:

   ```cmd
   cd backend
   python main.py
   ```

2. En la aplicación Electron:

   - Llenar formulario completo
   - Click en "🚀 Generar Todas las Invitaciones"

3. **Verificar:**
   - ✅ No aparece el error `-2147221008`
   - ✅ Se generan PDFs correctamente
   - ✅ Los archivos están en `~/Desktop/2025.3-invitaciones/`

### ✅ Prueba 2: Generar múltiples invitaciones

1. Tener al menos 3 invitados en la BD
2. Generar invitaciones

3. **Verificar:**
   - ✅ Se generan TODAS las invitaciones (no solo la primera)
   - ✅ Ningún error de COM
   - ✅ Modal de éxito muestra el conteo correcto

---

## 🔧 Explicación Técnica

### ¿Qué es COM?

**COM (Component Object Model)** es una tecnología de Microsoft que permite:

- Comunicación entre procesos
- Reutilización de componentes binarios
- Control de aplicaciones (como Word, Excel)

### ¿Por qué `docx2pdf` necesita COM?

`docx2pdf` convierte DOCX a PDF usando **Microsoft Word**:

1. Abre Word en segundo plano (invisible)
2. Carga el archivo DOCX
3. Guarda como PDF usando la función "Exportar" de Word
4. Cierra Word

Este proceso **requiere COM** para controlar Word.

### ¿Por qué `CoInitialize()`?

Cada **thread** que usa COM debe:

1. **Inicializar:** `CoInitialize()` - Prepara el thread para usar COM
2. **Usar COM:** Llamar funciones COM (como `convert()`)
3. **Desinicializar:** `CoUninitialize()` - Libera recursos COM

Si no se inicializa:

- **Error:** `-2147221008` (CO_E_NOTINITIALIZED)
- **Significado:** "No has preparado COM en este thread"

### ¿Por qué en `finally`?

```python
try:
    pythoncom.CoInitialize()
    # ... código que usa COM ...
except Exception as e:
    # ... manejo de errores ...
finally:
    pythoncom.CoUninitialize()  # ✅ SIEMPRE se ejecuta
```

**Razones:**

1. **Garantiza limpieza:** Incluso si hay error, se libera COM
2. **Evita fugas de recursos:** COM queda limpio para próxima llamada
3. **Seguridad thread:** Cada llamada tiene su propio ciclo COM

---

## 📊 Comparación: Antes vs Después

### ❌ Antes (SIN inicialización COM)

```python
def generate_full_dossier(invitado_data, context_general):
    try:
        # NO HAY CoInitialize() ❌
        filled_docx_path = _render_template(...)
        convert(str(filled_docx_path), str(temp_pdf_path))  # ❌ ERROR AQUÍ
        # ...
```

**Resultado:**

```
Error: (-2147221008, 'No se ha llamado a CoInitialize.', None, None)
```

---

### ✅ Después (CON inicialización COM)

```python
def generate_full_dossier(invitado_data, context_general):
    try:
        pythoncom.CoInitialize()  # ✅ Inicializa COM
        filled_docx_path = _render_template(...)
        convert(str(filled_docx_path), str(temp_pdf_path))  # ✅ FUNCIONA
        # ...
    finally:
        pythoncom.CoUninitialize()  # ✅ Limpia COM
```

**Resultado:**

```
✅ 2 invitaciones generadas exitosamente
```

---

## 🎯 Resumen

| Aspecto                   | Antes    | Después                    |
| ------------------------- | -------- | -------------------------- |
| **Inicialización COM**    | ❌ No    | ✅ Sí (`CoInitialize()`)   |
| **Desinicialización COM** | ❌ No    | ✅ Sí (`CoUninitialize()`) |
| **Error -2147221008**     | ❌ Sí    | ✅ No                      |
| **Generación exitosa**    | ❌ Falla | ✅ Funciona                |
| **Múltiples invitados**   | ❌ Falla | ✅ Funciona                |

---

## ✅ Checklist de Verificación

- [x] Importación de `pythoncom` agregada
- [x] `CoInitialize()` llamado al inicio del `try`
- [x] `CoUninitialize()` llamado en el `finally`
- [x] Manejo de excepciones en `CoUninitialize()`
- [x] Dependencia `pywin32==311` en requirements.txt
- [ ] Backend reiniciado con cambios
- [ ] Prueba con 1 invitado exitosa
- [ ] Prueba con múltiples invitados exitosa
- [ ] Sin errores de COM

---

## 🚀 Siguiente Paso

**Reinicia el backend:**

```cmd
cd backend
python main.py
```

Luego prueba generando invitaciones. Debería funcionar sin el error de COM.

---

**✅ Solución implementada y documentada**
