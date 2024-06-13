const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  loadConnectionDetails: (clientType) => ipcRenderer.invoke('load-connection-details', clientType),
  saveConnectionDetails: (clientType, details) => ipcRenderer.invoke('save-connection-details', clientType, details),
  executeQuery: (params) => ipcRenderer.invoke('execute-query', params),
  testConnection: (clientType) => ipcRenderer.invoke('test-connection', clientType),
  getTables: (clientType) => ipcRenderer.invoke('get-tables', clientType),
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  saveConfig: (key, value) => ipcRenderer.send('save-config', key, value),
  getDatabases: (connectionDetails) => ipcRenderer.invoke('get-databases', connectionDetails), // Add this line
});
