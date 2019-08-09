const ipc = require('electron').ipcRenderer;
function openPage(URL){
    ipc.send('openPage',URL);
}
function openLocalPage(FILE){
    ipc.send('openLocalPage',FILE);
}
window.openPage=openPage;
window.openLocalPage=openLocalPage;
