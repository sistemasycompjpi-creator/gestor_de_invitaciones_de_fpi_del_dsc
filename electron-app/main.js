const {
  app,
  BrowserWindow,
  Menu,
  shell,
  ipcMain,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const http = require("http");

let backendProcess;

// --- Definición del Menú Personalizado ---
const menuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Exit",
        role: "quit", // Rol predefinido para cerrar la aplicación
      },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { type: "separator" },
      { role: "toggleDevTools" },
    ],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "View Documentation",
        click: () => {
          // Crea una nueva ventana para la documentación
          const docWindow = new BrowserWindow({
            width: 1024,
            height: 768,
            title: "Documentation",
            icon: path.join(__dirname, "../assets/JPi-fondo-blanco.ico"),
            webPreferences: {
              // Es una buena práctica mantener estas opciones de seguridad,
              // especialmente al cargar contenido remoto o local.
              nodeIntegration: false,
              contextIsolation: true,
              preload: path.join(__dirname, "preload-docs.js"), // Cargar el script de precarga
            },
          });

          // Carga el visor de documentación
          docWindow.loadFile(
            path.join(__dirname, "../frontend/docs-viewer.html")
          );

          // Opcional: no crear un menú para la ventana de documentación
          docWindow.setMenu(null);
        },
      },
      { type: "separator" },
      {
        label: "Developer",
        click: async () => {
          await shell.openExternal("https://github.com/JoelJohs");
        },
      },
    ],
  },
];

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: path.join(__dirname, "../assets/JPi-fondo-blanco.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Maximizar la ventana al inicio
  mainWindow.maximize();

  mainWindow.loadFile(path.join(__dirname, "../frontend/index.html"));
}

// Función para verificar si el servidor Flask está listo
function checkBackendReady(url, maxRetries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            console.log("✓ Backend Flask está listo!");
            resolve();
          } else {
            retry();
          }
        })
        .on("error", (err) => {
          retry();
        });
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error("Backend no respondió después de múltiples intentos"));
      } else {
        console.log(
          `Esperando al backend... (intento ${retries}/${maxRetries})`
        );
        setTimeout(check, interval);
      }
    };

    check();
  });
}

app.whenReady().then(async () => {
  // --- MANEJADOR PARA CARGAR ARCHIVOS MARKDOWN ---
  ipcMain.handle("load-markdown", async (event, page) => {
    try {
      const basePath = app.isPackaged
        ? path.join(process.resourcesPath, "docs")
        : path.join(__dirname, "..", "docs");

      const filePath = path.join(basePath, `${page}.md`);
      const content = await fs.promises.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      console.error(`Error loading markdown file: ${page}.md`, error);
      return `# Error

Could not load file: ${page}.md

${error.message}`;
    }
  });

  ipcMain.handle("select-dir", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (canceled) {
      return null;
    }
    return filePaths[0];
  });

  ipcMain.handle("get-desktop-path", async () => {
    return app.getPath("desktop");
  });

  // Construir y establecer el menú
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // --- OBTENER RUTA DE DATOS DEL USUARIO ---
  const userDataPath = app.getPath("userData");
  console.log(`Ruta de datos del usuario (userData): ${userDataPath}`);

  console.log("Iniciando servidor Flask...");

  // --- DETECTAR SI ESTAMOS EN DESARROLLO O EMPAQUETADO ---
  let backendExecutable;

  if (app.isPackaged) {
    // PRODUCCIÓN: La app está empaquetada como .exe
    console.log("🚀 Ejecutando en modo PRODUCCIÓN (empaquetado)");
    // La ruta ahora apunta directamente al backend.exe en la carpeta 'resources'
    backendExecutable = path.join(process.resourcesPath, "backend.exe");
    console.log(`Backend executable: ${backendExecutable}`);

    // --- PASAR LA RUTA DE DATOS COMO ARGUMENTO AL EJECUTABLE ---
    backendProcess = spawn(backendExecutable, [userDataPath]);
  } else {
    // DESARROLLO: npm start o electron .
    console.log("💻 Ejecutando en modo DESARROLLO");
    const pythonExecutable = path.join(
      __dirname,
      "../backend/venv/Scripts/python.exe"
    );
    const backendScript = path.join(__dirname, "../backend/main.py");
    console.log(`Python executable: ${pythonExecutable}`);
    console.log(`Backend script: ${backendScript}`);

    // --- PASAR LA RUTA DE DATOS COMO ARGUMENTO AL SCRIPT DE PYTHON ---
    backendProcess = spawn(pythonExecutable, [backendScript, userDataPath]);
  }

  backendProcess.stdout.on("data", (data) => {
    console.log(`Backend stdout: ${data}`);
  });
  backendProcess.stderr.on("data", (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  // Esperar a que el backend esté listo antes de abrir la ventana
  try {
    await checkBackendReady("http://127.0.0.1:5000/api/health");
    createWindow();
  } catch (error) {
    console.error("Error al iniciar el backend:", error);
    // Aún así crear la ventana para mostrar el mensaje de error
    createWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 3. ASEGÚRATE DE CERRAR EL BACKEND CUANDO CIERRES LA APP
app.on("window-all-closed", () => {
  // Termina el proceso del backend (Flask) de forma segura
  if (backendProcess) {
    backendProcess.kill("SIGTERM"); // Envía señal de terminación
    // Si no responde, forzar cierre después de 2 segundos
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill("SIGKILL");
      }
    }, 2000);
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Asegurar cierre del backend al salir de la aplicación
app.on("before-quit", () => {
  if (backendProcess) {
    backendProcess.kill("SIGTERM");
  }
});

