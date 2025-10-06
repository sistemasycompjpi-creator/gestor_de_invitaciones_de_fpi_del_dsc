"""
Script de Migración: Simplificar Modelo de Invitados
De: cargo_1-4, organizacion_1-4 → A: cargo, organizacion

Este script migra la base de datos existente para usar un solo campo
de cargo y organización en lugar de 4 campos.
"""

import sqlite3
from pathlib import Path
import sys

# Ruta a la base de datos
if len(sys.argv) > 1:
    DB_PATH = Path(sys.argv[1])
else:
    DB_PATH = Path(__file__).parent / 'db.sqlite'

print("="*60)
print("MIGRACIÓN: Simplificar Modelo de Invitados")
print("="*60)
print(f"Base de datos: {DB_PATH}")

if not DB_PATH.exists():
    print("❌ ERROR: La base de datos no existe")
    print(f"   Ruta buscada: {DB_PATH}")
    sys.exit(1)

# Conectar a la base de datos
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    print("\n📊 Analizando estructura actual...")
    
    # Verificar si ya existe la nueva estructura
    cursor.execute("PRAGMA table_info(invitado)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'cargo' in columns:
        print("✅ La migración ya fue aplicada anteriormente")
        print("   Columnas nuevas encontradas: cargo, organizacion, abreviacion_org")
        conn.close()
        sys.exit(0)
    
    print(f"   Columnas actuales: {len(columns)}")
    print(f"   Encontradas: {', '.join(columns[:10])}...")
    
    # Contar invitados existentes
    cursor.execute("SELECT COUNT(*) FROM invitado")
    total_invitados = cursor.fetchone()[0]
    print(f"   Total de invitados: {total_invitados}")
    
    if total_invitados == 0:
        print("\n⚠️  No hay invitados en la base de datos")
        print("   Se aplicará la migración de estructura solamente")
    
    print("\n🔄 Iniciando migración...")
    
    # Paso 1: Crear tabla temporal con nueva estructura
    print("   [1/6] Creando tabla temporal...")
    cursor.execute('''
        CREATE TABLE invitado_new (
            id INTEGER PRIMARY KEY,
            nombre_completo VARCHAR(200) NOT NULL,
            caracter_invitacion VARCHAR(300) NOT NULL,
            nota TEXT,
            cargo VARCHAR(200),
            organizacion VARCHAR(200),
            abreviacion_org VARCHAR(50),
            es_asesor_t1 BOOLEAN DEFAULT 0,
            es_asesor_t2 BOOLEAN DEFAULT 0,
            puede_ser_jurado_protocolo BOOLEAN DEFAULT 0,
            puede_ser_jurado_informe BOOLEAN DEFAULT 0
        )
    ''')
    
    # Paso 2: Migrar datos (cargo_1 → cargo, organizacion_1 → organizacion)
    print("   [2/6] Migrando datos existentes...")
    cursor.execute('''
        INSERT INTO invitado_new 
        (id, nombre_completo, caracter_invitacion, nota, 
         cargo, organizacion, abreviacion_org,
         es_asesor_t1, es_asesor_t2, 
         puede_ser_jurado_protocolo, puede_ser_jurado_informe)
        SELECT 
            id, nombre_completo, caracter_invitacion, nota,
            cargo_1, organizacion_1, abreviacion_org_1,
            es_asesor_t1, es_asesor_t2,
            puede_ser_jurado_protocolo, puede_ser_jurado_informe
        FROM invitado
    ''')
    
    rows_migrated = cursor.rowcount
    print(f"      ✅ {rows_migrated} registros migrados")
    
    # Paso 3: Eliminar tabla antigua
    print("   [3/6] Eliminando tabla antigua...")
    cursor.execute('DROP TABLE invitado')
    
    # Paso 4: Renombrar tabla nueva
    print("   [4/6] Renombrando tabla nueva...")
    cursor.execute('ALTER TABLE invitado_new RENAME TO invitado')
    
    # Paso 5: Confirmar cambios
    print("   [5/6] Confirmando cambios...")
    conn.commit()
    
    # Paso 6: Verificar migración
    print("   [6/6] Verificando migración...")
    cursor.execute("PRAGMA table_info(invitado)")
    new_columns = [col[1] for col in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) FROM invitado")
    final_count = cursor.fetchone()[0]
    
    print("\n" + "="*60)
    print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
    print("="*60)
    print(f"\n📊 Resumen:")
    print(f"   • Registros migrados: {final_count}")
    print(f"   • Estructura antigua: cargo_1-4, organizacion_1-4")
    print(f"   • Estructura nueva:   cargo, organizacion, abreviacion_org")
    print(f"\n📝 Cambios aplicados:")
    print(f"   ✅ cargo_1 → cargo")
    print(f"   ✅ organizacion_1 → organizacion")
    print(f"   ✅ abreviacion_org_1 → abreviacion_org")
    print(f"   ❌ cargo_2, cargo_3, cargo_4 (eliminados)")
    print(f"   ❌ organizacion_2, organizacion_3, organizacion_4 (eliminados)")
    
    if final_count > 0:
        print(f"\n⚠️  IMPORTANTE:")
        print(f"   Los invitados existentes ahora tienen:")
        print(f"   - Cargo: el valor que tenían en 'cargo_1'")
        print(f"   - Organización: el valor que tenían en 'organizacion_1'")
        print(f"   - Los cargos 2, 3 y 4 se han descartado")
    
    print("\n🚀 Siguiente paso:")
    print("   Reinicia el backend para aplicar los cambios:")
    print("   cd backend")
    print("   python main.py")
    
except sqlite3.Error as e:
    print(f"\n❌ ERROR durante la migración: {e}")
    conn.rollback()
    print("   Los cambios han sido revertidos")
    sys.exit(1)

finally:
    conn.close()
    print("\n" + "="*60)
