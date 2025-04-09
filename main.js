const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 1100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.handle('save-code', async (event, code) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Arduino Code',
    defaultPath: 'motor_code.ino',
    filters: [{ name: 'Arduino File', extensions: ['ino'] }]
  });

  if (!canceled && filePath) {
    fs.writeFileSync(filePath, code, 'utf-8');
    return { displayPath: path.basename(filePath) };
  }

  return null;
});
