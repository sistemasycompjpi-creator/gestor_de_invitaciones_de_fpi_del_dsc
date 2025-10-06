
const { contextBridge, ipcRenderer } = require('electron');

// Exponer de forma segura el canal de comunicación al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  loadMarkdown: (page) => ipcRenderer.invoke('load-markdown', page),
  selectDirectory: () => ipcRenderer.invoke('select-dir')
});
