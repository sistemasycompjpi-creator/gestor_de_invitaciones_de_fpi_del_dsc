"""
Módulo de Generación de Documentos
Genera invitaciones en PDF a partir de plantillas DOCX
"""

import os
import re
import sys
import time
import logging
from pathlib import Path
import fitz  # PyMuPDF
from docxtpl import DocxTemplate
import win32com.client  # Para conversión DOCX a PDF directa
from pypdf import PdfWriter
import pythoncom  # Para inicializar COM en Windows

# Configurar logging
logger = logging.getLogger(__name__)

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
    logger.info("   🔍 Buscando plantilla base...")
    template_path = get_asset_path('plantilla_base.docx')
    
    if not template_path.exists():
        error_msg = f"La plantilla 'plantilla_base.docx' no se encuentra. Buscado en: {template_path}"
        logger.error(f"   ❌ {error_msg}")
        raise FileNotFoundError(error_msg)
    
    logger.info(f"   ✅ Plantilla encontrada: {template_path}")
    
    logger.info("   📝 Cargando plantilla DOCX...")
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
    
    logger.info(f"   📋 Contexto de renderizado:")
    for key, value in context.items():
        logger.info(f"      {key}: {value}")
    
    logger.info("   🔄 Renderizando plantilla con datos...")
    doc.render(context)
    
    filled_docx_path = TEMP_DIR / f"filled_{invitado_data['id']}.docx"
    logger.info(f"   💾 Guardando plantilla renderizada: {filled_docx_path}")
    doc.save(filled_docx_path)
    
    time.sleep(0.1)  # Pausa para asegurar que el archivo se libere en el sistema
    logger.info(f"   ✅ Plantilla renderizada y guardada")
    return filled_docx_path


def convert_docx_to_pdf_windows(input_path, output_path):
    """
    Convierte un archivo DOCX a PDF usando la automatización COM de Word
    de forma directa y robusta, sin depender de docx2pdf.
    
    Args:
        input_path: Ruta al archivo DOCX de entrada
        output_path: Ruta donde se guardará el PDF resultante
    
    Returns:
        bool: True si la conversión fue exitosa, False en caso contrario
    """
    word = None
    try:
        # Asegura que las rutas sean absolutas
        input_path = str(Path(input_path).resolve())
        output_path = str(Path(output_path).resolve())
        
        logger.info("   🔧 Iniciando instancia de Word...")
        logger.info("   ⏱️ Intentando crear instancia COM de Word.Application...")
        
        # Crear instancia directamente sin threading (el threading causaba problemas de CoInitialize)
        word = win32com.client.DispatchEx("Word.Application")
        logger.info("   ✅ Instancia de Word creada exitosamente")
        
        word.Visible = False  # Mantenemos Word invisible
        logger.info("   ✅ Word iniciado correctamente")
        
        logger.info(f"   📂 Abriendo documento: {input_path}")
        doc = word.Documents.Open(input_path)
        
        logger.info(f"   💾 Guardando como PDF: {output_path}")
        # El formato 17 corresponde a wdFormatPDF
        doc.SaveAs(output_path, FileFormat=17)
        
        doc.Close(0)  # El 0 significa no guardar cambios al cerrar
        logger.info("   ✅ Conversión a PDF completada.")
        return True
        
    except Exception as e:
        logger.error(f"   ❌ ERROR durante la conversión a PDF: {e}")
        import traceback
        logger.error(f"   Traceback: {traceback.format_exc()}")
        return False
        
    finally:
        # Importantísimo: Asegurarse de que Word se cierre siempre
        if word:
            try:
                word.Quit()
                logger.info("   🔒 Instancia de Word cerrada.")
            except:
                logger.warning("   ⚠️ No se pudo cerrar Word limpiamente")


def generate_full_dossier(invitado_data, context_general, output_dir):
    """
    Genera el dossier completo en PDF para un invitado y lo guarda en el Escritorio.
    
    Args:
        invitado_data (dict): Datos del invitado
        context_general (dict): Datos del evento (año, periodo, edicion_evento, etc.)
        output_dir (str): Directorio de salida
    
    Returns:
        dict: {"success": bool, "path": str} o {"success": bool, "error": str}
    """
    invitado_id = invitado_data.get('id', 'UNKNOWN')
    invitado_nombre = invitado_data.get('nombre_completo', 'UNKNOWN')
    
    try:
        logger.info(f"{'='*60}")
        logger.info(f"📝 Iniciando generación de dossier para: {invitado_nombre} (ID: {invitado_id})")
        logger.info(f"📁 Directorio de salida: {output_dir}")
        
        # Inicializar COM para Windows (necesario para docx2pdf)
        logger.info("🔧 Inicializando COM para Windows...")
        pythoncom.CoInitialize()
        
        # 1. Renderizar la plantilla DOCX
        logger.info("📄 Paso 1: Renderizando plantilla DOCX...")
        filled_docx_path = _render_template(invitado_data, context_general)
        logger.info(f"✅ Plantilla renderizada: {filled_docx_path}")
        
        # 2. Convertir a PDF
        logger.info("🔄 Paso 2: Convirtiendo DOCX a PDF...")
        temp_pdf_path = TEMP_DIR / f"temp_{invitado_id}.pdf"
        logger.info(f"   Archivo temporal PDF: {temp_pdf_path}")
        
        conversion_exitosa = convert_docx_to_pdf_windows(filled_docx_path, temp_pdf_path)
        if not conversion_exitosa:
            raise Exception("La conversión de DOCX a PDF falló. Revisa el log para más detalles.")
        
        logger.info(f"✅ Conversión completada")
        
        # 3. Unir los 3 PDFs (carta + convocatoria + cronograma)
        logger.info("📑 Paso 3: Uniendo PDFs (carta + convocatoria + cronograma)...")
        merger = PdfWriter()
        convocatoria_path = get_asset_path('convocatoria.pdf')
        cronograma_path = get_asset_path('cronograma.pdf')
        
        logger.info(f"   Convocatoria: {convocatoria_path}")
        logger.info(f"   Cronograma: {cronograma_path}")

        if not convocatoria_path.exists():
            error_msg = f"Archivo de convocatoria no existe: {convocatoria_path}"
            logger.error(f"❌ {error_msg}")
            raise FileNotFoundError(error_msg)
            
        if not cronograma_path.exists():
            error_msg = f"Archivo de cronograma no existe: {cronograma_path}"
            logger.error(f"❌ {error_msg}")
            raise FileNotFoundError(error_msg)

        merger.append(str(temp_pdf_path))
        merger.append(str(convocatoria_path))
        merger.append(str(cronograma_path))
        logger.info("✅ PDFs unidos correctamente")
        
        # 4. Guardar en la carpeta de salida especificada
        logger.info("💾 Paso 4: Guardando archivo final...")
        final_dir = Path(output_dir)
        final_dir.mkdir(parents=True, exist_ok=True)
        
        filename = _create_safe_filename(
            invitado_data, 
            context_general['anio'], 
            context_general['periodo']
        )
        final_path = final_dir / filename
        
        logger.info(f"   Nombre del archivo: {filename}")
        logger.info(f"   Ruta completa: {final_path}")
        
        with open(final_path, "wb") as f_out:
            merger.write(f_out)
        merger.close()
        logger.info(f"✅ Archivo guardado exitosamente")
        
        # 5. Limpieza de archivos temporales
        logger.info("🧹 Paso 5: Limpiando archivos temporales...")
        os.remove(filled_docx_path)
        os.remove(temp_pdf_path)
        logger.info("✅ Limpieza completada")
        
        logger.info(f"✅✅✅ DOSSIER COMPLETADO PARA: {invitado_nombre}")
        logger.info(f"{'='*60}\n")
        
        return {"success": True, "path": str(final_path)}

    except Exception as e:
        logger.error(f"❌ ERROR GENERANDO DOSSIER PARA: {invitado_nombre} (ID: {invitado_id})")
        logger.error(f"   Tipo de error: {type(e).__name__}")
        logger.error(f"   Mensaje: {str(e)}")
        
        # Log del traceback completo
        import traceback
        logger.error(f"   Traceback completo:")
        for line in traceback.format_exc().split('\n'):
            if line.strip():
                logger.error(f"   {line}")
        
        # Limpiar archivos temporales en caso de error
        logger.info("🧹 Limpiando archivos temporales después del error...")
        try:
            for p in TEMP_DIR.glob(f"*{invitado_id}*"):
                os.remove(p)
                logger.info(f"   Eliminado: {p}")
        except Exception as cleanup_error:
            logger.warning(f"   No se pudo limpiar algunos archivos temporales: {cleanup_error}")
        
        logger.info(f"{'='*60}\n")
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
        
        conversion_exitosa = convert_docx_to_pdf_windows(filled_docx_path, temp_pdf_path)
        if not conversion_exitosa:
            # Si la conversión falla, no podemos generar la imagen
            logger.error("No se pudo generar la vista previa: conversión a PDF falló")
            return None
        
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
