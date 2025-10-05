import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'db.sqlite')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializamos el ORM
db = SQLAlchemy(app)
# Habilitar CORS para permitir peticiones desde el frontend servido por file:// o distinto origen
CORS(app)


class Invitado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(200), nullable=False)
    caracter_invitacion = db.Column(db.String(300), nullable=False)  # Motivo de la invitación
    nota = db.Column(db.Text)  # Notas opcionales del usuario
    
    cargo_1 = db.Column(db.String(200))
    organizacion_1 = db.Column(db.String(200))
    cargo_2 = db.Column(db.String(200))
    organizacion_2 = db.Column(db.String(200))
    cargo_3 = db.Column(db.String(200))
    organizacion_3 = db.Column(db.String(200))
    cargo_4 = db.Column(db.String(200))
    organizacion_4 = db.Column(db.String(200))
 
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
        }

        # Construir lista de puestos sólo con campos presentes
        puestos = []
        for i in range(1, 5):
            cargo = getattr(self, f'cargo_{i}')
            org = getattr(self, f'organizacion_{i}')
            if cargo or org:
                puestos.append({'cargo': cargo, 'organizacion': org})

        if puestos:
            data['puestos'] = puestos

        # Flags de asesor
        data['es_asesor_t1'] = self.es_asesor_t1
        data['es_asesor_t2'] = self.es_asesor_t2

        # Asegurarse de que los flags de jurado estén actualizados según asesores
        # (no persistimos aquí, sólo reflejamos la lógica)
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
        cargo_1=data.get('cargo_1'),
        organizacion_1=data.get('organizacion_1'),
        cargo_2=data.get('cargo_2'),
        organizacion_2=data.get('organizacion_2'),
        cargo_3=data.get('cargo_3'),
        organizacion_3=data.get('organizacion_3'),
        cargo_4=data.get('cargo_4'),
        organizacion_4=data.get('organizacion_4'),
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

    for i in range(1, 5):
        if f'cargo_{i}' in data:
            setattr(invitado, f'cargo_{i}', data.get(f'cargo_{i}'))
        if f'organizacion_{i}' in data:
            setattr(invitado, f'organizacion_{i}', data.get(f'organizacion_{i}'))

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



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    app.run(debug=True)