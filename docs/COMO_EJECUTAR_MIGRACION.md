# 🚀 Guía de Migración - Sistema de Invitaciones

## 📋 Resumen de Cambios

**Estructura Antigua:**

```
cargo (separado)
organizacion (separado)
abreviacion_org
```

**Estructura Nueva:**

```
puesto_completo (texto libre completo)
abreviacion_org (mantenido para nomenclatura)
es_invitado_especial (nuevo campo)
```

---

## ⚠️ IMPORTANTE: Leer Antes de Ejecutar

1. **Backup Automático:** El script crea un respaldo automático de tu base de datos
2. **Solo Una Vez:** Ejecuta el script de migración **una sola vez**
3. **Datos:** Si tienes invitados con `cargo` y `organizacion`, se combinarán en `puesto_completo`
4. **Ejemplo:** `cargo="Director"` + `organizacion="ITM"` → `puesto_completo="Director del ITM"`

---

## 🔧 Pasos para Ejecutar la Migración

### Paso 1: Abrir Terminal en la Carpeta Backend

**Opción A - Desde VS Code:**

1. Click derecho en la carpeta `backend` en el explorador
2. Seleccionar "Open in Integrated Terminal"

**Opción B - Desde Windows:**

1. Abrir **Símbolo del sistema (CMD)**
2. Navegar a la carpeta:

```cmd
cd C:\Users\DarkK\Desktop\Invitaciones\backend
```

---

### Paso 2: Verificar que Estás en la Carpeta Correcta

Ejecuta:

```cmd
dir
```

Deberías ver estos archivos:

```
db.sqlite
main.py
document_generator.py
migrate_db_puesto_completo.py  ← Este es el script de migración
requirements.txt
```

---

### Paso 3: Ejecutar el Script de Migración

```cmd
python migrate_db_puesto_completo.py
```

---

### Paso 4: Confirmar la Migración

El script te preguntará:

```
⚠️  ADVERTENCIA:
   Este script modificará la estructura de la base de datos.
   Se creará un backup automático antes de proceder.
   Base de datos: C:\Users\DarkK\Desktop\Invitaciones\backend\db.sqlite

¿Deseas continuar con la migración? (s/n):
```

Escribe `s` y presiona **Enter**

---

## ✅ Resultado Exitoso

Si todo sale bien, verás algo como:

```
============================================================
🔄 INICIANDO MIGRACIÓN DE BASE DE DATOS
============================================================
📂 Base de datos: db.sqlite

✅ Backup creado: db.sqlite.backup_12345

📋 Estructura actual de la tabla:
   • id: INTEGER
   • nombre_completo: VARCHAR(200)
   • caracter_invitacion: VARCHAR(300)
   • nota: TEXT
   • cargo: VARCHAR(200)
   • organizacion: VARCHAR(200)
   • abreviacion_org: VARCHAR(50)
   • es_asesor_t1: BOOLEAN
   • es_asesor_t2: BOOLEAN
   • puede_ser_jurado_protocolo: BOOLEAN
   • puede_ser_jurado_informe: BOOLEAN

📊 Registros encontrados: 5

🔧 Creando nueva estructura de tabla...
📦 Migrando datos...
   ✅ Migrados 5 registros
   📝 Conversión: cargo + organizacion → puesto_completo

🔄 Reemplazando tabla antigua...

✅ Nueva estructura de tabla:
   • id
   • nombre_completo
   • caracter_invitacion
   • nota
   • puesto_completo
   • abreviacion_org
   • es_invitado_especial
   • es_asesor_t1
   • es_asesor_t2
   • puede_ser_jurado_protocolo
   • puede_ser_jurado_informe

============================================================
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
============================================================

📊 Resumen:
   • Registros antes:  5
   • Registros después: 5
   • Backup en:        db.sqlite.backup_12345

📝 Cambios aplicados:
   ✅ cargo + organizacion → puesto_completo
   ✅ abreviacion_org (mantenido)
   ✅ es_invitado_especial (agregado)

🎯 Próximos pasos:
   1. Reiniciar el servidor backend
   2. Verificar que los invitados se muestren correctamente
   3. Actualizar la plantilla DOCX (ver GUIA_PLANTILLA_DOCX.md)
   4. Si todo funciona, puedes eliminar el backup: db.sqlite.backup_12345
```

---

## 🔄 Siguientes Pasos Después de la Migración

### 1. Reiniciar el Backend

En la misma terminal:

```cmd
python main.py
```

Deberías ver:

```
 * Running on http://127.0.0.1:5000
```

Si ves errores de SQLAlchemy, detén el servidor (Ctrl+C) y vuelve a ejecutar el script de migración.

---

### 2. Reiniciar la Aplicación Electron

En otra terminal (en la carpeta raíz):

```cmd
cd C:\Users\DarkK\Desktop\Invitaciones
npm start
```

---

### 3. Verificar los Invitados

1. Abre la aplicación
2. Ve a la lista de invitados
3. Verifica que cada invitado tenga su **puesto completo**
4. Si un invitado tenía `cargo="Director"` y `organizacion="ITM"`, ahora debería mostrar `"Director del ITM"`

---

### 4. Editar Invitados (Opcional)

Si los puestos no se ven bien, puedes editarlos manualmente:

1. Click en **✏️ Editar** en cualquier invitado
2. En el campo **"Puesto Completo"**, escribe el texto completo:
   ```
   Ejemplo: Jefe del Departamento de Investigación del Instituto Tecnológico de Morelia
   ```
3. En **"Abreviación de la Institución"**, escribe la abreviación (opcional):
   ```
   Ejemplo: ITM
   ```
4. Marca ⭐ **Invitado Especial** si es VIP o autoridad
5. Guarda

---

### 5. Actualizar la Plantilla DOCX

**Ubicación:** `backend/assets/plantilla_base.docx`

1. Abre la plantilla con Microsoft Word
2. Busca estas variables:
   - `{{ cargo }}` o `{{ cargo_1 }}`
   - `{{ organizacion }}` o `{{ organizacion_1 }}`
3. Reemplázalas con:
   - `{{ puesto_completo }}`
4. Guarda la plantilla

**Ver guía completa:** [GUIA_PLANTILLA_DOCX.md](./GUIA_PLANTILLA_DOCX.md)

---

### 6. Generar Invitación de Prueba

1. Ve a la sección **"Generar Invitaciones"**
2. Selecciona un invitado
3. Completa los datos del evento
4. Click en **"Generar Invitaciones"**
5. Revisa el PDF en tu Escritorio

---

## 🐛 Solución de Problemas

### Problema: "No se encontró la base de datos"

**Solución:** Asegúrate de estar en la carpeta `backend`:

```cmd
cd C:\Users\DarkK\Desktop\Invitaciones\backend
dir
```

Deberías ver el archivo `db.sqlite`

---

### Problema: "python no se reconoce como comando"

**Solución:** Usa Python desde el entorno virtual:

```cmd
venv\Scripts\activate
python migrate_db_puesto_completo.py
```

---

### Problema: "La migración ya fue aplicada"

**Mensaje:**

```
⚠️  La migración ya fue aplicada previamente.
   La tabla ya tiene la estructura nueva.
```

**Solución:** ¡Perfecto! La migración ya está lista. Solo reinicia el backend.

---

### Problema: Error durante la migración

**Qué hace el script:**

1. Crea un backup automático
2. Si hay un error, restaura el backup
3. Tu base de datos queda intacta

**Solución:**

1. Anota el mensaje de error
2. Verifica que no tengas el backend corriendo (detenlo si está activo)
3. Intenta ejecutar de nuevo:
   ```cmd
   python migrate_db_puesto_completo.py
   ```

---

### Problema: Los invitados aparecen sin puesto

**Causa:** La migración combinó `cargo` + `organizacion`, pero ambos estaban vacíos.

**Solución:** Edita cada invitado manualmente y agrega el puesto completo.

---

## 📊 Nomenclatura de Archivos PDF

### Con Abreviación:

```
2025.1-FPiT-DOSSIER-ITM-Juan_Perez_Garcia.pdf
```

### Sin Abreviación:

```
2025.1-FPiT-DOSSIER-Juan_Perez_Garcia.pdf
```

**Ventaja:** Si llenas el campo "Abreviación" (ej: ITM, UNAM, IPN), los archivos quedan organizados por institución.

---

## ✅ Checklist Final

Después de la migración, verifica:

- [ ] Script ejecutado sin errores
- [ ] Backup creado automáticamente
- [ ] Backend reiniciado sin errores
- [ ] Aplicación Electron abierta
- [ ] Lista de invitados muestra los puestos completos
- [ ] Formulario de agregar/editar tiene el campo "Puesto Completo"
- [ ] Checkbox "Invitado Especial" funciona
- [ ] Plantilla DOCX actualizada con `{{ puesto_completo }}`
- [ ] PDF de prueba generado correctamente
- [ ] Nomenclatura de archivos correcta

---

## 🎉 ¡Migración Completa!

Si completaste todos los pasos, tu sistema ahora tiene:

✅ **Campo de texto libre** para puestos completos  
✅ **Abreviación** para nomenclatura de archivos  
✅ **Badge de Invitado Especial** 🌟  
✅ **Formularios simplificados**  
✅ **Sistema más flexible y fácil de usar**

---

## 📞 ¿Problemas?

Si encuentras algún problema que no está en esta guía:

1. Revisa que ejecutaste el script en la carpeta correcta
2. Verifica que el backend no esté corriendo durante la migración
3. Busca mensajes de error específicos
4. El backup automático te protege: `db.sqlite.backup_XXXXX`

---

**Última actualización:** 6 de octubre de 2025
