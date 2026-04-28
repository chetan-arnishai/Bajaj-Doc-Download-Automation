'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // Renderer → Main: start automation with excel payload
  startAutomation: (payload) => {
    ipcRenderer.send('start-automation', payload);
  },

  // Renderer helper: get absolute path for <input type="file"> File
  // (File.path was removed in newer Electron versions)
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch (err) {
      console.error('[PRELOAD] getPathForFile error:', err.message);
      return null;
    }
  },

  // Main → Renderer: receive a log line
  onLog: (callback) => {
    ipcRenderer.on('log', (_event, message) => {
      try {
        callback(message);
      } catch (err) {
        console.error('[PRELOAD] onLog callback error:', err.message);
      }
    });
  },

  // Main → Renderer: automation status updates
  // status values: 'running' | 'success' | 'error' | 'stopped'
  onStatus: (callback) => {
    ipcRenderer.on('automation-status', (_event, status) => {
      try {
        callback(status);
      } catch (err) {
        console.error('[PRELOAD] onStatus callback error:', err.message);
      }
    });
  },

  // Cleanup listeners (call on window unload to avoid memory leaks)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('log');
    ipcRenderer.removeAllListeners('automation-status');
  },
});