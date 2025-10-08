"""
Script de diagnóstico para verificar si Word funciona con COM automation
Ejecutar en la computadora donde falla la conversión
"""

import sys
import win32com.client

print("=" * 60)
print("DIAGNÓSTICO DE WORD COM AUTOMATION")
print("=" * 60)
print()

print("1. Intentando crear instancia de Word con Dispatch...")
try:
    word = win32com.client.Dispatch("Word.Application")
    print("   ✅ SUCCESS: Dispatch funcionó")
    word.Visible = True
    print("   ✅ Word visible activado")
    print("   ℹ️ ¿Puedes ver la ventana de Word? (debe estar abierta)")
    input("   Presiona ENTER después de verificar...")
    word.Quit()
    print("   ✅ Word cerrado correctamente")
except Exception as e:
    print(f"   ❌ ERROR con Dispatch: {e}")
    print()

print()
print("2. Intentando crear instancia de Word con DispatchEx...")
try:
    word = win32com.client.DispatchEx("Word.Application")
    print("   ✅ SUCCESS: DispatchEx funcionó")
    word.Visible = True
    print("   ✅ Word visible activado")
    print("   ℹ️ ¿Puedes ver la ventana de Word? (debe estar abierta)")
    input("   Presiona ENTER después de verificar...")
    word.Quit()
    print("   ✅ Word cerrado correctamente")
except Exception as e:
    print(f"   ❌ ERROR con DispatchEx: {e}")
    print()

print()
print("3. Verificando versión de Word instalada...")
try:
    word = win32com.client.Dispatch("Word.Application")
    version = word.Version
    print(f"   ✅ Versión de Word: {version}")
    word.Quit()
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print()
print("4. Probando abrir un documento nuevo...")
try:
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = True
    doc = word.Documents.Add()
    print("   ✅ Documento nuevo creado")
    print("   ℹ️ ¿Puedes ver un documento en blanco en Word?")
    input("   Presiona ENTER después de verificar...")
    doc.Close(False)
    word.Quit()
    print("   ✅ Documento cerrado correctamente")
except Exception as e:
    print(f"   ❌ ERROR: {e}")

print()
print("=" * 60)
print("DIAGNÓSTICO COMPLETADO")
print("=" * 60)
print()
print("Si viste errores arriba, las posibles causas son:")
print("  - Word no está instalado")
print("  - Word no está activado (requiere licencia)")
print("  - Word está bloqueado por política de grupo")
print("  - Permisos insuficientes")
print("  - Office necesita reparación")
print()
input("Presiona ENTER para salir...")
