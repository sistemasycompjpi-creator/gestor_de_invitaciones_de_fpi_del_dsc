import pandas as pd
import io
import os
import sys
from pathlib import Path
import logging
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from datetime import datetime
from document_generator import (
    generate_full_dossier,
    generate_preview_image
)

import shutil

# --- CONFIGURACIÓN DE RUTAS Y BASE DE DATOS CON LOGGING ---
# Directorio de assets de solo lectura (los que vienen con la aplicación)
READ_ONLY_ASSETS_DIR = Path(__file__).parent / 'assets'
# Recibimos la ruta segura para datos desde Electron.
# Si no se pasa (modo dev), usamos el directorio del script actual.
if len(sys.argv) > 1:
    USER_DATA_PATH = Path(sys.argv[1])
else:
    USER_DATA_PATH = Path(os.path.abspath(os.path.dirname(__file__)))

# Configuramos el archivo de log en esa misma carpeta segura
LOG_FILE_PATH = USER_DATA_PATH / 'debug.log'
logging.basicConfig(
    filename=str(LOG_FILE_PATH),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.info("==================================")
logging.info("INICIANDO SERVIDOR FLASK...")
logging.info(f"Ruta de datos de usuario recibida: {USER_DATA_PATH}")

# Directorio de assets (plantillas, etc.) en la carpeta de datos del usuario
ASSETS_DIR = USER_DATA_PATH / 'assets'
ASSETS_DIR.mkdir(exist_ok=True)
logging.info(f"Directorio de assets para escritura: {ASSETS_DIR}")
DB_PATH = USER_DATA_PATH / 'db.sqlite'
logging.info(f"Ruta completa de la base de datos: {DB_PATH}")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + str(DB_PATH)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
# Habilitar CORS para permitir peticiones desde el frontend servido por file:// o distinto origen
CORS(app)

def ensure_assets_exist():
    """Asegura que los assets por defecto existan en la carpeta de datos del usuario,
    copiándolos desde la carpeta de solo lectura si es necesario."""
    default_files = ['plantilla_base.docx', 'convocatoria.pdf', 'cronograma.pdf']
    for filename in default_files:
        writable_path = ASSETS_DIR / filename
        if not writable_path.exists():
            read_only_path = READ_ONLY_ASSETS_DIR / filename
            if read_only_path.exists():
                logging.info(f"Copiando asset por defecto '{filename}' a la carpeta de datos del usuario.")
                shutil.copy(read_only_path, writable_path)
            else:
                logging.warning(f"El asset por defecto '{filename}' no se encontró en la carpeta de solo lectura.")



def format_fecha_carta(fecha_str):
    """Convierte fecha YYYY-MM-DD a formato 'DD de mes de YYYY' en español."""
    try:
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
        meses = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        return f"{fecha.day} de {meses[fecha.month]} de {fecha.year}"
    except:
        return fecha_str


class Invitado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(200), nullable=False)
    caracter_invitacion = db.Column(db.String(300), nullable=False)  # Motivo de la invitación
    nota = db.Column(db.Text)  # Notas opcionales del usuario
    
    # Puesto e institución (separados para mejor estructura en documentos)
    puesto_completo = db.Column(db.String(300))  # Ej: "Jefe del Departamento de Investigación"
    institucion = db.Column(db.String(300))  # Ej: "Instituto Tecnológico de Morelia"
    
    # Abreviación de la institución (para nomenclatura de archivos)
    abreviacion_org = db.Column(db.String(50))  # Ej: "ITM", "UNAM", "IPN"
    
    # Campo para marcar invitados especiales (VIP, autoridades, etc.)
    es_invitado_especial = db.Column(db.Boolean, default=False)
 
    es_asesor_t1 = db.Column(db.Boolean, default=False)
    es_asesor_t2 = db.Column(db.Boolean, default=False)

    puede_ser_jurado_protocolo = db.Column(db.Boolean, default=False)
    puede_ser_jurado_informe = db.Column(db.Boolean, default=False)
    
    def compute_jurado_flags(self):
        """Determina si el invitado puede ser jurado de protocolo/informe
        según la tabla de verdad provista:

        A = es_asesor_t1, B = es_asesor_t2

        A0B0 -> protocolo=True, informe=True
        A1B0 -> protocolo=False, informe=True
        A0B1 -> protocolo=True, informe=False
        A1B1 -> protocolo=False, informe=False
        """
        A = bool(self.es_asesor_t1)
        B = bool(self.es_asesor_t2)

        if not A and not B:
            self.puede_ser_jurado_protocolo = True
            self.puede_ser_jurado_informe = True
        elif A and not B:
            self.puede_ser_jurado_protocolo = False
            self.puede_ser_jurado_informe = True
        elif not A and B:
            self.puede_ser_jurado_protocolo = True
            self.puede_ser_jurado_informe = False
        else:  # A and B
            self.puede_ser_jurado_protocolo = False
            self.puede_ser_jurado_informe = False
    
    def to_dict(self):
        """Función para convertir el objeto Invitado a un diccionario (JSON)"""
        data = {
            'id': self.id,
            'nombre_completo': self.nombre_completo,
            'caracter_invitacion': self.caracter_invitacion,
            'nota': self.nota,
            'puesto_completo': self.puesto_completo,
            'institucion': self.institucion,
            'abreviacion_org': self.abreviacion_org,
            'es_invitado_especial': self.es_invitado_especial,
            'es_asesor_t1': self.es_asesor_t1,
            'es_asesor_t2': self.es_asesor_t2,
        }

        # Asegurarse de que los flags de jurado estén actualizados según asesores
        self.compute_jurado_flags()

        data['puede_ser_jurado_protocolo'] = self.puede_ser_jurado_protocolo
        data['puede_ser_jurado_informe'] = self.puede_ser_jurado_informe

        return data


### Rutas del CRUD ###

# Health check - verifica que el backend esté funcionando
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Backend Flask está funcionando correctamente',
        'database': 'connected'
    })

# Obtener todos los invitados
@app.route('/api/invitados')
def get_invitados():

    lista_invitados = Invitado.query.all()
    return jsonify([invitado.to_dict() for invitado in lista_invitados])

# Obtener un invitado por ID
@app.route('/api/invitados/<int:id>')
def get_invitado(id):
    invitado = Invitado.query.get_or_404(id)
    return jsonify(invitado.to_dict())

# Crear un nuevo invitado
@app.route('/api/invitados', methods=['POST'])
def create_invitado():
    from flask import request

    data = request.get_json() or {}
    nombre = data.get('nombre_completo')
    caracter = data.get('caracter_invitacion')
    
    if not nombre:
        return jsonify({'error': 'nombre_completo es requerido'}), 400
    if not caracter:
        return jsonify({'error': 'caracter_invitacion es requerido'}), 400

    invitado = Invitado(
        nombre_completo=nombre,
        caracter_invitacion=caracter,
        nota=data.get('nota'),
        puesto_completo=data.get('puesto_completo'),
        institucion=data.get('institucion'),
        abreviacion_org=data.get('abreviacion_org'),
        es_invitado_especial=bool(data.get('es_invitado_especial', False)),
        es_asesor_t1=bool(data.get('es_asesor_t1', False)),
        es_asesor_t2=bool(data.get('es_asesor_t2', False)),
    )

    # Calcular flags de jurado según asesores antes de persistir
    invitado.compute_jurado_flags()

    db.session.add(invitado)
    db.session.commit()

    return jsonify(invitado.to_dict()), 201


# Actualizar un invitado existente
@app.route('/api/invitados/<int:id>', methods=['PUT'])
def update_invitado(id):
    from flask import request

    invitado = Invitado.query.get_or_404(id)
    data = request.get_json() or {}

    # Actualizar campos si están presentes
    if 'nombre_completo' in data:
        invitado.nombre_completo = data.get('nombre_completo')
    if 'caracter_invitacion' in data:
        invitado.caracter_invitacion = data.get('caracter_invitacion')
    if 'nota' in data:
        invitado.nota = data.get('nota')
    
    if 'puesto_completo' in data:
        invitado.puesto_completo = data.get('puesto_completo')
    if 'institucion' in data:
        invitado.institucion = data.get('institucion')
    if 'abreviacion_org' in data:
        invitado.abreviacion_org = data.get('abreviacion_org')
    if 'es_invitado_especial' in data:
        invitado.es_invitado_especial = bool(data.get('es_invitado_especial'))

    if 'es_asesor_t1' in data:
        invitado.es_asesor_t1 = bool(data.get('es_asesor_t1'))
    if 'es_asesor_t2' in data:
        invitado.es_asesor_t2 = bool(data.get('es_asesor_t2'))

    # Recalcular jurado
    invitado.compute_jurado_flags()

    db.session.commit()
    return jsonify(invitado.to_dict())


# Eliminar un invitado
@app.route('/api/invitados/<int:id>', methods=['DELETE'])
def delete_invitado(id):
    invitado = Invitado.query.get_or_404(id)
    db.session.delete(invitado)
    db.session.commit()
    return jsonify({'result': 'deleted'})

#Obtener asesores de T1
@app.route('/api/invitados/asesores_t1')
def get_asesores_t1():
    asesores = Invitado.query.filter_by(es_asesor_t1=True).all()
    return jsonify([invitado.to_dict() for invitado in asesores])

#Obtener asesores de T2
@app.route('/api/invitados/asesores_t2')
def get_asesores_t2():
    asesores = Invitado.query.filter_by(es_asesor_t2=True).all()
    return jsonify([invitado.to_dict() for invitado in asesores])

#Obtener invitados que pueden ser jurados de protocolo
@app.route('/api/invitados/jurados_protocolo')
def get_jurados_protocolo():
    jurados = Invitado.query.filter_by(puede_ser_jurado_protocolo=True).all()
    return jsonify([invitado.to_dict() for invitado in jurados])

#Obtener invitados que pueden ser jurados de informe 
@app.route('/api/invitados/jurados_informe')
def get_jurados_informe():
    jurados = Invitado.query.filter_by(puede_ser_jurado_informe=True).all()
    return jsonify([invitado.to_dict() for invitado in jurados])


# ========== RUTAS PARA GENERACIÓN DE INVITACIONES ==========

@app.route('/api/upload-files', methods=['POST'])
def upload_files():
    """Recibe y guarda los 3 archivos base (plantilla DOCX, convocatoria PDF, cronograma PDF)."""
    try:
        # Los nombres deben coincidir con los del FormData en el frontend
        template_file = request.files.get('plantilla_docx')
        convocatoria_file = request.files.get('convocatoria_pdf')
        cronograma_file = request.files.get('cronograma_pdf')

        if not template_file or not convocatoria_file or not cronograma_file:
            return jsonify({
                'success': False,
                'error': 'Faltan archivos. Se requieren los 3 archivos (plantilla DOCX, convocatoria PDF, cronograma PDF).'
            }), 400

        # Guardar archivos en el directorio de assets del usuario
        template_filename = secure_filename('plantilla_base.docx')
        template_file.save(ASSETS_DIR / template_filename)
        
        convocatoria_filename = secure_filename('convocatoria.pdf')
        convocatoria_file.save(ASSETS_DIR / convocatoria_filename)
        
        cronograma_filename = secure_filename('cronograma.pdf')
        cronograma_file.save(ASSETS_DIR / cronograma_filename)
            
        return jsonify({
            'success': True,
            'message': 'Archivos cargados correctamente',
            'files': {
                'plantilla_docx': template_filename,
                'convocatoria_pdf': convocatoria_filename,
                'cronograma_pdf': cronograma_filename
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/generate-all-invitations', methods=['POST'])
def generate_all_invitations():
    """Genera las invitaciones para TODOS los invitados en la base de datos."""
    data = request.get_json()
    
    context_general = {
        "anio": data.get("anio"),
        "periodo": data.get("periodo"),
        "edicion_evento": data.get("edicion_evento"),
        "fecha_evento": data.get("fecha_evento"),
        "fecha_carta": format_fecha_carta(data.get("fecha_carta")),  # Formatear fecha
        "nombre_firmante": "Claudio Ernesto Florián Arenas",
        "cargo_firmante": "Jefe del Departamento de Ingeniería en Sistemas y Computación"
    }
    
    # Validar que todos los campos estén presentes
    if not all(context_general.values()):
        return jsonify({
            'success': False,
            'error': 'Faltan datos del evento'
        }), 400

    # Obtener todos los invitados
    invitados = Invitado.query.all()
    if not invitados:
        return jsonify({
            'success': False,
            'error': 'No hay invitados en la base de datos para generar invitaciones'
        }), 404
        
    generated_count = 0
    errors_list = []
    
    output_dir = data.get("output_dir")
    if not output_dir:
        return jsonify({
            'success': False,
            'error': 'No se ha especificado un directorio de salida'
        }), 400

    # Bucle para generar una invitación por cada invitado
    for invitado in invitados:
        invitado_dict = invitado.to_dict()
        # Los campos ya están incluidos en to_dict()
        invitado_dict['puesto_completo'] = getattr(invitado, 'puesto_completo', '')
        invitado_dict['institucion'] = getattr(invitado, 'institucion', '')
        invitado_dict['abreviacion_org'] = getattr(invitado, 'abreviacion_org', '')
        
        result = generate_full_dossier(invitado_dict, context_general, output_dir)
        if result["success"]:
            generated_count += 1
        else:
            errors_list.append({
                'invitado': invitado.nombre_completo,
                'error': result['error']
            })

    return jsonify({
        'success': True,
        'generated_count': generated_count,
        'count': generated_count,
        'total': len(invitados),
        'output_folder': output_dir,
        'errors': errors_list,
        'message': f"Se generaron {generated_count} de {len(invitados)} invitaciones correctamente"
    }), 200


@app.route('/api/generate-single-invitation/<int:invitado_id>', methods=['POST'])
def generate_single_invitation(invitado_id):
    """Genera la invitación para un solo invitado específico."""
    data = request.get_json()
    
    context_general = {
        "anio": data.get("anio"),
        "periodo": data.get("periodo"),
        "edicion_evento": data.get("edicion_evento"),
        "fecha_evento": data.get("fecha_evento"),
        "fecha_carta": format_fecha_carta(data.get("fecha_carta")),
        "nombre_firmante": "Claudio Ernesto Florián Arenas",
        "cargo_firmante": "Jefe del Departamento de Ingeniería en Sistemas y Computación"
    }
    
    if not all(context_general.values()):
        return jsonify({'success': False, 'error': 'Faltan datos del evento'}), 400

    output_dir = data.get("output_dir")
    if not output_dir:
        return jsonify({'success': False, 'error': 'No se ha especificado un directorio de salida'}), 400

    invitado = Invitado.query.get(invitado_id)
    if not invitado:
        return jsonify({'success': False, 'error': 'Invitado no encontrado'}), 404
        
    invitado_dict = invitado.to_dict()
    invitado_dict['puesto_completo'] = getattr(invitado, 'puesto_completo', '')
    invitado_dict['institucion'] = getattr(invitado, 'institucion', '')
    invitado_dict['abreviacion_org'] = getattr(invitado, 'abreviacion_org', '')
    
    result = generate_full_dossier(invitado_dict, context_general, output_dir)
    
    if result["success"]:
        return jsonify({
            'success': True,
            'message': f"Se generó la invitación para {invitado.nombre_completo} correctamente.",
            'output_folder': output_dir,
            'file_path': result.get('file_path')
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': result['error'],
            'invitado': invitado.nombre_completo
        }), 500


@app.route('/api/preview-invitation/<int:invitado_id>', methods=['POST'])
def preview_invitation(invitado_id):
    """Genera una imagen de vista previa para un invitado específico."""
    data = request.get_json()
    
    context_general = {
        "anio": data.get("anio"),
        "periodo": data.get("periodo"),
        "edicion_evento": data.get("edicion_evento"),
        "fecha_evento": data.get("fecha_evento"),
        "fecha_carta": format_fecha_carta(data.get("fecha_carta")),  # Formatear fecha
        "nombre_firmante": "Claudio Ernesto Florián Arenas",
        "cargo_firmante": "Jefe del Departamento de Ingeniería en Sistemas y Computación"
    }
    
    if not all(context_general.values()):
        return jsonify({'error': 'Faltan datos del evento para generar la vista previa'}), 400

    invitado = Invitado.query.get(invitado_id)
    if not invitado:
        return jsonify({'error': 'Invitado no encontrado'}), 404

    # Convertir a diccionario y agregar todos los campos
    invitado_dict = invitado.to_dict()
    invitado_dict['cargo'] = getattr(invitado, 'cargo', '')
    invitado_dict['organizacion'] = getattr(invitado, 'organizacion', '')

    image_path = generate_preview_image(invitado_dict, context_general)
    
    if image_path:
        # Devuelve el archivo de imagen directamente
        return send_file(image_path, mimetype='image/png')
    else:
        return jsonify({'error': 'No se pudo generar la vista previa'}), 500


### Rutas para Importación y Exportación ###

# Mapeo de nombres de columna internos a cabeceras amigables para el usuario
USER_FRIENDLY_HEADERS = {
    'nombre_completo': 'Nombre Completo del Invitado',
    'caracter_invitacion': 'Carácter de la Invitación',
    'nota': 'Nota Adicional (Opcional)',
    'puesto_completo': 'Puesto o Cargo Completo',
    'institucion': 'Institución / Organización',
    'abreviacion_org': 'Abreviación de Institución',
    'es_invitado_especial': '¿Es Invitado Especial? (1=Sí, 0=No)',
    'es_asesor_t1': '¿Es Asesor de Taller 1? (1=Sí, 0=No)',
    'es_asesor_t2': '¿Es Asesor de Taller 2? (1=Sí, 0=No)',
    'puede_ser_jurado_protocolo': 'Jurado de Protocolo (Automático)',
    'puede_ser_jurado_informe': 'Jurado de Informe (Automático)'
}

# Mapeo inverso para la importación (de amigable a interno)
INTERNAL_HEADERS = {v.lower(): k for k, v in USER_FRIENDLY_HEADERS.items()}


@app.route('/api/invitados/plantilla', methods=['GET'])
def descargar_plantilla():
    """Genera y sirve una plantilla de Excel con instrucciones para la importación."""
    try:
        # Hoja 1: La plantilla a llenar
        template_df = pd.DataFrame(columns=[h for h in USER_FRIENDLY_HEADERS.values() if 'Automático' not in h])

        # Hoja 2: Las instrucciones
        instructions_data = {
            'Campo': list(USER_FRIENDLY_HEADERS.values()),
            'Descripción': [
                'Nombre completo del invitado, incluyendo título (Ej: Dr. Juan Pérez García). Requerido.',
                'Motivo de la invitación (Ej: Jurado en evento académico, Ponente magistral). Requerido.',
                'Cualquier nota o comentario relevante sobre el invitado.',
                'Puesto completo del invitado (Ej: Jefe del Departamento de Investigación).',
                'Nombre completo de la institución, organización o empresa a la que pertenece.',
                'Abreviación corta para la nomenclatura de archivos (Ej: ITM, UNAM, UMSNH).',
                'Marcar con 1 si el invitado es una autoridad o VIP. Dejar en 0 o vacío si no.',
                'Marcar con 1 si el invitado es Asesor de Taller de Investigación 1. Dejar en 0 o vacío si no.',
                'Marcar con 1 si el invitado es Asesor de Taller de Investigación 2. Dejar en 0 o vacío si no.',
                'Este campo se calcula automáticamente al guardar. No es necesario llenarlo.',
                'Este campo se calcula automáticamente al guardar. No es necesario llenarlo.'
            ]
        }
        instructions_df = pd.DataFrame(instructions_data)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            template_df.to_excel(writer, index=False, sheet_name='Plantilla de Invitados')
            instructions_df.to_excel(writer, index=False, sheet_name='Instrucciones')
        output.seek(0)
        
        logging.info("Se ha generado y enviado la plantilla de Excel mejorada para invitados.")
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='plantilla_invitados_con_instrucciones.xlsx'
        )
    except Exception as e:
        logging.error(f"Error al generar la plantilla de Excel: {e}", exc_info=True)
        return jsonify({'error': f'No se pudo generar la plantilla: {e}'}), 500


@app.route('/api/invitados/exportar', methods=['GET'])
def exportar_invitados():
    """Exporta todos los invitados a un archivo Excel o CSV con cabeceras amigables."""
    formato = request.args.get('formato', 'excel').lower()
    
    try:
        invitados = Invitado.query.all()
        if not invitados:
            return jsonify({'error': 'No hay invitados para exportar'}), 404

        datos_invitados = [invitado.to_dict() for invitado in invitados]
        df = pd.DataFrame(datos_invitados)

        # Convertir booleanos a 1/0 para mayor claridad en el archivo exportado
        for col in ['es_invitado_especial', 'es_asesor_t1', 'es_asesor_t2', 'puede_ser_jurado_protocolo', 'puede_ser_jurado_informe']:
            if col in df.columns:
                df[col] = df[col].astype(int)

        # Renombrar columnas a formato amigable
        df.rename(columns=USER_FRIENDLY_HEADERS, inplace=True)
        
        # Asegurar el orden de las columnas en la exportación
        ordered_columns = [h for h in USER_FRIENDLY_HEADERS.values() if h in df.columns]
        df = df[ordered_columns]

        output = io.BytesIO()
        
        if formato == 'excel':
            df.to_excel(output, index=False, sheet_name='Invitados Exportados')
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = 'exportacion_invitados.xlsx'
        elif formato == 'csv':
            df.to_csv(output, index=False, encoding='utf-8-sig') # utf-8-sig para mejor compatibilidad con Excel
            mimetype = 'text/csv'
            filename = 'exportacion_invitados.csv'
        else:
            return jsonify({'error': 'Formato no soportado. Use \'excel\' o \'csv\'.'}), 400

        output.seek(0)
        logging.info(f"Se han exportado {len(invitados)} invitados a formato {formato}.")

        return send_file(output, mimetype=mimetype, as_attachment=True, download_name=filename)

    except Exception as e:
        logging.error(f"Error al exportar invitados: {e}", exc_info=True)
        return jsonify({'error': f'No se pudo completar la exportación: {e}'}), 500


@app.route('/api/invitados/importar', methods=['POST'])
def importar_invitados():
    """Importa invitados desde un archivo Excel o CSV usando cabeceras amigables."""
    if 'file' not in request.files:
        return jsonify({'error': 'No se encontró ningún archivo en la solicitud'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400

    try:
        filename = secure_filename(file.filename)
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(file, engine='openpyxl')
        elif filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            return jsonify({'error': 'Formato de archivo no soportado. Use .xlsx, .xls o .csv'}), 400

        # Normalizar cabeceras del archivo (a minúsculas, sin espacios extra)
        df.rename(columns={col: col.strip().lower() for col in df.columns}, inplace=True)
        # Mapear cabeceras amigables a nombres de columna internos
        df.rename(columns=INTERNAL_HEADERS, inplace=True)

        def to_bool(value):
            if pd.isna(value):
                return False
            return str(value).lower() in ['1', 'true', 't', 'y', 'yes', 'si', 'verdadero']

        nuevos_invitados = []
        for index, row in df.iterrows():
            if pd.isna(row.get('nombre_completo')) or pd.isna(row.get('caracter_invitacion')):
                logging.warning(f"Omitiendo fila {index+2} por falta de datos requeridos.")
                continue

            invitado = Invitado(
                nombre_completo=row.get('nombre_completo'),
                caracter_invitacion=row.get('caracter_invitacion'),
                nota=row.get('nota') if pd.notna(row.get('nota')) else None,
                puesto_completo=row.get('puesto_completo') if pd.notna(row.get('puesto_completo')) else None,
                institucion=row.get('institucion') if pd.notna(row.get('institucion')) else None,
                abreviacion_org=row.get('abreviacion_org') if pd.notna(row.get('abreviacion_org')) else None,
                es_invitado_especial=to_bool(row.get('es_invitado_especial')),
                es_asesor_t1=to_bool(row.get('es_asesor_t1')),
                es_asesor_t2=to_bool(row.get('es_asesor_t2')),
            )
            invitado.compute_jurado_flags()
            nuevos_invitados.append(invitado)

        if nuevos_invitados:
            db.session.add_all(nuevos_invitados)
            db.session.commit()
            logging.info(f"Se han importado {len(nuevos_invitados)} nuevos invitados.")
        
        return jsonify({'message': f'Importación completada. Se agregaron {len(nuevos_invitados)} invitados.'}), 201

    except Exception as e:
        logging.error(f"Error durante la importación de archivo: {e}", exc_info=True)
        return jsonify({'error': f'Ocurrió un error al procesar el archivo: {e}'}), 500


if __name__ == '__main__':
    try:
        with app.app_context():
            logging.info("Contexto de la aplicación creado.")
            if not DB_PATH.exists():
                logging.warning("La base de datos NO existe. Se creará ahora.")
            else:
                logging.info("La base de datos ya existe.")
            
            # Esta línea crea el archivo .sqlite y las tablas si no existen
            db.create_all()
            logging.info("db.create_all() ejecutado correctamente.")

            # Asegurarse de que los assets por defecto estén en su lugar
            ensure_assets_exist()

    except Exception as e:
        logging.error(f"!!! ERROR DURANTE LA INICIALIZACIÓN DE LA BD: {e}", exc_info=True)

    logging.info("Iniciando app.run()... El servidor está listo.")
    app.run(debug=True)