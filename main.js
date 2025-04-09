const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

// Disable unused features
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-pdf-extension');

app.on('ready', () => {
  // Remove the default menu
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 1100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  const indexPath = process.env.NODE_ENV === 'development'
    ? path.join(__dirname, 'index.html')
    : path.join(process.resourcesPath, 'app.asar', 'index.html');

  mainWindow.loadFile(indexPath);
});

function getExecutableParentPath() {
  let exePath;

  if (process.env.NODE_ENV === 'development') {
    exePath = process.cwd(); // In dev mode, use the project root
  } else if (process.env.APPIMAGE) { // Linux AppImage
    exePath = path.dirname(process.env.APPIMAGE);
  } else if (process.pkg) { // Windows executable
    exePath = path.dirname(process.execPath);
  } else if (process.platform === 'darwin') { // macOS
    if (process.execPath.includes('.app/Contents/MacOS')) {
      exePath = path.resolve(process.execPath, '../../../../');
    } else {
      exePath = process.cwd();
    }
  } else {
    exePath = path.dirname(process.execPath);
  }

  return exePath;
}

ipcMain.handle('save-code', async (event, code) => {
  try {
    const exePath = getExecutableParentPath();
    const outputDir = path.join(exePath, 'MotorCurveGenerator_Output');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate filename with timestamp
    const fileName = `generated_${Date.now()}.ino`;
    const filePath = path.join(outputDir, fileName);

    // Write file
    fs.writeFileSync(filePath, code);
    
    // Return relative path for display
    return {
      fullPath: filePath,
      displayPath: path.relative(exePath, filePath)
    };
  } catch (error) {
    console.error('Save error:', error);
    throw error;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = new BrowserWindow({
      width: 1100,
      height: 1100,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    const indexPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, 'index.html')
      : path.join(process.resourcesPath, 'app.asar', 'index.html');

    mainWindow.loadFile(indexPath);
  }
});