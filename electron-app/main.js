const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
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
  // Construir y establecer el menú
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  const pythonExecutable = path.join(
    __dirname,
    "../backend/venv/Scripts/python.exe"
  );
  const backendScript = path.join(__dirname, "../backend/main.py");

  console.log("Iniciando servidor Flask...");
  backendProcess = spawn(pythonExecutable, [backendScript]);

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

