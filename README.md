# 🎓 Gestor de Invitaciones JPi

Aplicación de escritorio desarrollada con **Electron** y **Flask** para gestionar invitados a eventos de la Jornada de Proyectos de Investigación (JPi).

## 📋 Características

### ✨ Funcionalidades Principales

- **Agregar Invitados**: Formulario completo con:

  - Nombre completo
  - Hasta 4 cargos con sus respectivas organizaciones
  - Roles de asesoría (T1 y T2)
  - Cálculo automático de elegibilidad para jurados (Protocolo e Informe)

- **Visualización de Invitados**: Tarjetas (cards) con:

  - Nombre e ID
  - Badges de roles visuales (Asesor T1/T2, Jurado Protocolo/Informe)
  - Lista de cargos y organizaciones
  - Botón para eliminar

- **Filtros Inteligentes**:

  - 📋 Todos los invitados
  - 👨‍🏫 Asesores T1
  - 👩‍🏫 Asesores T2
  - 📝 Jurados de Protocolo
  - 📄 Jurados de Informe

- **Funcionalidad de Eliminación**: Con confirmación de seguridad

- **Sistema de Notificaciones**: Feedback visual para acciones exitosas o errores

### 🧮 Lógica de Roles de Jurado

Los roles de jurado se calculan automáticamente según las siguientes reglas:

| Es Asesor T1 | Es Asesor T2 | Jurado Protocolo | Jurado Informe |
| ------------ | ------------ | ---------------- | -------------- |
| ❌ No        | ❌ No        | ✅ Sí            | ✅ Sí          |
| ✅ Sí        | ❌ No        | ❌ No            | ✅ Sí          |
| ❌ No        | ✅ Sí        | ✅ Sí            | ❌ No          |
| ✅ Sí        | ✅ Sí        | ❌ No            | ❌ No          |

## 🛠️ Tecnologías

### Frontend

- **Electron**: Framework para aplicaciones de escritorio
- **HTML5/CSS3**: Interfaz moderna y responsiva
- **JavaScript (Vanilla)**: Lógica de la aplicación

### Backend

- **Flask**: Framework web de Python
- **Flask-SQLAlchemy**: ORM para base de datos
- **Flask-CORS**: Manejo de CORS
- **SQLite**: Base de datos local

## 📁 Estructura del Proyecto

```
Invitaciones/
├── backend/
│   ├── main.py              # Servidor Flask con API REST
│   ├── db.sqlite            # Base de datos SQLite
│   ├── requirements.txt     # Dependencias Python
│   ├── run_server.bat       # Script para iniciar el servidor
│   └── venv/                # Entorno virtual Python
├── frontend/
│   ├── index.html           # Interfaz principal
│   ├── js/
│   │   └── app.js          # Lógica del frontend
│   ├── styles/
│   │   └── style.css       # Estilos CSS
│   └── assets/
│       └── favicon.png     # Ícono de la aplicación
├── electron-app/
│   └── main.js             # Configuración de Electron
├── package.json            # Configuración npm
└── README.md              # Este archivo
```

## 🚀 Instalación y Uso

### Requisitos Previos

- **Node.js** (v14 o superior)
- **Python** (v3.8 o superior)
- **npm** (viene con Node.js)

### Pasos de Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias de Node.js**:

   ```bash
   npm install
   ```

3. **Configurar el entorno Python**:
   - El proyecto ya incluye un entorno virtual en `backend/venv/`
   - Las dependencias ya están instaladas

### Ejecutar la Aplicación

Simplemente ejecuta:

```bash
npm start
```

La aplicación:

1. Iniciará automáticamente el servidor Flask en `http://127.0.0.1:5000`
2. Esperará a que el backend esté listo (verifica el endpoint `/api/health`)
3. Abrirá la ventana de Electron con la interfaz

### Cerrar la Aplicación

- Cierra la ventana de Electron o presiona `Ctrl+C` en la terminal
- El servidor Flask se cerrará automáticamente

## 🔌 API Endpoints

### Invitados

- **GET** `/api/invitados` - Obtener todos los invitados
- **GET** `/api/invitados/:id` - Obtener un invitado por ID
- **POST** `/api/invitados` - Crear un nuevo invitado
- **PUT** `/api/invitados/:id` - Actualizar un invitado
- **DELETE** `/api/invitados/:id` - Eliminar un invitado

### Filtros Especializados

- **GET** `/api/invitados/asesores_t1` - Obtener asesores T1
- **GET** `/api/invitados/asesores_t2` - Obtener asesores T2
- **GET** `/api/invitados/jurados_protocolo` - Obtener jurados de protocolo
- **GET** `/api/invitados/jurados_informe` - Obtener jurados de informe

### Health Check

- **GET** `/api/health` - Verificar estado del servidor

## 🎨 Características de la Interfaz

### Diseño Moderno

- Gradiente de fondo atractivo
- Tarjetas con sombras y efectos hover
- Badges de colores para cada rol
- Transiciones suaves
- Responsive design

### Experiencia de Usuario

- **Reintentos automáticos**: Si el servidor tarda en iniciar, la aplicación reintenta la conexión
- **Botón de recarga manual**: Si fallan los reintentos automáticos
- **Notificaciones toast**: Feedback visual para acciones
- **Confirmación de eliminación**: Previene eliminaciones accidentales
- **Contador dinámico**: Muestra la cantidad de invitados según el filtro activo

## 🔧 Desarrollo

### Modificar el Backend

El código del servidor Flask está en `backend/main.py`. Para hacer cambios:

1. Edita el archivo
2. El servidor se recargará automáticamente (modo debug)

### Modificar el Frontend

Los archivos principales son:

- `frontend/index.html` - Estructura HTML
- `frontend/js/app.js` - Lógica JavaScript
- `frontend/styles/style.css` - Estilos CSS

Para ver los cambios:

1. Guarda el archivo
2. Recarga la ventana de Electron (Ctrl+R o Cmd+R)

### Base de Datos

La base de datos SQLite se crea automáticamente en `backend/db.sqlite`.

Para reiniciar la base de datos:

```bash
# Eliminar la base de datos actual
rm backend/db.sqlite

# La base de datos se recreará automáticamente al iniciar la app
npm start
```

## 📝 Ejemplo de Uso

### Agregar un Invitado

1. Completa el formulario con el nombre del invitado
2. (Opcional) Agrega sus cargos y organizaciones
3. Marca los checkboxes de roles de asesoría si aplica
4. Haz clic en "➕ Agregar Invitado"
5. Verás una notificación de éxito y el invitado aparecerá en la lista

### Filtrar Invitados

1. Haz clic en cualquiera de los botones de filtro
2. La lista se actualizará automáticamente
3. El contador mostrará cuántos invitados coinciden con el filtro

### Eliminar un Invitado

1. Busca el invitado en la lista
2. Haz clic en el botón "🗑️ Eliminar"
3. Confirma la eliminación en el diálogo
4. El invitado se eliminará y verás una notificación

## ⚡ Solución de Problemas

### El servidor Flask no inicia

- Verifica que Python esté instalado: `python --version`
- Verifica que las dependencias estén instaladas en `backend/venv/`
- Ejecuta manualmente: `backend\venv\Scripts\python.exe backend\main.py`

### Error de CORS

- Asegúrate de que `Flask-Cors` esté instalado
- Verifica que `CORS(app)` esté presente en `backend/main.py`

### La ventana de Electron no abre

- Verifica que Node.js esté instalado: `node --version`
- Reinstala las dependencias: `npm install`

### No se muestran los invitados

- Abre las DevTools (F12) y verifica la consola
- Verifica que el servidor esté corriendo en http://127.0.0.1:5000
- Prueba el endpoint manualmente: `curl http://127.0.0.1:5000/api/invitados`

## 🤝 Contribuir

Si deseas contribuir al proyecto:

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Autor

Desarrollado para la gestión de eventos JPi.

---

**Nota**: Esta es una aplicación de desarrollo. Para producción, considera:

- Usar un servidor WSGI para Flask (gunicorn, waitress)
- Implementar autenticación y autorización
- Agregar validaciones más robustas
- Implementar respaldos de la base de datos
- Empaquetar la aplicación con electron-builder
