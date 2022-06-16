const { desktopCapturer, contextBridge } = require("electron");
const { readFileSync } = require("fs")
const { join } = require("path")

window.addEventListener('DOMContentLoaded', () => {

    const rendererScript = document.createElement("script");
    rendererScript.text = readFileSync(join(__dirname, "renderer.js"), "utf8");
    document.body.appendChild(rendererScript);

    var css = ``
    var head = document.head || document.getElementsByTagName('head')[0]
    var style = document.createElement('style');
    style.id = 'custom-theme'
    head.appendChild(style);
    style.appendChild(document.createTextNode(css));

    const button = document.createElement('button')
    button.id="custom-screenshare"
    button.innerHTML = 'Screen sharing'
    button.on('click',e=>{
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
    $('button[aria-controls="popout_32"]').parent().append(button)
})

const getAudioDevice = async (nameOfAudioDevice) => {
    await navigator.mediaDevices.getUserMedia({
        audio: true
    });
    let devices = await navigator.mediaDevices.enumerateDevices();
    let audioDevice = devices.find(({
        label
    }) => label === nameOfAudioDevice);
    return audioDevice;
}

contextBridge.exposeInMainWorld("myCustomGetDisplayMedia", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    })
    const selectedSource = sources[0]
    var id;
    try {
        let myDiscordAudioSink = await getAudioDevice('virtmic');
        id = myDiscordAudioSink.deviceId;
    }
    catch (error) {
        id = "default";
    }
    let captureSystemAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            // We add our audio constraints here, to get a list of supported constraints use navigator.mediaDevices.getSupportedConstraints();
            // We must capture a microphone, we use default since its the only deviceId that is the same for every Chromium user
            deviceId: {
                exact: id
            },
            // We want auto gain control, noise cancellation and noise suppression disabled so that our stream won't sound bad
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false
            // By default Chromium sets channel count for audio devices to 1, we want it to be stereo in case we find a way for Discord to accept stereo screenshare too
            //channelCount: 2,
            // You can set more audio constraints here, bellow are some examples
            //latency: 0,
            //sampleRate: 48000,
            //sampleSize: 16,
            //volume: 1.0
        }
    });
    let [track] = captureSystemAudioStream.getAudioTracks();
    selectedSource.addTrack(track);
    return selectedSource;
})