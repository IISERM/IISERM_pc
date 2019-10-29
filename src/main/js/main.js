const ipc = require('electron').ipcRenderer;
const webview = document.getElementById('iframe');
const maindiv = document.getElementById('maindiv');
const settdiv = document.getElementById('settdiv');
function openPage(URL){
    webview.src = URL;
    maindiv.style.display="inherit";
    settdiv.style.display="none";
    webview.clearHistory();
}
function openSettings() {
    settdiv.style.display="inherit";
    maindiv.style.display="none";
}
ipc.on('nav', (event, message) => {
    if(message=="back"){
        webview.canGoBack()?webview.goBack():console.log('bottom of stack');
    }
    if(message=="forward"){
        webview.canGoForward()?webview.goForward():console.log('top of stack');
    }
    if(message=="reload"){
        webview.reload();
    }
})
ipc.on('webview', (event, message) => {
    if(message=="dev"){
        webview.openDevTools();
        settings.openDevTools();
    }
})
