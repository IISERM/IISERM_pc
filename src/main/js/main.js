const ipc = require('electron').ipcRenderer;
const photon = require('electron-photon');

const webview = document.getElementById('main');
const maindiv = document.getElementById('maindiv');
const settdiv = document.getElementById('settdiv');

function openPage(URL) {
    webview.src = URL;
    maindiv.style.display = "inherit";
    settdiv.style.display = "none";
    webview.clearHistory();
}
function openSettings() {
    ipc.send("settings", null);
}

function back() {
    webview.canGoBack() ? webview.goBack() : console.log('bottom of stack');
}
function forward() {
    webview.canGoForward() ? webview.goForward() : console.log('top of stack');
}
ipc.on('nav', (_event, message) => {
    if (message == "back") {
        back();
    }
    if (message == "forward") {
        forward();
    }
    if (message == "reload") {
        webview.reload();
    }
})
ipc.on('webview', (_event, message) => {
    if (message == "dev") {
        webview.openDevTools();
        settings.openDevTools();
    }
})
