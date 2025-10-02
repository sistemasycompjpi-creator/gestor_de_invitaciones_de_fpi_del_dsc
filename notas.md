# Notas Generales

## Para las invitaciones generadas:

Las invitaciones se generarán directamente en el escritorio en:
`~/Desktop/2025.Q4-invitaciones/` (por ejemplo)

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

## Ideas Pendientes

- [ ] Sistema de templates personalizables
- [ ] Preview de invitaciones antes de generar
- [ ] Batch processing para múltiples invitaciones
- [ ] Integración con calendario para fechas de eventos
- [ ] Sistema de envío automático por email

## Notas Técnicas

- Considerar usar jinja2 para templates HTML → PDF
- Implementar validación de datos antes de generar PDFs
- Backup automático de invitaciones generadas

---

_Última actualización: 2 de octubre, 2025_
