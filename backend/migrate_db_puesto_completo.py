"""
Script de Migración: De campos separados a puesto_completo

Este script migra la base de datos de la estructura antigua:
  - cargo, organizacion → puesto_completo
  - Mantiene abreviacion_org
  - Agrega campo es_invitado_especial

IMPORTANTE: Ejecutar este script SOLO UNA VEZ
"""

import sqlite3
import sys
import os
from pathlib import Path

def migrate_database(db_path='db.sqlite'):
    """
    Migra la base de datos a la nueva estructura con puesto_completo
    """
    # Verificar que el archivo existe
    if not os.path.exists(db_path):
        print(f"❌ ERROR: No se encontró la base de datos en: {db_path}")
        print(f"   Ubicación actual: {os.getcwd()}")
        return False
    
    print("=" * 60)
    print("🔄 INICIANDO MIGRACIÓN DE BASE DE DATOS")
    print("=" * 60)
    print(f"📂 Base de datos: {db_path}")
    print()
    
    # Crear backup
    backup_path = f"{db_path}.backup_{os.getpid()}"
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ Backup creado: {backup_path}")
    except Exception as e:
        print(f"❌ Error al crear backup: {e}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Verificar estructura actual
        cursor.execute("PRAGMA table_info(invitado)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        
        print("\n📋 Estructura actual de la tabla:")
        for col, tipo in columns.items():
            print(f"   • {col}: {tipo}")
        
        # Verificar si ya se aplicó la migración
        if 'puesto_completo' in columns and 'cargo' not in columns:
            print("\n⚠️  La migración ya fue aplicada previamente.")
            print("   La tabla ya tiene la estructura nueva.")
            conn.close()
            return True
        
        if 'puesto_completo' in columns:
            print("\n⚠️  La columna 'puesto_completo' ya existe.")
            print("   Puede que la migración esté parcialmente aplicada.")
            respuesta = input("   ¿Continuar de todas formas? (s/n): ")
            if respuesta.lower() != 's':
                conn.close()
                return False
        
        # 2. Contar registros
        cursor.execute("SELECT COUNT(*) FROM invitado")
        total_registros = cursor.fetchone()[0]
        print(f"\n📊 Registros encontrados: {total_registros}")
        
        if total_registros == 0:
            print("\n⚠️  No hay registros para migrar. Actualizando solo la estructura...")
        
        # 3. Crear tabla temporal con nueva estructura
        print("\n🔧 Creando nueva estructura de tabla...")
        cursor.execute("""
            CREATE TABLE invitado_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_completo VARCHAR(200) NOT NULL,
                caracter_invitacion VARCHAR(300) NOT NULL,
                nota TEXT,
                puesto_completo TEXT,
                abreviacion_org VARCHAR(50),
                es_invitado_especial BOOLEAN DEFAULT 0,
                es_asesor_t1 BOOLEAN DEFAULT 0,
                es_asesor_t2 BOOLEAN DEFAULT 0,
                puede_ser_jurado_protocolo BOOLEAN DEFAULT 0,
                puede_ser_jurado_informe BOOLEAN DEFAULT 0
            )
        """)
        
        # 4. Migrar datos si existen
        if total_registros > 0:
            print("📦 Migrando datos...")
            
            # Determinar qué columnas existen
            tiene_cargo = 'cargo' in columns
            tiene_organizacion = 'organizacion' in columns
            tiene_abreviacion = 'abreviacion_org' in columns
            
            # Construir la consulta SELECT según las columnas disponibles
            if tiene_cargo and tiene_organizacion:
                # Caso 1: Existen cargo y organizacion separados
                cursor.execute("""
                    SELECT 
                        id, nombre_completo, caracter_invitacion, nota,
                        cargo, organizacion,
                        {} as abreviacion_org,
                        es_asesor_t1, es_asesor_t2,
                        puede_ser_jurado_protocolo, puede_ser_jurado_informe
                    FROM invitado
                """.format('abreviacion_org' if tiene_abreviacion else 'NULL'))
                
                registros = cursor.fetchall()
                
                for registro in registros:
                    (id_inv, nombre, caracter, nota, 
                     cargo, organizacion, abreviacion,
                     asesor_t1, asesor_t2, jurado_proto, jurado_inf) = registro
                    
                    # Crear puesto_completo combinando cargo y organizacion
                    puesto_completo = ""
                    if cargo and organizacion:
                        puesto_completo = f"{cargo} del {organizacion}"
                    elif cargo:
                        puesto_completo = cargo
                    elif organizacion:
                        puesto_completo = organizacion
                    
                    cursor.execute("""
                        INSERT INTO invitado_new 
                        (id, nombre_completo, caracter_invitacion, nota, 
                         puesto_completo, abreviacion_org, es_invitado_especial,
                         es_asesor_t1, es_asesor_t2, 
                         puede_ser_jurado_protocolo, puede_ser_jurado_informe)
                        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
                    """, (id_inv, nombre, caracter, nota, 
                          puesto_completo, abreviacion,
                          asesor_t1, asesor_t2, jurado_proto, jurado_inf))
                
                print(f"   ✅ Migrados {len(registros)} registros")
                print(f"   📝 Conversión: cargo + organizacion → puesto_completo")
            
            else:
                # Caso 2: Estructura antigua con cargo_1, cargo_2, etc.
                tiene_cargo_1 = 'cargo_1' in columns
                tiene_org_1 = 'organizacion_1' in columns
                tiene_abrev_1 = 'abreviacion_org_1' in columns
                
                if tiene_cargo_1 or tiene_org_1:
                    print("   📝 Detectada estructura antigua (cargo_1, cargo_2, cargo_3, cargo_4)")
                    
                    cursor.execute("""
                        SELECT 
                            id, nombre_completo, caracter_invitacion, nota,
                            {} as cargo_1,
                            {} as organizacion_1,
                            {} as abreviacion_org_1,
                            es_asesor_t1, es_asesor_t2,
                            puede_ser_jurado_protocolo, puede_ser_jurado_informe
                        FROM invitado
                    """.format(
                        'cargo_1' if tiene_cargo_1 else 'NULL',
                        'organizacion_1' if tiene_org_1 else 'NULL',
                        'abreviacion_org_1' if tiene_abrev_1 else 'NULL'
                    ))
                    
                    registros = cursor.fetchall()
                    
                    for registro in registros:
                        (id_inv, nombre, caracter, nota,
                         cargo_1, org_1, abrev_1,
                         asesor_t1, asesor_t2, jurado_proto, jurado_inf) = registro
                        
                        # Crear puesto_completo desde cargo_1 y organizacion_1
                        puesto_completo = ""
                        if cargo_1 and org_1:
                            puesto_completo = f"{cargo_1} del {org_1}"
                        elif cargo_1:
                            puesto_completo = cargo_1
                        elif org_1:
                            puesto_completo = org_1
                        
                        cursor.execute("""
                            INSERT INTO invitado_new 
                            (id, nombre_completo, caracter_invitacion, nota, 
                             puesto_completo, abreviacion_org, es_invitado_especial,
                             es_asesor_t1, es_asesor_t2, 
                             puede_ser_jurado_protocolo, puede_ser_jurado_informe)
                            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
                        """, (id_inv, nombre, caracter, nota,
                              puesto_completo, abrev_1,
                              asesor_t1, asesor_t2, jurado_proto, jurado_inf))
                    
                    print(f"   ✅ Migrados {len(registros)} registros")
                    print(f"   📝 Conversión: cargo_1 + organizacion_1 → puesto_completo")
                else:
                    print("   ⚠️  No se encontraron columnas de cargo/organizacion para migrar")
        
        # 5. Eliminar tabla antigua y renombrar
        print("🔄 Reemplazando tabla antigua...")
        cursor.execute("DROP TABLE invitado")
        cursor.execute("ALTER TABLE invitado_new RENAME TO invitado")
        
        # 6. Verificar migración
        cursor.execute("SELECT COUNT(*) FROM invitado")
        nuevos_registros = cursor.fetchone()[0]
        
        cursor.execute("PRAGMA table_info(invitado)")
        nuevas_columnas = [row[1] for row in cursor.fetchall()]
        
        print("\n✅ Nueva estructura de tabla:")
        for col in nuevas_columnas:
            print(f"   • {col}")
        
        # Confirmar cambios
        conn.commit()
        
        print("\n" + "=" * 60)
        print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        print(f"\n📊 Resumen:")
        print(f"   • Registros antes:  {total_registros}")
        print(f"   • Registros después: {nuevos_registros}")
        print(f"   • Backup en:        {backup_path}")
        
        print(f"\n📝 Cambios aplicados:")
        print(f"   ✅ cargo + organizacion → puesto_completo")
        print(f"   ✅ abreviacion_org (mantenido)")
        print(f"   ✅ es_invitado_especial (agregado)")
        
        print(f"\n🎯 Próximos pasos:")
        print(f"   1. Reiniciar el servidor backend")
        print(f"   2. Verificar que los invitados se muestren correctamente")
        print(f"   3. Actualizar la plantilla DOCX (ver GUIA_PLANTILLA_DOCX.md)")
        print(f"   4. Si todo funciona, puedes eliminar el backup: {backup_path}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR durante la migración: {e}")
        print(f"   Revirtiendo cambios...")
        conn.rollback()
        
        # Restaurar backup
        try:
            conn.close()
            import shutil
            shutil.copy2(backup_path, db_path)
            print(f"   ✅ Base de datos restaurada desde backup")
        except Exception as e2:
            print(f"   ❌ Error al restaurar backup: {e2}")
        
        return False
    
    finally:
        conn.close()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  SCRIPT DE MIGRACIÓN: PUESTO COMPLETO + INVITADO ESPECIAL")
    print("=" * 60)
    
    # Permitir especificar ruta de DB como argumento
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    else:
        db_path = 'db.sqlite'
    
    print(f"\n⚠️  ADVERTENCIA:")
    print(f"   Este script modificará la estructura de la base de datos.")
    print(f"   Se creará un backup automático antes de proceder.")
    print(f"   Base de datos: {os.path.abspath(db_path)}")
    
    respuesta = input(f"\n¿Deseas continuar con la migración? (s/n): ")
    
    if respuesta.lower() == 's':
        exito = migrate_database(db_path)
        if exito:
            print("\n✅ Migración exitosa. ¡El sistema está listo!")
            sys.exit(0)
        else:
            print("\n❌ La migración falló. Revisa los errores arriba.")
            sys.exit(1)
    else:
        print("\n❌ Migración cancelada por el usuario.")
        sys.exit(1)
