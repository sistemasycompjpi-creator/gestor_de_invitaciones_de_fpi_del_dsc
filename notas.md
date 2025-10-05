# Notas Generales

## Para las invitaciones generadas:

Las invitaciones se generarán directamente en el escritorio en:
`~/Desktop/2025.3-invitaciones/` (por ejemplo)

## Decisiones de Arquitectura

### Estructura de Carpetas

- **assets/**: Nivel raíz - contiene templates PDF, fonts, images, styles
- **docs/**: Nivel raíz - documentación del proyecto
- **output/**: Carpeta temporal local para procesamiento

### Generación de Invitaciones

- **Destino final**: `~/Desktop/{año}.{periodo}-invitaciones/`
  - {año} = año en curso.
  - {periodo} = 1 para enero–junio y 3 para agosto–diciembre.
- **Formato de carpeta**: ejemplos: `~/Desktop/2025.1-invitaciones` (enero–junio), `~/Desktop/2025.3-invitaciones` (agosto–diciembre).
- **Tecnología**: unión y manipulación de PDFs usando bibliotecas como PyPDF2, pypdf o herramientas como PDFtk.
- **Flujo**: template base + datos personalizados → renderizado a PDF → unión / postprocesado → PDF final
- **Notas**: generar la carpeta destino automáticamente usando el año actual y la regla de periodos; validar que no exista conflicto de nombres antes de escribir.

## ✅ Funcionalidades Implementadas (Octubre 2025)

### Gestor de Invitados - Frontend

1. **Formulario Completo de Registro**

   - Campo nombre completo (requerido)
   - 4 pares de cargo + organización (opcionales)
   - Checkboxes para roles de asesoría (T1, T2)
   - Caracter de la invitación
   - Cálculo automático de elegibilidad para jurados
   - Validación y feedback visual
   - Notas sobre el invitado

2. **Visualización en Cards Modernas**

   - Cards responsive con diseño atractivo
   - Badges de colores para roles (T1, T2, Protocolo, Informe)
   - Información completa de cargos y organizaciones
   - Efectos hover y animaciones

3. **Sistema de Filtros**

   - Filtros por: Todos, Asesor T1, Asesor T2, Jurado Protocolo, Jurado Informe
   - Contador dinámico de resultados
   - Actualización instantánea de la lista

4. **Gestión CRUD**

   - ✅ Agregar invitados (CREATE)
   - ✅ Ver invitados (READ)
   - ✅ Editar invitados (UPDATE)
   - ✅ Eliminar invitados con confirmación (DELETE)
   
5. **Experiencia de Usuario**
   - Sistema de notificaciones toast (éxito/error)
   - Reintentos automáticos de conexión (5 intentos)
   - Botón de recarga manual
   - Loading states y estados vacíos
   - Diseño responsive para diferentes tamaños de pantalla

### Backend Flask

1. **API REST Completa**

   - Endpoints CRUD para invitados
   - Endpoints de filtrado especializado
   - Health check endpoint
   - CORS habilitado para desarrollo

2. **Base de Datos SQLite**

   - Modelo `Invitado` con todos los campos
   - Lógica de cálculo automático de roles de jurado
   - Persistencia local en `backend/db.sqlite`

3. **Integración con Electron**
   - Auto-inicio del servidor Flask
   - Verificación de disponibilidad antes de abrir UI
   - Cierre automático al cerrar la aplicación

### Lógica de Roles de Jurado

La aplicación implementa la siguiente tabla de verdad:

| Es T1 | Es T2 | Puede Protocolo | Puede Informe |
| ----- | ----- | --------------- | ------------- |
| No    | No    | Sí              | Sí            |
| Sí    | No    | No              | Sí            |
| No    | Sí    | Sí              | No            |
| Sí    | Sí    | No              | No            |

## 🎯 Cómo Usar la Aplicación

### Iniciar

```bash
npm start
```

### Agregar Invitado

1. Completa el formulario (nombre es requerido)
2. Agrega cargos y organizaciones (opcional)
3. Marca roles de asesoría si aplica
4. Clic en "Agregar Invitado"
5. Verás notificación de éxito

### Filtrar Invitados

1. Clic en cualquier botón de filtro
2. La lista se actualiza automáticamente
3. El contador muestra resultados

### Eliminar Invitado

1. Clic en botón "🗑️ Eliminar" en la card
2. Confirma en el diálogo
3. El invitado se elimina de la BD

## Ideas Pendientes

- [ ] Sistema de templates personalizables
- [ ] Preview de invitaciones antes de generar
- [ ] Batch processing para múltiples invitaciones
- [ ] Integración con calendario para fechas de eventos
- [ ] Sistema de envío automático por email
- [ ] Editar invitados existentes
- [ ] Búsqueda por texto
- [ ] Exportar a CSV/PDF
- [ ] Importar desde Excel
- [ ] Estadísticas y gráficos

## Notas Técnicas

- Considerar usar jinja2 para templates HTML → PDF
- Implementar validación de datos antes de generar PDFs
- Backup automático de invitaciones generadas
- ✅ CORS habilitado en Flask
- ✅ Sistema de reintentos implementado
- ✅ Notificaciones toast funcionando
- ✅ Filtros en tiempo real operativos

## 🐛 Problemas Resueltos

1. ✅ Script JS no cargaba (ruta incorrecta)
2. ✅ CORS bloqueaba peticiones
3. ✅ Electron abría antes que Flask (implementado health check)
4. ✅ Sin feedback visual (agregado sistema de notificaciones)

---

_Última actualización: 4 de octubre, 2025_
