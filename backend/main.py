import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'db.sqlite')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializamos el ORM
db = SQLAlchemy(app)


class Invitado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(200), nullable=False)
    
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
    
    def to_dict(self):
        """Función para convertir el objeto Invitado a un diccionario (JSON)"""
        return {
            'id': self.id,
            'nombre_completo': self.nombre_completo,
            'cargo_1': self.cargo_1,
            'organizacion_1': self.organizacion_1,
            'cargo_2': self.cargo_2,
            'organizacion_2': self.organizacion_2,
            'cargo_3': self.cargo_3,
            'organizacion_3': self.organizacion_3,
            'cargo_4': self.cargo_4,
            'organizacion_4': self.organizacion_4,
            'es_asesor_t1': self.es_asesor_t1,
            'es_asesor_t2': self.es_asesor_t2,
            'puede_ser_jurado_protocolo': self.puede_ser_jurado_protocolo,
            'puede_ser_jurado_informe': self.puede_ser_jurado_informe
        }



@app.route('/api/invitados')
def get_invitados():

    lista_invitados = Invitado.query.all()
    return jsonify([invitado.to_dict() for invitado in lista_invitados])


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    app.run(debug=True)