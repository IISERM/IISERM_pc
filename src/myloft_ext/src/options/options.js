var currentBrowser = UAParser(navigator.userAgent).browser.name;
var defaultBrowserName = "CHROME_EXTENSION";
var platformName = "CHROMEEXTENSION";
var deviceName = "Chrome";
var uidGen = "CHROME_EXT_";

if (currentBrowser && currentBrowser == "Edge") {
    defaultBrowserName = "MICROSOFTEDGE_EXTENSION";
    platformName = "MICROSOFTEDGEEXTENSION";
    deviceName = "Microsoft Edge";
    uidGen = "MICROSOFTEDGE_EXT_"
}


window.onload = function () {
    document.getElementById('logout').addEventListener('click', logoutUser);
    var currentToken = localStorage.getItem('token');
    if (currentToken) {
        //get user profile now
        winloadmiddleware()
    } else {
        document.getElementById('login').style.display = "block";
        document.getElementById('login').addEventListener('click', loginUser);
    }
}

async function loginUser() {
    var deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        generateUUID().then((data) => {
            deviceId = data;
            localStorage.setItem('deviceId', deviceId);
        });

    }
    chrome.tabs.create({ url: 'https://app.myloft.xyz/user/login?deviceId=' + deviceId });
}

async function winloadmiddleware() {
    document.getElementById('logout').style.display = "block";
    var data = await getUserAccountProfile();
}

async function getUserAccountProfile() {
    var querydata = JSON.stringify({ "query": "query{getUserProfile{data{email associatedAccount{firstName currentInstitute{instituteName}}} success msg msgId}}" })

    var userData = await simpleFetchQuery(querydata, true, 'getUserProfile');

    if (userData) {
        if (userData['success']) {
            //set name , email , institute
            document.getElementById('fullname').innerText = userData['data']['associatedAccount']['firstName'];
            document.getElementById('emailId').innerText = userData['data']['email'];
            if (userData['data']['associatedAccount']['currentInstitute']) {
                document.getElementById('currentInstitute').innerText = userData['data']['associatedAccount']['currentInstitute']['instituteName'];
            }
            return true;
        }
    }
    return false;
}

async function logoutUser() {

    var querydata = JSON.stringify({ "query": "mutation{logout{msgId msg success}}" });
    var logoutData = await simpleFetchQuery(querydata, true, 'logout');

    localStorage.clear();
    document.getElementById('fullname').innerText = "";
    document.getElementById('emailId').innerText = "";
    document.getElementById('currentInstitute').innerText = "";
    document.getElementById('logout').style.display = "none"
    chromeNotification('Logout Success');
    setMyLOFTIcon(false);
    clearProxySettings();
    sendMessagetoBg();
    document.getElementById('login').style.display = "block";
    document.getElementById('login').addEventListener('click', loginUser);

}

function chromeNotification(passMessage) {
    var opt = {
        iconUrl: '../../icon.png',
        title: 'Logout',
        type: 'basic',
        message: passMessage
    }
    chrome.notifications.create('', opt)
    return true;
}

//one function for all http fetch queries

async function simpleFetchQuery(queryData, withAuth, queryName) {
    var localTempData = queryData;
    var localAuthStatus = withAuth;
    var localQueryName = queryName;
    var url = "https://api.myloft.xyz/";
    var deviceId = localStorage.getItem('deviceId');
    try {
        var settings = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-DeviceID': deviceId,
                'X-Device': platformName
            },
            body: queryData
        };

        if (withAuth) {
            var token = localStorage.getItem('token');
            settings.headers['X-Authorization'] = token;
        }

        var data = await fetch(url, settings)
            .then(response => response.json())
            .then(json => {
                return json;
            })
            .catch(e => {
                console.log(e)
                return { 'success': false, 'msgId': "FAILEDREQ" }
            })

        if (queryName != 'refreshToken' && data['data'][queryName]['msgId'] == "INVALIDTOKEN") {
            //refresh token first as msg received from server says invalid token
            var refreshTokenNow = await refreshToken();
            if (refreshTokenNow['success']) {
                var reData = await simpleFetchQuery(localTempData, localAuthStatus, localQueryName);
                return reData;
            } else {
                return { 'success': false, 'msgId': "FAILEDREQ" }
            }
        } else if (queryName != 'refreshToken') {
            return data['data'][queryName];
        } else if (queryName == 'refreshToken' && data['data'][queryName]['token']) {
            return data['data'][queryName];
        } else {
            return { 'success': false, token: null }
        }
    } catch (err) {
        return { 'success': false, 'msgId': "FAILEDREQ" }
    }
}



async function refreshOptionsToken() {
    // function to refresh the current token when it has expired
    var queryData = JSON.stringify({
        query: `mutation{
        refreshToken{
          token
          success
          msg
          msgId
        }
        }`
    });
    try {
        var data = await simpleFetchQuery(queryData, true, 'refreshToken');
        if (data.success) {
            if (data.token) {
                localStorage.setItem('token', data.token)
            }
            return { 'success': true }
        } else {
            if (data.msgId) {
                if (data.msgId == "FAILEDREQ") {
                    return { 'success': false }
                }
            }
            if (!data.token) {
                localStorage.clear();
                clearProxySettings()
                return { 'success': false }
            }
            return { 'success': false }
        }
    } catch (error) {
        return { 'success': false }
    }
}

//function to generate a random UUID
function generateUUID() {
    return new Promise((resolve, reject) => {
        Fingerprint2.get((data) => {
            var values = data.map(function (component) { return component.value });
            var tokenData = Fingerprint2.x64hash128(values.join(''), 31);
            if (!tokenData) {
                var d = new Date().getTime();
                var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
                resolve(uidGen + uuid);
                return;
            }
            resolve(uidGen + tokenData);
        })
    });
};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.loginSuccess) {
        //update options tabs
        if (localStorage.getItem('token')) {
            document.getElementById('login').style.display = "none";
            winloadmiddleware();
        }
    }
});

//send message to background

async function sendMessagetoBg() {
    chrome.runtime.sendMessage({ logoutFromOptions: true })
}

//clear proxy settings

function clearProxySettings() {
    chrome.proxy.settings.clear({ scope: 'regular' },
        function (data) {
            return { 'success': true }
        }
    );
}

//implementing localization in html

(function () {

    window.addEventListener('load', function () {
        var needsTranslation = document.querySelectorAll("[data-i18n]"),
            t = chrome.i18n.getMessage;
        for (var i = 0, l = needsTranslation.length; i < l; i++) {
            if (needsTranslation[i]) {
                var element = needsTranslation[i],
                    targets = element.dataset.i18n.split(/\s*,\s*/);
                for (var j = 0, m = targets.length; j < m; j++) {
                    var parameters = targets[j].split(/\s*=\s*/);
                    if (parameters.length === 1 || parameters[0] === 'textContent') {
                        element.textContent = t(element.dataset.i18n);
                    }
                    else if (parameters[0] === 'innerHTML') {
                        element.innerHTML = t(element.dataset.i18n);
                    }
                    else {
                        element.setAttribute(parameters[0], t(parameters[1]));
                    }
                }
            }
        }
    });

}).call(this);


//function to set the icon to show login status

function setMyLOFTIcon(isLoggedIn) {
    if (isLoggedIn) {
        chrome.browserAction.setIcon({
            path: {
                "16": "icons/icon16.png",
                "19": "icons/icon19.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png"
            }
        });
    } else {
        chrome.browserAction.setIcon({
            path: {
                "16": "icons/icon_myloftbw16.png",
                "19": "icons/icon_myloftbw19.png",
                "48": "icons/icon_myloftbw48.png",
                "128": "icons/icon_myloftbw128.png"
            }
        });
    }
}


//Dev: Vineet Deshpande
//Author : Eclat Engineering Pvt. Ltd.
//Copyright Eclat Engineering Pvt. Ltd.