const { initialize, enable  } = require("@electron/remote/main")
const { app, BrowserWindow } = require('electron')
const path = require('path')
const ipc = require("electron").ipcMain

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
        contextIsolation:false,
        enableRemoteModule: true,
        webviewTag: true,
        preload: path.join(__dirname,'preload.js')
      }
    })
    enable(win.webContents)
    win.loadFile('src/index.html')

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
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
    })
})