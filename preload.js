// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveCode: async (code) => {
    return await ipcRenderer.invoke('save-code', code);
  }
});
