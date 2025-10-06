"""
Módulo de Generación de Documentos
Genera invitaciones en PDF a partir de plantillas DOCX
"""

import os
import re
import sys
import time
from pathlib import Path
import fitz  # PyMuPDF
from docxtpl import DocxTemplate
from docx2pdf import convert
from pypdf import PdfWriter
import pythoncom  # Para inicializar COM en Windows

# --- Rutas de Archivos ---
# Directorio de assets de solo lectura (los que vienen con la aplicación)
READ_ONLY_ASSETS_DIR = Path(__file__).parent / 'assets'

# El directorio de escritura para archivos temporales y assets del usuario se pasa como argumento.
# Esto apunta a la carpeta de datos del usuario (ej. AppData en Windows).
USER_DATA_DIR = Path(sys.argv[1])
WRITABLE_ASSETS_DIR = USER_DATA_DIR / 'assets'
TEMP_DIR = USER_DATA_DIR / 'temp_output'

# Asegurarse de que los directorios de escritura existan.
WRITABLE_ASSETS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

def get_asset_path(filename):
    """Busca un archivo primero en el directorio de assets del usuario y,
    si no lo encuentra, busca en el directorio de assets de solo lectura."""
    writable_path = WRITABLE_ASSETS_DIR / filename
    if writable_path.exists():
        return writable_path
    return READ_ONLY_ASSETS_DIR / filename


def _create_safe_filename(invitado_data, anio, periodo):
    """
    Función interna para crear un nombre de archivo seguro, truncando nombres largos.
    """
    # 1. Limpiar caracteres inválidos y truncar para evitar rutas demasiado largas
    nombre_original = invitado_data.get('nombre_completo', 'INVITADO')
    nombre_limpio = re.sub(r'[\\/*?:"<>|]', "", nombre_original)
    nombre_truncado = nombre_limpio[:50]  # Truncar a 50 caracteres

    # 2. Limpiar abreviación
    abreviacion = invitado_data.get('abreviacion_org', '')
    abrev_limpia = re.sub(r'[\\/*?:"<>|]', "", abreviacion).replace(" ", "_")

    # 3. Reemplazar espacios con guiones bajos
    nombre_final = nombre_truncado.replace(" ", "_")

    # 4. Crear nomenclatura
    if abrev_limpia:
        return f"{anio}.{periodo}-FPiT-DOSSIER-{abrev_limpia}-{nombre_final}.pdf"
    else:
        return f"{anio}.{periodo}-FPiT-DOSSIER-{nombre_final}.pdf"


def _render_template(invitado_data, context_general):
    """
    Rellena la plantilla DOCX con datos y la guarda temporalmente.
    """
    template_path = get_asset_path('plantilla_base.docx')
    if not template_path.exists():
        raise FileNotFoundError("La plantilla 'plantilla_base.docx' no se encuentra en ninguna de las ubicaciones de assets.")
    
    doc = DocxTemplate(template_path)
    
    # Obtener puesto e institución
    puesto_completo = invitado_data.get('puesto_completo', '')
    institucion = invitado_data.get('institucion', '')

    # Contexto completo para la plantilla
    context = {
        'nombre_completo': invitado_data.get('nombre_completo', ''),
        'puesto_completo': puesto_completo,
        'institucion': institucion,
        'caracter_invitacion': invitado_data.get('caracter_invitacion', ''),
        **context_general  # Añade todos los datos generales del evento
    }
    
    doc.render(context)
    filled_docx_path = TEMP_DIR / f"filled_{invitado_data['id']}.docx"
    doc.save(filled_docx_path)
    time.sleep(0.1)  # Pausa para asegurar que el archivo se libere en el sistema
    return filled_docx_path


def generate_full_dossier(invitado_data, context_general, output_dir):
    """
    Genera el dossier completo en PDF para un invitado y lo guarda en el Escritorio.
    
    Args:
        invitado_data (dict): Datos del invitado
        context_general (dict): Datos del evento (año, periodo, edicion_evento, etc.)
    
    Returns:
        dict: {"success": bool, "path": str} o {"success": bool, "error": str}
    """
    try:
        # Inicializar COM para Windows (necesario para docx2pdf)
        pythoncom.CoInitialize()
        
        # 1. Renderizar la plantilla DOCX
        filled_docx_path = _render_template(invitado_data, context_general)
        
        # 2. Convertir a PDF
        temp_pdf_path = TEMP_DIR / f"temp_{invitado_data['id']}.pdf"
        convert(str(filled_docx_path), str(temp_pdf_path))
        
        # 3. Unir los 3 PDFs (carta + convocatoria + cronograma)
        merger = PdfWriter()
        convocatoria_path = get_asset_path('convocatoria.pdf')
        cronograma_path = get_asset_path('cronograma.pdf')

        if not all([convocatoria_path.exists(), cronograma_path.exists()]):
            raise FileNotFoundError("Faltan los archivos PDF de convocatoria y/o cronograma en las ubicaciones de assets.")

        merger.append(str(temp_pdf_path))
        merger.append(str(convocatoria_path))
        merger.append(str(cronograma_path))
        
        # 4. Guardar en la carpeta de salida especificada
        final_dir = Path(output_dir)
        final_dir.mkdir(exist_ok=True)
        
        filename = _create_safe_filename(
            invitado_data, 
            context_general['anio'], 
            context_general['periodo']
        )
        final_path = final_dir / filename
        
        with open(final_path, "wb") as f_out:
            merger.write(f_out)
        merger.close()
        
        # 5. Limpieza de archivos temporales
        os.remove(filled_docx_path)
        os.remove(temp_pdf_path)
        
        return {"success": True, "path": str(final_path)}

    except Exception as e:
        print(f"Error generando dossier para ID {invitado_data.get('id')}: {e}")
        # Limpiar archivos temporales en caso de error
        try:
            for p in TEMP_DIR.glob(f"*{invitado_data.get('id')}*"):
                os.remove(p)
        except:
            pass
        return {"success": False, "error": str(e)}
    
    finally:
        # Desinicializar COM
        try:
            pythoncom.CoUninitialize()
        except:
            pass


def generate_preview_image(invitado_data, context_general):
    """
    Genera una vista previa (imagen PNG) de la primera página de la invitación.
    
    Args:
        invitado_data (dict): Datos del invitado
        context_general (dict): Datos del evento
    
    Returns:
        str: Ruta al archivo PNG generado, o None si hubo error
    """
    try:
        # 1. Renderizar la plantilla DOCX
        filled_docx_path = _render_template(invitado_data, context_general)
        
        # 2. Convertir a PDF
        temp_pdf_path = TEMP_DIR / f"preview_{invitado_data['id']}.pdf"
        convert(str(filled_docx_path), str(temp_pdf_path))
        
        # 3. Convertir la primera página del PDF a una imagen (PNG)
        doc = fitz.open(temp_pdf_path)
        page = doc.load_page(0)  # Carga la primera página
        pix = page.get_pixmap(dpi=150)  # Renderiza a una imagen con buena resolución
        
        image_path = TEMP_DIR / f"preview_{invitado_data['id']}.png"
        pix.save(image_path)
        doc.close()
        
        # 4. Limpieza (ya no necesitamos el docx y el pdf temporal)
        os.remove(filled_docx_path)
        os.remove(temp_pdf_path)
        
        return str(image_path)

    except Exception as e:
        print(f"Error generando vista previa para ID {invitado_data.get('id')}: {e}")
        # Intentar limpiar archivos temporales
        try:
            for p in TEMP_DIR.glob(f"*preview_{invitado_data.get('id')}*"):
                os.remove(p)
        except:
            pass
        return None
