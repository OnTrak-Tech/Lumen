import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal, safe API to the renderer process
contextBridge.exposeInMainWorld('lumen', {
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  platform: process.platform,
  version: process.env.npm_package_version ?? '0.1.0',
});
