const { BrowserWindow } = require('@electron/remote')
const $ = require('jquery')
const electron = require("electron")
const ipc = electron.ipcRenderer;
const { desktopCapturer } = require('electron')

$(()=>{
    $('#discordframe').css({width:$(window).outerWidth()+'px',height:($(window).outerHeight()-40)+'px'})
    $(window).on('resize',()=>{
        $('#discordframe').css({width:$(window).outerWidth()+'px',height:($(window).outerHeight()-40)+'px'})
    })
    document.getElementById("min-btn").addEventListener("click", function (e) {
        ipc.send("minimize-window")
    })
    document.getElementById("max-btn").addEventListener("click", function (e) {
        ipc.send("maximize-window") 
    })
    document.getElementById("close-btn").addEventListener("click", function (e) {
        ipc.send("close-window")
    })

    $('button[aria-label="Share Your Screen"]').on('click',e=>{
        console.log("custom screen sharing dialog")
        e.preventDefault()
        e.stopPropagation()
        desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
            for (const source of sources) {
                if (source.name === 'Electron') {
                mainWindow.webContents.send('SET_SOURCE', source.id)
                return
                }
            }
        })
    })
})

navigator.mediaDevices.getDisplayMedia = async () => {
    const selectedSource = await globalThis.myCustomGetDisplayMedia();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: selectedSource.id,
          minWidth: 1280,
          maxWidth: 1280,
          minHeight: 720,
          maxHeight: 720,
        },
      },
    })
    console.log("selectedSource",selectedSource)
    return stream
}
navigator.mediaDevices.chromiumGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;