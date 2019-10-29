const Store = require('electron-store');

function onChange(){
    if(document.getElementById('mainCheck').checked){
        document.getElementById('settings').style.display="inherit";
    } else {
        document.getElementById('settings').style.display="none";
    }
}

function get(id){
    return document.getElementById(id);
}

function fillinfo(){
    store = new Store({name:"userinfo"})
    get('mainCheck').checked = store.get("lockorno")
    if (store.get("lockorno")){
        document.getElementById('settings').style.display="inherit";
        get('master').value = store.get('master');
        get('epw').value = store.get('epw');
        get('mpw').value = store.get('mpw');
        get('kpw').value = store.get('kpw');
        get('roll').value = store.get('roll');
        get('wpw').value = store.get('wpw');
    } else {
        document.getElementById('settings').style.display="inherit";
        get('master').value = "";
        get('epw').value = "";
        get('mpw').value = "";
        get('kpw').value = "";
        get('roll').value = "";
        get('wpw').value = "";
    }
}

function save(){
    lockorno = get("mainCheck").checked;
    if(lockorno){
        master = get("master").value;
        epw = get("epw").value;
        mpw = get("mpw").value;
        kpw = get("kpw").value;
        roll = get("roll").value;
        wpw = get("wpw").value;
        var store = new Store({name:"userinfo"})
        store.set("master", master);
        store.set("epw", epw);
        store.set("mpw", mpw);
        store.set("kpw", kpw);
        store.set("roll", roll);
        store.set("wpw", wpw);
        store.set("lockorno", true);
        console.log(store.store);
    } else {
        var store = new Store({name:"userinfo"})
        store.clear()
        console.log(store.store);
    }
    return true;
}
