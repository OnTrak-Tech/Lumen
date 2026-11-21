import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork, ChildProcess } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const OVERLAY_PORT = 3000;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// ── Start the overlay/verse server ──────────────────────────────────────────
function startServer() {
  const serverPath = isDev
    ? path.join(__dirname, '../src/overlay/server.ts')
    : path.join(process.resourcesPath, 'server', 'server.js');

  if (isDev) {
    // In dev, use tsx to run the TypeScript server directly
    serverProcess = fork(serverPath, [], {
      execPath: path.join(__dirname, '../node_modules/.bin/tsx'),
      env: { ...process.env, PORT: String(OVERLAY_PORT) },
      stdio: 'inherit',
    });
  } else {
    // In production, run the compiled JS server
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: String(OVERLAY_PORT) },
      stdio: 'inherit',
    });
  }

  serverProcess.on('error', (err) => {
    console.error('[Lumen] Server process error:', err);
  });
}

// ── Create the main operator window ─────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    title: 'Lumen — Stage LED Engine',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // show once ready to avoid white flash
  });

  // Load the React UI
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in the system browser, not inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── IPC: open OBS overlay URLs in the default browser ───────────────────────
ipcMain.on('open-external', (_event, url: string) => {
  shell.openExternal(url);
});

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startServer();

  // Small delay to let the server boot before the window loads
  setTimeout(createWindow, 800);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  serverProcess?.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  serverProcess?.kill();
});
