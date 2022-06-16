const { initialize, enable  } = require("@electron/remote/main")
const { app, BrowserWindow } = require('electron')
const path = require('path')
const ipc = require("electron").ipcMain
const { systemPreferences, Tray, nativeImage } = require('electron')
const sharp = require('sharp')

initialize();

const trayIcon = Buffer.from(`
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <circle cx="512" cy="512" r="512" style="fill:#5865f2"/>
        <path d="M689.43 349a422.21 422.21 0 0 0-104.22-32.32 1.58 1.58 0 0 0-1.68.79 294.11 294.11 0 0 0-13 26.66 389.78 389.78 0 0 0-117.05 0 269.75 269.75 0 0 0-13.18-26.66 1.64 1.64 0 0 0-1.68-.79A421 421 0 0 0 334.44 349a1.49 1.49 0 0 0-.69.59c-66.37 99.17-84.55 195.9-75.63 291.41a1.76 1.76 0 0 0 .67 1.2 424.58 424.58 0 0 0 127.85 64.63 1.66 1.66 0 0 0 1.8-.59 303.45 303.45 0 0 0 26.15-42.54 1.62 1.62 0 0 0-.89-2.25 279.6 279.6 0 0 1-39.94-19 1.64 1.64 0 0 1-.16-2.72c2.68-2 5.37-4.1 7.93-6.22a1.58 1.58 0 0 1 1.65-.22c83.79 38.26 174.51 38.26 257.31 0a1.58 1.58 0 0 1 1.68.2c2.56 2.11 5.25 4.23 8 6.24a1.64 1.64 0 0 1-.14 2.72 262.37 262.37 0 0 1-40 19 1.63 1.63 0 0 0-.87 2.28 340.72 340.72 0 0 0 26.13 42.52 1.62 1.62 0 0 0 1.8.61 423.17 423.17 0 0 0 128-64.63 1.64 1.64 0 0 0 .67-1.18c10.68-110.44-17.88-206.38-75.7-291.42a1.3 1.3 0 0 0-.63-.63zM427.09 582.85c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.02 28.44-20.37 51.6-46 51.6zm170.13 0c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.01 28.44-20.17 51.6-46 51.6z" style="fill:#fff"/>
    </svg>
`)

let tray = null
const createWindow = async () => {
    const icon = await sharp(trayIcon).png().resize(128, 128).toBuffer();
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      minHeight: 400,
      minWidth: 400,
      frame:false,
      vibrancy: 'dark',
      icon:nativeImage.createFromBuffer(icon),
      webPreferences: {
        experimentalFeatures: true,
        nodeIntegration: true,
        nodeIntegrationInSubFrames:true,
        contextIsolation:false,
        enableRemoteModule: true,
        webviewTag: true,
        preload: path.join(__dirname,'preload.js')
      }
    })
    enable(win.webContents)
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({ responseHeaders: Object.fromEntries(Object.entries(details.responseHeaders).filter(header => !/x-frame-options/i.test(header[0]))) });
    })
    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
    })
    win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(true);
    })
    win.loadFile('src/index.html')

    systemPreferences.askForMediaAccess('camera')
    systemPreferences.askForMediaAccess('microphone')

    ipc.on("maximize-window", function(event) {
        if(win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    })
    ipc.on("minimize-window", function(event) {
        if(win.isMinimized()) {
            win.show();
        } else {
            win.minimize();
        }
    })
    ipc.on("close-window", function(event) {
        win.close()
    })
}

app.whenReady().then(() => {
    app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
    app.commandLine.appendSwitch('enable-webrtc-pipewire-capturer', 'enabled');

    createWindow()

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
        const icon = await sharp(trayIcon).png().resize(16, 16).toBuffer();
        tray = new Tray(nativeImage.createFromBuffer(icon))
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
})