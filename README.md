# 🎓 Gestor de Invitaciones JPi

Aplicación de escritorio para Windows, desarrollada con Electron y Flask, diseñada para gestionar eficientemente los invitados a los eventos de la Jornada de Proyectos de Investigación (JPi).

![Captura de pantalla de la aplicación](https://i.imgur.com/rS42A2G.png)

## ✨ Características Principales

- **Gestión Completa de Invitados**: Crea, edita y elimina invitados con información detallada.
- **Roles y Cargos**: Asigna múltiples cargos/organizaciones y roles de asesoría (T1/T2).
- **Cálculo Automático de Roles**: Determina automáticamente la elegibilidad de un invitado como jurado de protocolo o informe.
- **Filtros Inteligentes**: Visualiza subconjuntos de invitados por rol con un solo clic.
- **Interfaz Moderna**: Un diseño limpio, responsivo y fácil de usar.
- **Todo en Uno**: Empaquetado como una aplicación de escritorio nativa que gestiona su propio servidor de fondo.

## 📚 Documentación Completa

Para una guía detallada sobre la arquitectura, instalación, uso y la API del sistema, consulta la documentación en la carpeta `docs/`:

- **[Introducción](./docs/index.md)**: Visión general del proyecto.
- **[Arquitectura](./docs/architecture.md)**: Cómo funciona el sistema por dentro.
- **[Guía de Uso](./docs/usage.md)**: Cómo instalar y utilizar la aplicación.
- **[Referencia de la API](./docs/api.md)**: Detalles sobre los endpoints del backend.

## 🚀 Inicio Rápido

### Requisitos
- **Node.js** (v14+)
- **Python** (v3.8+)

### Pasos

1.  **Instalar dependencias de Node.js**:
    ```bash
    npm install
    ```

2.  **Ejecutar la aplicación**:
    ```bash
    npm start
    ```

La aplicación iniciará el servidor backend automáticamente y mostrará la interfaz de usuario.

## 🛠️ Tecnologías Utilizadas

- **Framework de Escritorio**: Electron
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Flask (Python)
- **Base de Datos**: SQLite