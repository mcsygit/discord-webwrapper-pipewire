const electron = require("electron")
const ipc = electron.ipcRenderer;
const { desktopCapturer } = require('electron')

function setIFrameSize(){
    const discordframe = document.querySelector('#discordframe')
    const w = window.outerWidth
    const h = window.outerHeight
    discordframe.style = `
        width: ${w}px;
        height: ${h}px;
        border: 0;
    `
}

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

window.addEventListener('resize', setIFrameSize);

document.addEventListener("DOMContentLoaded",()=>{
    setIFrameSize()

    // BUTTONS
    document.getElementById("min-btn").addEventListener("click", function (e) {
        ipc.send("minimize-window")
    })
    document.getElementById("max-btn").addEventListener("click", function (e) {
        ipc.send("maximize-window") 
    })
    document.getElementById("close-btn").addEventListener("click", function (e) {
        ipc.send("close-window")
    })

    const framewindow = document.getElementById('discordframe').contentWindow

    framewindow.navigator.mediaDevices.chromiumGetDisplayMedia = framewindow.navigator.mediaDevices.getDisplayMedia
    framewindow.navigator.mediaDevices.getDisplayMedia = () => {
        return new Promise(async (resolve, reject) => {
            var id;
            try {
                let myDiscordAudioSink = await getAudioDevice('virtmic');
                id = myDiscordAudioSink.deviceId;
            }
            catch (error) {
                id = "default";
            }
            try {
                const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })

                const selectionElem = document.createElement('div')
                selectionElem.classList = 'desktop-capturer-selection'
                selectionElem.innerHTML = `
                    <div class="desktop-capturer-selection__scroller">
                    <ul class="desktop-capturer-selection__list">
                        ${sources.map(({id, name, thumbnail, display_id, appIcon}) => `
                        <li class="desktop-capturer-selection__item">
                            <button class="desktop-capturer-selection__btn" data-id="${id}" title="${name}">
                            <img class="desktop-capturer-selection__thumbnail" src="${thumbnail.toDataURL()}" />
                            <span class="desktop-capturer-selection__name">${name}</span>
                            </button>
                        </li>
                        `).join('')}
                    </ul>
                    </div>
                `
                document.body.appendChild(selectionElem)
                document.querySelectorAll('.desktop-capturer-selection__btn').forEach(button => {
                    button.addEventListener('click', async () => {
                        try {
                        const id = button.getAttribute('data-id')
                        const source = sources.find(source => source.id === id)
                        if(!source) {
                            throw new Error(`Source with id ${id} does not exist`)
                        }
                        
                        const stream = await window.navigator.mediaDevices.getUserMedia({
                            audio: {
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
                            },
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: source.id
                                }
                            }
                        })
                        resolve(stream)

                        selectionElem.remove()
                        } catch (err) {
                        console.error('Error selecting desktop capture source:', err)
                        reject(err)
                        }
                    })
                })
            } catch (err) {
            console.error('Error displaying desktop capture sources:', err)
            reject(err)
            }
        })
    }
})