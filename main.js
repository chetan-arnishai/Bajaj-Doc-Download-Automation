'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { runFromExcel, setLogger } = require('./index');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 700,
    minWidth: 480,
    minHeight: 500,
    title: 'Care Closer Automation Tool',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// -------------------------------------------------------
// IPC — START AUTOMATION
// -------------------------------------------------------
ipcMain.on('start-automation', async (event, payload) => {
  const excelPath = payload && payload.excelPath;

  // Wire logger → sends every log line to renderer
  setLogger((message) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('log', message);
      }
    } catch (err) {
      console.error('[MAIN] Logger send failed:', err.message);
    }
  });

  // Notify UI: started
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('automation-status', 'running');
    }
  } catch (err) {
    console.error('[MAIN] Status send failed:', err.message);
  }

  try {
    await runFromExcel(excelPath);

    // Notify UI: success
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('automation-status', 'success');
    }

  } catch (err) {
    console.error('[MAIN] run() threw:', err.message);

    // Notify UI: error
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('log', '[ERROR] Automation crashed: ' + err.message);
        mainWindow.webContents.send('automation-status', 'error');
      }
    } catch (e) {
      console.error('[MAIN] Could not send error to renderer:', e.message);
    }
  }
});