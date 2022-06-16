const { BrowserWindow } = require('@electron/remote')
const $ = require('jquery')
const electron = require("electron")
const ipc = electron.ipcRenderer;

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
})