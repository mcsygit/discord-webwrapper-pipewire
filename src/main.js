const { initialize, enable  } = require("@electron/remote/main")
const { app, BrowserWindow } = require('electron')
const path = require('path')
const ipc = require("electron").ipcMain
const { systemPreferences } = require('electron')

initialize();

const createWindow = () => {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      minHeight: 400,
      minWidth: 400,
      frame:false,
      vibrancy: 'dark',
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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
})