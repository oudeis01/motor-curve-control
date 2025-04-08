const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

ipcMain.handle('save-code', async (event, code) => {
    let baseDir;
    if (process.platform === 'darwin') {
      // In macOS the executable is in MyApp.app/Contents/MacOS,
      // so the .app folder is one level up from Contents.
      baseDir = require('path').resolve(require('path').dirname(app.getPath('exe')), '../../..');
    } else {
      baseDir = require('path').dirname(process.execPath);
    }
    const fileName = `generated_${Date.now()}.ino`;
    const filePath = require('path').join(baseDir, fileName);
    require('fs').writeFileSync(filePath, code, 'utf-8');
    return fileName;
  });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 1100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);