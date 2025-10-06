# 🔄 Cambio de Modelo: Simplificación de Cargos y Organizaciones

## 📋 Resumen del Cambio

**Antes:** Cada invitado podía tener hasta 4 cargos con sus respectivas organizaciones  
**Ahora:** Cada invitado tiene solo **1 cargo** y **1 organización/institución/empresa**

---

## 🎯 Razón del Cambio

Simplificar el modelo de datos para:

- ✅ Facilitar la captura de información
- ✅ Reducir complejidad en formularios
- ✅ Mejorar claridad de la información
- ✅ Agilizar el proceso de registro

---

## 📊 Cambios en la Base de Datos

### Estructura Antigua

```sql
cargo_1 VARCHAR(200)
organizacion_1 VARCHAR(200)
abreviacion_org_1 VARCHAR(50)
cargo_2 VARCHAR(200)
organizacion_2 VARCHAR(200)
cargo_3 VARCHAR(200)
organizacion_3 VARCHAR(200)
cargo_4 VARCHAR(200)
organizacion_4 VARCHAR(200)
```

### Estructura Nueva

```sql
cargo VARCHAR(200)
organizacion VARCHAR(200)
abreviacion_org VARCHAR(50)
```

### Migración de Datos Existentes

- ✅ `cargo_1` → `cargo`
- ✅ `organizacion_1` → `organizacion`
- ✅ `abreviacion_org_1` → `abreviacion_org`
- ❌ `cargo_2`, `cargo_3`, `cargo_4` (eliminados)
- ❌ `organizacion_2`, `organizacion_3`, `organizacion_4` (eliminados)

---

## 🔧 Archivos Modificados

### 1. Backend

#### `backend/main.py`

**Cambios en el modelo `Invitado`:**

```python
# ANTES
cargo_1 = db.Column(db.String(200))
organizacion_1 = db.Column(db.String(200))
abreviacion_org_1 = db.Column(db.String(50))
cargo_2 = db.Column(db.String(200))
organizacion_2 = db.Column(db.String(200))
cargo_3 = db.Column(db.String(200))
organizacion_3 = db.Column(db.String(200))
cargo_4 = db.Column(db.String(200))
organizacion_4 = db.Column(db.String(200))

# AHORA
cargo = db.Column(db.String(200))
organizacion = db.Column(db.String(200))
abreviacion_org = db.Column(db.String(50))
```

**Cambios en `to_dict()`:**

```python
# ANTES
puestos = []
for i in range(1, 5):
    cargo = getattr(self, f'cargo_{i}')
    org = getattr(self, f'organizacion_{i}')
    if cargo or org:
        puestos.append({'cargo': cargo, 'organizacion': org})
data['puestos'] = puestos

# AHORA
data['cargo'] = self.cargo
data['organizacion'] = self.organizacion
data['abreviacion_org'] = self.abreviacion_org
```

**Cambios en endpoints:**

- `POST /api/invitados`: Ahora acepta `cargo`, `organizacion`, `abreviacion_org`
- `PUT /api/invitados/<id>`: Ahora actualiza `cargo`, `organizacion`, `abreviacion_org`
- `/api/generate-all-invitations`: Actualizado para usar los nuevos campos

---

#### `backend/document_generator.py`

**Cambios en `_create_safe_filename()`:**

```python
# ANTES
org_limpia = invitado_data.get('abreviacion_org_1') or invitado_data.get('organizacion_1')

# AHORA
org_limpia = invitado_data.get('abreviacion_org') or invitado_data.get('organizacion')
```

**Cambios en `_render_template()`:**

```python
# ANTES
puestos_lista = []
for i in range(1, 5):
    cargo = invitado_data.get(f'cargo_{i}')
    organizacion = invitado_data.get(f'organizacion_{i}')
    if cargo:
        puestos_lista.append({'cargo': cargo, 'organizacion': organizacion or ''})

context = {
    'cargo_1': invitado_data.get('cargo_1', ''),
    'organizacion_1': invitado_data.get('organizacion_1', ''),
    'puestos': puestos_lista
}

# AHORA
puestos_lista = []
cargo = invitado_data.get('cargo')
organizacion = invitado_data.get('organizacion')
if cargo or organizacion:
    puestos_lista.append({'cargo': cargo or '', 'organizacion': organizacion or ''})

context = {
    'cargo': cargo or '',
    'organizacion': organizacion or '',
    'puestos': puestos_lista
}
```

---

### 2. Frontend

#### `frontend/index.html`

**Formulario simplificado:**

```html
<!-- ANTES -->
<div class="cargos-section">
  <h3>💼 Cargos y Organizaciones</h3>
  <p>Agrega hasta 4 cargos con sus respectivas organizaciones</p>

  <div class="cargo-group">
    <label for="cargo_1">Cargo 1</label>
    <input type="text" id="cargo_1" name="cargo_1" />
    <label for="organizacion_1">Organización 1</label>
    <input type="text" id="organizacion_1" name="organizacion_1" />
    <label for="abreviacion_org_1">Abreviación Org. 1</label>
    <input type="text" id="abreviacion_org_1" name="abreviacion_org_1" />
  </div>

  <!-- Cargo 2, 3, 4 similares -->
</div>

<!-- AHORA -->
<div class="cargos-section">
  <h3>💼 Cargo e Institución</h3>
  <p>
    Información del cargo y la institución/organización/empresa del invitado
  </p>

  <div class="cargo-group">
    <label for="cargo">Cargo *</label>
    <input
      type="text"
      id="cargo"
      name="cargo"
      placeholder="Ej: Director, Profesor, Investigador"
      required
    />

    <label for="organizacion">Institución | Organización | Empresa *</label>
    <input
      type="text"
      id="organizacion"
      name="organizacion"
      placeholder="Ej: Instituto Tecnológico de Morelia"
      required
    />

    <label for="abreviacion_org">Abreviación</label>
    <input
      type="text"
      id="abreviacion_org"
      name="abreviacion_org"
      placeholder="Ej: ITM"
      maxlength="20"
    />
    <small>Para nomenclatura de archivos (opcional, más corto)</small>
  </div>
</div>
```

---

#### `frontend/js/invitados-lista.js`

**Visualización simplificada:**

```javascript
// ANTES
let puestosHTML = "";
if (invitado.puestos && invitado.puestos.length > 0) {
  invitado.puestos.forEach((puesto) => {
    if (puesto.cargo && puesto.organizacion) {
      puestosHTML += `
        <div class="puesto-line">
          <span class="cargo-badge">${puesto.cargo}</span>
          <span class="organizacion">${puesto.organizacion}</span>
        </div>
      `;
    }
  });
}

// AHORA
let puestoHTML = "";
if (invitado.cargo || invitado.organizacion) {
  puestoHTML = `
    <div class="puesto-line">
      ${
        invitado.cargo
          ? `<span class="cargo-badge">${invitado.cargo}</span>`
          : ""
      }
      ${
        invitado.organizacion
          ? `<span class="organizacion">${invitado.organizacion}</span>`
          : ""
      }
    </div>
  `;
}
```

---

#### `frontend/js/invitados-form.js`

**Carga para edición simplificada:**

```javascript
// ANTES
if (invitado.puestos && invitado.puestos.length > 0) {
  invitado.puestos.forEach((puesto, index) => {
    const cargoInput = form.querySelector(`#cargo_${index + 1}`);
    const orgInput = form.querySelector(`#organizacion_${index + 1}`);
    if (cargoInput) cargoInput.value = puesto.cargo || "";
    if (orgInput) orgInput.value = puesto.organizacion || "";
  });
}

// AHORA
form.querySelector("#cargo").value = invitado.cargo || "";
form.querySelector("#organizacion").value = invitado.organizacion || "";
form.querySelector("#abreviacion_org").value = invitado.abreviacion_org || "";
```

---

## 🗄️ Script de Migración

Se ha creado `backend/migrate_db.py` para migrar bases de datos existentes.

### Uso:

```bash
cd backend
python migrate_db.py
```

### Lo que hace:

1. ✅ Crea tabla temporal con nueva estructura
2. ✅ Copia datos existentes (cargo_1 → cargo, organizacion_1 → organizacion)
3. ✅ Elimina tabla antigua
4. ✅ Renombra tabla nueva
5. ✅ Verifica integridad de datos

### Resultado:

```
============================================================
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
============================================================

📊 Resumen:
   • Registros migrados: X
   • Estructura antigua: cargo_1-4, organizacion_1-4
   • Estructura nueva:   cargo, organizacion, abreviacion_org

📝 Cambios aplicados:
   ✅ cargo_1 → cargo
   ✅ organizacion_1 → organizacion
   ✅ abreviacion_org_1 → abreviacion_org
   ❌ cargo_2, cargo_3, cargo_4 (eliminados)
   ❌ organizacion_2, organizacion_3, organizacion_4 (eliminados)
```

---

## 📄 Actualización de Plantilla DOCX

### Variables Disponibles en la Plantilla

**Antes:**

```
{{ nombre_completo }}
{{ cargo_1 }}
{{ organizacion_1 }}
{% for puesto in puestos %}
  {{ puesto.cargo }} - {{ puesto.organizacion }}
{% endfor %}
```

**Ahora:**

```
{{ nombre_completo }}
{{ cargo }}
{{ organizacion }}
{% for puesto in puestos %}
  {{ puesto.cargo }}{% if puesto.organizacion %} - {{ puesto.organizacion }}{% endif %}
{% endfor %}
```

**Nota:** La lista `puestos` ahora contiene solo **1 elemento** en lugar de hasta 4.

---

## 🚀 Pasos para Aplicar los Cambios

### 1. Respaldar Base de Datos (IMPORTANTE)

```bash
cd backend
copy db.sqlite db.sqlite.backup
```

### 2. Ejecutar Script de Migración

```bash
python migrate_db.py
```

### 3. Verificar Migración

```
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE
```

### 4. Actualizar Plantilla DOCX

- Abrir `backend/assets/plantilla_base.docx`
- Cambiar variables de `{{ cargo_1 }}` → `{{ cargo }}`
- Cambiar variables de `{{ organizacion_1 }}` → `{{ organizacion }}`
- Guardar plantilla

### 5. Reiniciar Backend

```bash
python main.py
```

### 6. Reiniciar Aplicación Electron

```bash
cd ..
npm start
```

### 7. Verificar Funcionamiento

- ✅ Agregar nuevo invitado
- ✅ Ver lista de invitados
- ✅ Editar invitado existente
- ✅ Generar invitaciones

---

## ⚠️ Consideraciones Importantes

### Pérdida de Datos

- ❌ **Los cargos 2, 3 y 4 se perderán** durante la migración
- ❌ **Las organizaciones 2, 3 y 4 se perderán** durante la migración
- ✅ Solo se preserva el **primer cargo y organización** de cada invitado

### Recomendaciones

1. **Respaldar antes de migrar** (copia de `db.sqlite`)
2. **Revisar invitados existentes** para verificar que el cargo_1 sea el principal
3. **Actualizar plantilla DOCX** para usar las nuevas variables
4. **Informar a usuarios** sobre el cambio de estructura

---

## ✅ Checklist de Migración

- [ ] Respaldo de `db.sqlite` creado
- [ ] Script de migración ejecutado exitosamente
- [ ] Backend reiniciado sin errores
- [ ] Plantilla DOCX actualizada con nuevas variables
- [ ] Aplicación Electron reiniciada
- [ ] Formulario de agregar invitado funciona correctamente
- [ ] Lista de invitados muestra correctamente cargo y organización
- [ ] Edición de invitado carga correctamente los datos
- [ ] Generación de invitaciones funciona sin errores
- [ ] PDFs generados muestran correctamente cargo y organización

---

## 🐛 Solución de Problemas

### Error: "no such column: cargo"

**Causa:** La migración no se aplicó correctamente  
**Solución:**

```bash
cd backend
python migrate_db.py
```

### Error: "NOT NULL constraint failed"

**Causa:** Campos requeridos no están marcados como requeridos en el formulario  
**Solución:** Verificar que en `index.html` los campos `cargo` y `organizacion` tengan el atributo `required`

### Invitados no muestran cargo/organización

**Causa:** Datos antiguos no migrados  
**Solución:**

1. Verificar que la migración se ejecutó: `SELECT * FROM invitado LIMIT 1;`
2. Si no hay columnas `cargo`, `organizacion`, ejecutar migración nuevamente

---

## 📊 Impacto en Funcionalidades

| Funcionalidad        | Antes                    | Ahora                            | Estado         |
| -------------------- | ------------------------ | -------------------------------- | -------------- |
| **Agregar invitado** | 4 cargos opcionales      | 1 cargo requerido                | ✅ Actualizado |
| **Editar invitado**  | Cargar 4 cargos          | Cargar 1 cargo                   | ✅ Actualizado |
| **Ver lista**        | Mostrar hasta 4 cargos   | Mostrar 1 cargo                  | ✅ Actualizado |
| **Generar PDF**      | Iterar 4 cargos          | Usar 1 cargo                     | ✅ Actualizado |
| **Nomenclatura**     | Usa abreviacion_org_1    | Usa abreviacion_org              | ✅ Actualizado |
| **API JSON**         | Devuelve array `puestos` | Devuelve `cargo`, `organizacion` | ✅ Actualizado |

---

**✅ Cambio completado y documentado**

_Fecha de implementación: 6 de octubre de 2025_
