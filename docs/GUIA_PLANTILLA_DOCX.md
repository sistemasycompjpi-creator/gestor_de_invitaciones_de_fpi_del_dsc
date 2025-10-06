# 📄 Guía de Variables para la Plantilla DOCX

## 🎯 Resumen del Cambio

Con la nueva estructura simplificada, ahora solo necesitas **un campo** para el puesto del invitado en lugar de varios campos separados.

---

## 📋 Variables Disponibles en la Plantilla

### ✅ Variables Actualizadas

| Variable                    | Descripción                                 | Ejemplo                                |
| --------------------------- | ------------------------------------------- | -------------------------------------- |
| `{{ nombre_completo }}`     | Nombre completo del invitado                | Dr. Juan Pérez García                  |
| `{{ puesto_completo }}`     | Puesto/cargo del invitado                   | Jefe del Departamento de Investigación |
| `{{ institucion }}`         | **NUEVO:** Institución/organización/empresa | Instituto Tecnológico de Morelia       |
| `{{ caracter_invitacion }}` | Motivo/carácter de la invitación            | Jurado de protocolo en la FPI 2025.1   |

**Nota:** La variable `{{ abreviacion_org }}` existe pero solo se usa internamente para la nomenclatura de archivos PDF, no debe incluirse en la plantilla de carta.

### ❌ Variables Eliminadas

Las siguientes variables **ya no existen** en el sistema:

- ~~`{{ cargo }}`~~ → Ahora es parte de `{{ puesto_completo }}`
- ~~`{{ cargo_1 }}`~~ → Ahora es parte de `{{ puesto_completo }}`
- ~~`{{ organizacion }}`~~ → Ahora es parte de `{{ puesto_completo }}`
- ~~`{{ organizacion_1 }}`~~ → Ahora es parte de `{{ puesto_completo }}`

**Nota:** `{{ abreviacion_org }}` sigue existiendo pero solo se usa para nomenclatura de archivos, no en la plantilla.

---

## 🔧 Cómo Actualizar tu Plantilla

### Paso 1: Abrir la Plantilla

```
📂 Ubicación: backend/assets/plantilla_base.docx
🔧 Abrir con: Microsoft Word o LibreOffice Writer
```

### Paso 2: Buscar y Reemplazar

#### Opción A: Si usabas solo el cargo

**ANTES:**

```
{{ cargo }}
{{ cargo_1 }}
```

**AHORA:**

```
{{ puesto_completo }}
```

#### Opción B: Si usabas cargo + organización

**ANTES:**

```
{{ cargo }} del {{ organizacion }}
{{ cargo_1 }} del {{ organizacion_1 }}
```

**AHORA:**

```
{{ puesto_completo }}
```

#### Opción C: Si usabas un bucle de puestos

**ANTES:**

```
{% for puesto in puestos %}
  {{ puesto.cargo }} - {{ puesto.organizacion }}
{% endfor %}
```

**AHORA:**

```
{{ puesto_completo }}
```

---

## 📝 Ejemplo de Carta de Invitación

### Plantilla DOCX Actualizada:

```
Morelia, Michoacán, {{ fecha_completa }}

{{ nombre_completo }}
{{ puesto_completo }}
{{ institucion }}
Presente

Estimado(a) {{ nombre_completo }}:

Por medio de la presente, tengo el honor de invitarle a participar como
{{ caracter_invitacion }} en nuestra Feria de Proyectos de Investigación
del Departamento de Sistemas y Computación.

El evento se llevará a cabo el {{ fecha_evento }} en {{ lugar_evento }}.

Sin más por el momento, le envío un cordial saludo.

Atentamente,

{{ jefe_departamento }}
Jefe del Departamento de Sistemas y Computación
```

### Resultado Generado:

```
Morelia, Michoacán, 15 de marzo de 2025

Dr. Juan Pérez García
Jefe del Departamento de Investigación
Instituto Tecnológico de Morelia
Presente

Estimado(a) Dr. Juan Pérez García:

Por medio de la presente, tengo el honor de invitarle a participar como
Jurado de protocolo en la FPI 2025.1 en nuestra Feria de Proyectos de
Investigación del Departamento de Sistemas y Computación.

El evento se llevará a cabo el 20 de marzo de 2025 en el Auditorio Principal.

Sin más por el momento, le envío un cordial saludo.

Atentamente,

Dr. Carlos López Méndez
Jefe del Departamento de Sistemas y Computación
```

---

## 🎨 Variables del Contexto General

Estas variables siguen disponibles y **no cambiaron**:

| Variable                  | Descripción               | Ejemplo                 |
| ------------------------- | ------------------------- | ----------------------- |
| `{{ anio }}`              | Año del evento            | 2025                    |
| `{{ periodo }}`           | Período (1 o 2)           | 1                       |
| `{{ fecha_evento }}`      | Fecha del evento          | 20 de marzo de 2025     |
| `{{ lugar_evento }}`      | Lugar del evento          | Auditorio Principal     |
| `{{ jefe_departamento }}` | Nombre del jefe de depto. | Dr. Carlos López Méndez |
| `{{ fecha_completa }}`    | Fecha de la carta         | 15 de marzo de 2025     |

---

## 🔍 Verificación

### Checklist para Actualizar la Plantilla:

- [ ] Abrir `backend/assets/plantilla_base.docx`
- [ ] Buscar todas las ocurrencias de `{{ cargo }}` o `{{ cargo_1 }}`
- [ ] Buscar todas las ocurrencias de `{{ organizacion }}` o `{{ organizacion_1 }}`
- [ ] Reemplazar con `{{ puesto_completo }}`
- [ ] Eliminar bucles `{% for puesto in puestos %}`
- [ ] Eliminar `{{ abreviacion_org }}` si existe
- [ ] Guardar la plantilla
- [ ] Probar generando una invitación

---

## ✅ Ventajas del Nuevo Sistema

### Antes (Complicado):

```
{{ cargo_1 }} del {{ organizacion_1 }}
{% if cargo_2 %}
  {{ cargo_2 }} del {{ organizacion_2 }}
{% endif %}
{% if cargo_3 %}
  {{ cargo_3 }} del {{ organizacion_3 }}
{% endif %}
```

### Ahora (Simple):

```
{{ puesto_completo }}
```

### Beneficios:

- ✅ **Más simple:** Un solo campo
- ✅ **Más flexible:** El usuario escribe exactamente lo que quiere
- ✅ **Menos errores:** No hay lógica condicional
- ✅ **Más legible:** Texto natural y completo

---

## 🧪 Ejemplo de Prueba

### Datos de Entrada (Formulario):

```
Nombre: Dr. María González Ruiz
Puesto: Directora de Investigación y Posgrado del Tecnológico Nacional de México, Campus Morelia
Carácter: Jurado de informe en la FPI 2025.1
```

### Plantilla DOCX:

```
{{ nombre_completo }}
{{ puesto_completo }}
{{ institucion }}
Presente
```

### Resultado:

```
Dr. María González Ruiz
Directora de Investigación y Posgrado
Tecnológico Nacional de México, Campus Morelia
Presente
```

---

## 🐛 Solución de Problemas

### Problema: La variable no se reemplaza

**Síntomas:** Aparece `{{ puesto_completo }}` literalmente en el PDF

**Soluciones:**

1. Verificar que la plantilla use `{{ puesto_completo }}` (con llaves dobles)
2. Verificar que no haya espacios extra: `{{puesto_completo}}` ❌, `{{ puesto_completo }}` ✅
3. Guardar la plantilla en formato `.docx` (no `.doc`)
4. Reiniciar el backend después de modificar la plantilla

### Problema: El texto aparece incompleto

**Causa:** El campo `puesto_completo` está vacío en la base de datos

**Solución:**

1. Ejecutar el script de migración: `python migrate_db_puesto_completo.py`
2. Editar el invitado y agregar el puesto completo manualmente
3. Verificar que el formulario tenga el campo requerido

---

## 📞 Soporte

Si tienes problemas al actualizar la plantilla:

1. Verifica que ejecutaste el script de migración
2. Reinicia el servidor backend
3. Prueba agregar un invitado nuevo con el puesto completo
4. Genera una invitación de prueba

---

**✅ Con estos cambios, tu sistema de invitaciones será más simple y eficiente.**

_Última actualización: 6 de octubre de 2025_
