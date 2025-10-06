"""
Módulo de Generación de Documentos
Genera invitaciones en PDF a partir de plantillas DOCX
"""

import os
import re
from pathlib import Path
import fitz  # PyMuPDF
from docxtpl import DocxTemplate
from docx2pdf import convert
from pypdf import PdfWriter
import pythoncom  # Para inicializar COM en Windows

# --- Rutas de Archivos ---
BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / 'assets'
TEMP_DIR = BASE_DIR / 'temp_output'

# Crear directorios si no existen
ASSETS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)


def _create_safe_filename(invitado_data, anio, periodo):
    """
    Función interna para crear un nombre de archivo seguro según la nomenclatura.
    Formato: {{año}}.{{periodo}}-FPiT-DOSSIER-{{Abreviación}}-{{Nombre}}
    """
    nombre_seguro = re.sub(r'[\\/*?:"<>|]', "", invitado_data.get('nombre_completo', ''))
    # Usar abreviación si existe, sino usar organización completa
    org_segura = invitado_data.get('abreviacion_org_1') or invitado_data.get('organizacion_1') or 'INVITADO'
    org_segura = re.sub(r'[\\/*?:"<>|]', "", org_segura)
    
    # Nomenclatura: {{año}}.{{periodo}}-FPiT-DOSSIER-{{Abreviación}}-{{Nombre}}
    return f"{anio}.{periodo}-FPiT-DOSSIER-{org_segura}-{nombre_seguro}.pdf"


def _render_template(invitado_data, context_general):
    """
    Rellena la plantilla DOCX con datos y la guarda temporalmente.
    """
    template_path = ASSETS_DIR / 'plantilla_base.docx'
    if not template_path.exists():
        raise FileNotFoundError("La plantilla 'plantilla_base.docx' no ha sido cargada.")
    
    doc = DocxTemplate(template_path)
    
    # Prepara la lista de puestos
    puestos_lista = []
    for i in range(1, 5):
        cargo = invitado_data.get(f'cargo_{i}')
        organizacion = invitado_data.get(f'organizacion_{i}')
        if cargo:
            puestos_lista.append({
                'cargo': cargo, 
                'organizacion': organizacion or ''
            })

    # Contexto completo para la plantilla
    context = {
        'nombre_completo': invitado_data.get('nombre_completo', ''),
        'cargo_1': invitado_data.get('cargo_1', ''),
        'organizacion_1': invitado_data.get('organizacion_1', ''),
        'caracter_invitacion': invitado_data.get('caracter_invitacion', ''),
        'puestos': puestos_lista,
        **context_general  # Añade todos los datos generales del evento
    }
    
    doc.render(context)
    filled_docx_path = TEMP_DIR / f"filled_{invitado_data['id']}.docx"
    doc.save(filled_docx_path)
    return filled_docx_path


def generate_full_dossier(invitado_data, context_general):
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
        convocatoria_path = ASSETS_DIR / 'convocatoria.pdf'
        cronograma_path = ASSETS_DIR / 'cronograma.pdf'

        if not all([convocatoria_path.exists(), cronograma_path.exists()]):
            raise FileNotFoundError("Faltan los archivos PDF de convocatoria y/o cronograma.")

        merger.append(str(temp_pdf_path))
        merger.append(str(convocatoria_path))
        merger.append(str(cronograma_path))
        
        # 4. Guardar en el Escritorio
        desktop_path = Path.home() / 'Desktop'
        output_folder = f"{context_general['anio']}.{context_general['periodo']}-invitaciones"
        final_dir = desktop_path / output_folder
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
