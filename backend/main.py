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
    
    # Crear carpeta de salida
    output_folder = os.path.join(
        os.path.expanduser('~'),
        'Desktop',
        f"{context_general['anio']}.{context_general['periodo']}-invitaciones"
    )
    
    # Bucle para generar una invitación por cada invitado
    for invitado in invitados:
        invitado_dict = invitado.to_dict()
        # Los campos ya están incluidos en to_dict()
        invitado_dict['puesto_completo'] = getattr(invitado, 'puesto_completo', '')
        invitado_dict['institucion'] = getattr(invitado, 'institucion', '')
        invitado_dict['abreviacion_org'] = getattr(invitado, 'abreviacion_org', '')
        
        result = generate_full_dossier(invitado_dict, context_general)
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
        'output_folder': output_folder,
        'errors': errors_list,
        'message': f"Se generaron {generated_count} de {len(invitados)} invitaciones correctamente"
    }), 200


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