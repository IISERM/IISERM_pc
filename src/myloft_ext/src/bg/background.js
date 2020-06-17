//new tab mapper JSON initiate

var newTabMapJSON = {};

// initate current and prev tab variables

var previousTabId = 0;
var previousUrl = "";
var currentTabId = 0;
var currentUrl = "";

//global flag to check on and off campus

var isOnCampus = false;

// intitiate accessible domains

var accessibleDomains = [];

// initiate institute hostname 

var instituteHostname = "";

//initiate institute ip addd

var instituteIpAddress = "";

//initiate institute proxy port

var instituteProxyPort = null;

// intiate list of all user tags

var allTagsofUser = [];

// intiate list of all user collections

var allCollectionsofUser = [];

// intiate the variable for checking the state of refreshtoken process

var globalRefreshTokenProcess = false;


//intitate the global current time stamp -> used for pdf first time check 
var globalCurrentTimestamp = new Date().getTime();

//this array is for pdfs detected that neednot be checked for meta
var dntArrayPDFs = ['elsevier.com', 'els-cdn.com', 'clinicalkey.com', 'sciencedirect.com', 'uptodate.com'];

//this array is for pdfs and html that need not be checked for meta

var dntArrayPDFHTML = ['ieee.org'];

//my doi checks below
var findDoi = /\b(10[.][0-9]{3,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/ig;
var findDoiURL = /^(?:https?\:\/\/)(?:dx\.)?doi\.org\/(10[.][0-9]{3,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)$/ig;

//--  PDF check

const PDF_MIME_TYPES = [
  'application/pdf',
  'image/pdf',
  'text/pdf',
  'application/x-pdf',
  'image/x-pdf',
  'text/x-pdf',
  'application/acrobat',
  'applications/vnd.pdf',
];
const HEADER_CONTENT_DISPOSITION = 'content-disposition';

//-- PDF check constant

//initiate array of pdf count

var pdfArray = [];

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


// make sure all the listeners are loaded and ready

onSystemStateCheck();
addOnCreateListener();
tabsonActivated();
tabsonUpdated();
tabsonRemoved();
tabsonReplaced();
tabsonHighlighted();
onWindowFocusChangedListener();

//temp check for online and offline
window.addEventListener('offline', function (e) { console.log('offline'); });

window.addEventListener('online', async function (e) {
  console.log(e);
  console.log('online');
});

//on load of background page set device id;

window.onload = async function () {
  var deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    localStorage.clear();

    //reset global vars on local storage clear
    newTabMapJSON = {};
    previousTabId = 0;
    previousUrl = "";
    currentTabId = 0;
    currentUrl = "";
    accessibleDomains = [];
    instituteHostname = "";
    instituteIpAddress = "";
    instituteProxyPort = null;
    allTagsofUser = [];
    allCollectionsofUser = [];
    clearProxySettings()
    // pacFileCreator(["example.com"], '', 0000)
    //new local device id for chrome extension swr
    var newId = await generateUUID();
    localStorage.setItem('deviceId', newId);
  }

  var currentToken = localStorage.getItem('token');
  if (currentToken) {
    try {
      var decodedToken = await parseJwt(currentToken);
      var currentTime = new Date().getTime();
      if (decodedToken['exp'] < currentTime) {
        var refreshTokenData = await refreshToken();
      } else {
        var domains = await getListOfDomains()
        var tags = getlistOfTags();
        var cols = getlistOfCollections();
        var domainData = getExceededLimits();
      }
    } catch (err) {
      console.log(err);
    }
  }

}



//custom refresh token interval 

var refreshTokInterval = setInterval(() => {
  var data = isRefreshTokenUpdated()
}, 60000)

//oncampus offcampusinterval 

var whereAmIstatusInterval = setInterval(() => {
  whereAmI()
  var token = localStorage.getItem('token');
  if (token) {
    tempQuery();
  }
}, 300000)


var iconInterval = setInterval(() => {
  var token = localStorage.getItem('token');
  if (token) {
    setMyLOFTIcon(true)
  } else {
    setMyLOFTIcon(false)
  }
}, 5000)

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

async function tempQuery() {
  try {
    var url = "https://ping.myloft.xyz";
    var settings = {
      method: 'GET'
    };

    var responseData = await fetch(url, settings)
      .then(response => response)
      .catch(e => {
        // console.log(e)
        return { 'success': false, 'msgId': "FAILEDREQ" }
      })
  } catch (error) {
    // console.log(error)
  }
}


var anaylticsInterval = setInterval(async () => {
  // var data = createAnalyticsDataJSON()
  var currentBrowsingData = localStorage.getItem('Browsing' + '_analytics');

  //now delete current values
  localStorage.removeItem('Browsing' + '_analytics');
  //now get parsed data for server
  var parsedData = [];
  if (currentBrowsingData) {
    parsedData = JSON.parse(currentBrowsingData);
  }
  var currentSearchKeywordData = localStorage.getItem('SearchKeyword' + '_analytics');

  //now delete current values
  localStorage.removeItem('SearchKeyword' + '_analytics');
  //now get parsed data for server
  var parsedKeywordData = [];
  if (currentSearchKeywordData) {
    parsedKeywordData = JSON.parse(currentSearchKeywordData);
  }

  var mergedDataIs = parsedData.concat(parsedKeywordData);

  var currentArticleSaveData = localStorage.getItem('ArticleSave' + '_analytics');

  //now delete current values
  localStorage.removeItem('ArticleSave' + '_analytics');
  //now get parsed data for server
  var parsedArticlesSavedData = [];
  if (currentArticleSaveData) {
    parsedArticlesSavedData = JSON.parse(currentArticleSaveData);
  }
  mergedDataIs = mergedDataIs.concat(parsedArticlesSavedData)
  //now send...
  if (mergedDataIs && mergedDataIs != null) {
    if (mergedDataIs.length > 0) {
      var dataJSON = {
        'data': mergedDataIs
      }
      try {
        var data = await reportingFetchQuery(JSON.stringify(dataJSON), true);
      } catch (err) {
        console.log(err)
      }
    }
  }

  //now send...
}, 20000)


//function to check oncampus offcampus status

async function whereAmI() {
  var token = localStorage.getItem('token');
  var deviceId = localStorage.getItem('deviceId');

  if (token && deviceId) {
    var queryData = JSON.stringify({
      "query": "query{getCampusAccessType{data{ip type} msg msgId success}}"
    });
    try {
      var networkData = await simpleFetchQuery(queryData, true, 'getCampusAccessType');
      if (networkData) {
        if (networkData['success']) {
          if (networkData.data.type == "ON_CAMPUS") {
            clearProxySettings();
            isOnCampus = true;
          } else {
            isOnCampus = false;
            getListOfDomains();
          }
        }
        else if (!networkData["success"] && networkData["msgId"] == "FAILEDREQ") {
          var networkData = await simpleFetchQuery(queryData, true, 'getCampusAccessType');
          if (networkData.data.type == "ON_CAMPUS") {
            clearProxySettings();
            isOnCampus = true;
          } else {
            isOnCampus = false;
          }
        }
      }
    } catch (err) {
      console.log(err)
    }
  }
}



// check state of the system and check if we need to refresh token when the system comes back from idle state

function onSystemStateCheck() {
  chrome.idle.onStateChanged.removeListener(onSystemStateCheck)
  chrome.idle.onStateChanged.addListener(async function (data) {
    if (data == "active") {
      var data = await isRefreshTokenUpdated()
    }
  })
}


//send message to options page

async function sendMessagetoOptions() {
  chrome.runtime.sendMessage({ loginSuccess: true })
  return true;
}


// keep a check on the new tab opened just in case if need to check on pdf

function addOnCreateListener() {
  chrome.tabs.onCreated.removeListener(addOnCreateListener)
  chrome.tabs.onCreated.addListener(function (tab) {
    if (tab.openerTabId) {
      newTabMapJSON['id'] = tab.openerTabId;
      newTabMapJSON['timestamp'] = new Date().getTime();
      // if (tab.url) {
      //   var checkIfAuthNeeded = accessibleDomains.filter((d) => { var tempURL = new URL(tab.url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
      //   if (checkIfAuthNeeded.length > 0) {
      //     chrome.browserAction.setIcon({
      //       path: {
      //         '16': 'icons/icon_key_16.png',
      //         '48': 'icons/icon_key_48.png',
      //         '128': 'icons/icon_key_128.png'
      //       }
      //     })
      //   } else {
      //     chrome.browserAction.setIcon({
      //       path: {
      //         '16': 'icons/icon16.png',
      //         '19': 'icons/icon19.png',
      //         '48': 'icons/icon48.png',
      //         '128': 'icons/icon128.png'
      //       }
      //     })
      //   }
      // }
    }
  })
}


// keep a check on previous and current tab just in case if need to check on pdf

function tabsonActivated() {
  chrome.tabs.onActivated.removeListener(tabsonActivated)
  chrome.tabs.onActivated.addListener(function (la) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      previousTabId = currentTabId;
      previousUrl = currentUrl;
      if (tabs && tabs.length > 0) {
        currentTabId = tabs[0].id;
        currentUrl = tabs[0].url;
        chrome.tabs.sendMessage(tabs[0].id, { domainsList: JSON.stringify(accessibleDomains) });
        // var checkIfAuthNeeded = accessibleDomains.filter((d) => { var tempURL = new URL(tabs[0].url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
        // if (checkIfAuthNeeded.length > 0) {
        //   chrome.browserAction.setIcon({
        //     path: {
        //       '16': 'icons/icon_key_16.png',
        //       '48': 'icons/icon_key_48.png',
        //       '128': 'icons/icon_key_128.png'
        //     }
        //   })
        // } else {
        //   chrome.browserAction.setIcon({
        //     path: {
        //       '16': 'icons/icon16.png',
        //       '19': 'icons/icon19.png',
        //       '48': 'icons/icon48.png',
        //       '128': 'icons/icon128.png'
        //     }
        //   })
        // }
      }
    })
  });
}


// keep a check on the updated tabs just in case we need to refresh token on tab updation

function tabsonUpdated() {
  chrome.tabs.onUpdated.removeListener(tabsonUpdated)
  chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
      if (tab.url && tab.url.indexOf('app.myloft.xyz') > -1) {
        chrome.browserAction.disable();
      } else {
        chrome.browserAction.enable();
      }
      var data = await isRefreshTokenUpdated();
      chrome.tabs.sendMessage(tab.id, { domainsList: JSON.stringify(accessibleDomains) });
      // if (tab.url) {
      //   var checkIfAuthNeeded = accessibleDomains.filter((d) => { var tempURL = new URL(tab.url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
      //   if (checkIfAuthNeeded.length > 0) {
      //     chrome.browserAction.setIcon({
      //       path: {
      //         '16': 'icons/icon_key_16.png',
      //         '48': 'icons/icon_key_48.png',
      //         '128': 'icons/icon_key_128.png'
      //       }
      //     })
      //   } else {
      //     chrome.browserAction.setIcon({
      //       path: {
      //         '16': 'icons/icon16.png',
      //         '19': 'icons/icon19.png',
      //         '48': 'icons/icon48.png',
      //         '128': 'icons/icon128.png'
      //       }
      //     })
      //   }
      // }
    }

    if (changeInfo.status == 'complete' && tab.active && tab.url != undefined) {
      var checkIfAuthNeeded = accessibleDomains.filter((d) => { var tempURL = new URL(tab.url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
      if (checkIfAuthNeeded.length > 0 && checkIfAuthNeeded[0]) {
        var tempURLData = new URL(tab.url);
        var hostNameData = tempURLData.hostname;
        var data = await mainAnalyticsDataStore('Browsing', localStorage.getItem('token'), { 'url': tab.url, isSubscribed: 'true', 'host': hostNameData })
      }
    }
  });
}


// keep a check on the removed tabs just in case we need to refresh token on tab removed

function tabsonRemoved() {
  chrome.tabs.onRemoved.removeListener(tabsonRemoved)
  chrome.tabs.onRemoved.addListener(async function (tabId, removeInfo) {
    if (removeInfo.windowId && removeInfo.isWindowClosing) {
      var data = await isRefreshTokenUpdated();
      chrome.tabs.sendMessage(tabId, { domainsList: JSON.stringify(accessibleDomains) });
    }
  });
}

// keep a check on the replaced tabs just in case we need to refresh token on tab replaced

function tabsonReplaced() {
  chrome.tabs.onReplaced.removeListener(tabsonReplaced)
  chrome.tabs.onReplaced.addListener(async function (addedTabId, removedTabId) {
    if (addedTabId && removedTabId) {
      var data = await isRefreshTokenUpdated();
      chrome.tabs.sendMessage(addedTabId, { domainsList: JSON.stringify(accessibleDomains) });
    }
  });
}


// keep a check on the highlighted/ selected tabs just in case we need to refresh token on tab highlighted/ selected

function tabsonHighlighted() {
  chrome.tabs.onHighlighted.removeListener(tabsonHighlighted)
  chrome.tabs.onHighlighted.addListener(async function (highlightInfo) {
    if (highlightInfo.windowId && highlightInfo.tabIds && highlightInfo.tabIds.length > 0) {
      chrome.tabs.get(highlightInfo.tabIds[0], function (data) {
        if (data.url && data.url.indexOf('app.myloft.xyz') > -1) {
          chrome.browserAction.disable();
        } else {
          chrome.browserAction.enable();
        }
      })
      var data = await isRefreshTokenUpdated();
      // chrome.tabs.sendMessage(tab.id, { domainsList: JSON.stringify(accessibleDomains) });
    }
  });
}



// keep a check on window max and min just in case we need to refresh token on window min and max

function onWindowFocusChangedListener() {
  chrome.windows.onFocusChanged.removeListener(onWindowFocusChangedListener)
  chrome.windows.onFocusChanged.addListener(async function (windowId) {
    if (windowId === -1) {
      // Assume minimized
      var data = await isRefreshTokenUpdated()
    } else {
      chrome.windows.get(windowId, async function (chromeWindow) {
        if (chromeWindow.state === "minimized") {
          // Window is minimized
          var data = await isRefreshTokenUpdated()
        } else {
          // Window is not minimized (maximized, fullscreen or normal)
          var data = await isRefreshTokenUpdated()
        }
      });
    }

  })
}

//just a small check for refreshtoken regular update status


async function isRefreshTokenUpdated() {
  var token = localStorage.getItem('token');
  var deviceId = localStorage.getItem('deviceId');

  if (token && deviceId) {
    var decodedToken = await parseJwt(token);
    var currentTime = new Date().getTime();
    if (decodedToken['exp'] < currentTime || ((decodedToken['iat'] * 1000) + 750000) < currentTime) {
      var refreshTokenData = await refreshToken();
      if (refreshTokenData) {
        if (refreshTokenData['success']) {
          return { 'success': true };
        } else {
          return { 'success': true };
        }
      } else {
        return { 'success': false };
      }
    } else {
      return { 'success': true };
    }
  } else {
    return { 'success': false };
  }
}

//chrome cookie listener for checking auth for first time or future re authentications

chrome.cookies.onChanged.addListener(function (changeInfo) {
  if (changeInfo.cookie) {
    if (changeInfo.cookie.name == "myloftTokenCook" && changeInfo.cookie.domain == ".myloft.xyz" && changeInfo.cause == "explicit") {
      if (!localStorage.getItem('token')) {
        if (changeInfo.cookie.value) {
          var tempToken = changeInfo.cookie.value;
          var parsedToken = parseJwt(tempToken);
          if (parsedToken['uId'] && parsedToken['aId'] && parsedToken['refreshToken']) {
            localStorage.setItem('token', tempToken);
            //authentication success
            var opt = {
              iconUrl: '../../icon.png',
              title: chrome.i18n.getMessage('notification_successfull_login'),
              type: 'basic',
              message: chrome.i18n.getMessage('notification_successfull_login_msg')
            }
            chrome.notifications.create('', opt);
            setMyLOFTIcon(true);
            sendMessagetoOptions();
            getListOfDomains().then((data) => {
              getlistOfTags();
              getlistOfCollections();
              getExceededLimits();
            });

            console.log('auth first time success')
          } else {

          }
        }
      }
    }
    if (changeInfo.cookie.name == "myloftLogout" && changeInfo.cookie.domain == ".myloft.xyz" && changeInfo.cause == "explicit") {
      if (changeInfo.cookie.value) {
        if (changeInfo.cookie.value == true || changeInfo.cookie.value == 'true') {
          //update logout query
          if (localStorage.getItem('token')) {
            var logoutData = logoutUser();
          }
        }
      }
    }
  }
})


//logout function 

async function logoutUser() {
  var querydata = JSON.stringify({ "query": "mutation{logout{msgId msg success}}" });
  var logoutData = await simpleFetchQuery(querydata, true, 'logout');
  localStorage.clear();
  clearProxySettings()
  globalRefreshTokenProcess = false;
  //reset global vars on local storage clear
  newTabMapJSON = {};
  previousTabId = 0;
  previousUrl = "";
  currentTabId = 0;
  currentUrl = "";
  accessibleDomains = [];
  instituteHostname = "";
  instituteIpAddress = "";
  instituteProxyPort = null;
  allTagsofUser = [];
  allCollectionsofUser = [];
  logoutchromeNotification(chrome.i18n.getMessage('notification_logout_success'));
  setMyLOFTIcon(false);
  return true;
}

// listener to check if auth is required for the proxy setup

chrome.webRequest.onAuthRequired.addListener(
  function (details) {
    var checkIfAuthNeeded = accessibleDomains.filter((d) => { var tempURL = new URL(details.url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });

    if (checkIfAuthNeeded.length > 0) {
      if (details.isProxy === true) {
        var authP = localStorage.getItem('token') ? localStorage.getItem('token') : "";
        var uid = parseJwt(authP).uId;
        return ({
          authCredentials: {
            'username': uid + '_' + defaultBrowserName,
            'password': authP
          }
        });
      } else {
        return;
      }
    } else {
      return;
    }

  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// chrome.webRequest.onAuthRequired.addListener(
//   function (details, callbackFn) {
//     var checkIfAuthNeeded = accessibleDomains.filter((d) => { var tempURL = new URL(details.url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });

//     if (checkIfAuthNeeded.length > 0) {
//       if (details.isProxy === true) {
//         var authP = localStorage.getItem('token') ? localStorage.getItem('token') : "";
//         var uid = parseJwt(authP).uId;
// console.log(uid);
// console.log(details)
//         callbackFn({
//           authCredentials: {
//             'username': uid + '_CHROME_EXTENSION',
//             'password': authP
//           }
//         });
//       } else {
//         return;
//       }
//     } else {
//       return;
//     }
//   },
//   { urls: ["<all_urls>"] },
//   ['asyncBlocking']
// );


//listener to help in informing the user about their usage

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.url && currentUrl) {
      var checkIfStatushasExpired = pdfArray.filter((d) => { var tempURL = new URL(details.url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
      var checkIfStatushasExpired2 = pdfArray.filter((d) => { var tempURL = new URL(currentUrl); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
      //set a message that the limit has expired
      if (checkIfStatushasExpired.length > 0 && checkIfStatushasExpired2.length > 0) {
        // chromeNotification('PDF Download Limit Reached', 'Please contact your library for further assistance')
        ///msg ends
        return { cancel: true };
      }
    }
  },
  { urls: ["http://*/*", "https://*/*"] },
  ["blocking"]
);


function chromeNotification(title, passMessage) {
  var opt = {
    iconUrl: '../../icon.png',
    title: title,
    type: 'basic',
    message: passMessage
  }
  chrome.notifications.create('', opt)
  return true;
}

function logoutchromeNotification(messageNot) {
  var opt = {
    iconUrl: '../../icon.png',
    title: 'MyLOFT',
    type: 'basic',
    message: messageNot
  }
  chrome.notifications.create('', opt)
  return true;
}

// listener to check if a PDF is downloaded and act accordinly

chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    var canAccessDomain = accessibleDomains.filter((d) => { var tempURL = new URL(details.url); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
    var globalFlagCDCheck = false;
    if (canAccessDomain.length > 0) {
      for (var key in details.responseHeaders) {
        if ((details.responseHeaders[key].name == "Content-Type") || (details.responseHeaders[key].name == "content-type")) {
          if ((details.responseHeaders[key].value == "application/pdf") || (details.responseHeaders[key].value == "application/x-pdf") || (details.responseHeaders[key].value == "application/pdf; charset=UTF-8")) {
            if (details.statusCode == 200) {
              globalFlagCDCheck = true;
              var localPreviousTimeStamp = globalCurrentTimestamp;
              var localCurrentTimeStamp = new Date().getTime();
              if (localCurrentTimeStamp > (localPreviousTimeStamp + 1000)) {
                localPreviousTimeStamp = localCurrentTimeStamp;
              }
              var localTabId = details.tabId;
              if (Object.keys(newTabMapJSON).length == 2) {
                if (newTabMapJSON.timestamp > (new Date().getTime() - 2000)) {
                  localTabId = newTabMapJSON.id;
                }
              }
              // console.log(details)
              sendRequesttoScrape(false, details.url, localTabId, canAccessDomain[0])
            }
          }
          else {
            let mimeType = details.responseHeaders[key].value;
            if (PDF_MIME_TYPES.includes(mimeType.toLowerCase())) {
              if (details.statusCode == 200) {
                var localPreviousTimeStamp = globalCurrentTimestamp;
                var localCurrentTimeStamp = new Date().getTime();
                if (localCurrentTimeStamp > (localPreviousTimeStamp + 1000)) {
                  localPreviousTimeStamp = localCurrentTimeStamp;
                }
                var localTabId = details.tabId;
                if (Object.keys(newTabMapJSON).length == 2) {
                  if (newTabMapJSON.timestamp > (new Date().getTime() - 2000)) {
                    localTabId = newTabMapJSON.id;
                  }
                }
                sendRequesttoScrape(false, details.url, localTabId, canAccessDomain[0])
              }
            }
          }
          // else if (details.responseHeaders[key].value == "application/octet-stream") {
          //   if (details.url.toLowerCase().indexOf(".pdf") > -1 || details.responseHeaders[key].value.toLowerCase().indexOf('.pdf') > -1) {
          //     if (details.statusCode == 200) {
          //       var localTabId = details.tabId;
          //       sendRequesttoScrape(false, details.url, localTabId, canAccessDomain[0])
          //     }
          //   }
          // }
          // else if (details.responseHeaders[key].value == "text/plain") {
          //   if (details.statusCode == 200) {
          //     if (details.frameId == 0) {
          //       if ((details.url.indexOf("wiley.com") > -1) && (details.url.indexOf("readcube.webviewer.downloadpdf") > -1)) {
          //         var localTabId = details.tabId;
          //         sendRequesttoScrape(false, localTabId, details.url)
          //       }
          //     }
          //   }
          // }
          // if(details.responseHeaders[key].value == "application/octet-stream"){
          //   if(details.url.includes('www.kuke.com')){
          //     details.responseHeaders[key].value = "text/html";
          //   }
          // }
        }
      }
      if (globalFlagCDCheck == false) {
        for (var key in details.responseHeaders) {
          if (details.responseHeaders[key].name.toLowerCase() == HEADER_CONTENT_DISPOSITION) {
            let disposition = details.responseHeaders[key].value;
            // Check content disposition filename
            let filename = getDispositionFilenameFromHeaderValue(disposition);
            if (filename !== false && filename.toLowerCase().includes('.pdf')) {
              if (details.statusCode == 200) {

                var localTabId = details.tabId;

                sendRequesttoScrape(false, details.url, localTabId, canAccessDomain[0])

              }
            }
          }
        }
      }
    }
  }, { urls: ["*://*/*"] },
  ["blocking", "responseHeaders"]
);


// Returns the filename found in content disposition header
function getDispositionFilenameFromHeaderValue(disposition) {
  let re = /; ?filename=(?:(?:\"(.*?)\")|([^;"]+))/i;
  let m = re.exec(disposition);
  if (m === null) {
    return false;
  }
  return m[1] !== undefined ? m[1] : m[2];
}

// function to refresh the current token when it has expired

async function refreshToken() {

  if (globalRefreshTokenProcess == false) {
    globalRefreshTokenProcess = true;
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
          var tagdata = await getlistOfTags();
          var domainData = await getListOfDomains();
          var colData = await getlistOfCollections();
          var domainData = await getExceededLimits();
        }
        globalRefreshTokenProcess = false;
        return { 'success': true }
      } else {
        if (data.msgId) {
          if (data.msgId == "FAILEDREQ") {
            globalRefreshTokenProcess = false;
            return { 'success': false }
          }
        }
        if (data.token == null || !data.token) {
          localStorage.clear();
          globalRefreshTokenProcess = false;
          //reset global vars on local storage clear
          newTabMapJSON = {};
          previousTabId = 0;
          previousUrl = "";
          currentTabId = 0;
          currentUrl = "";
          accessibleDomains = [];
          instituteHostname = "";
          instituteIpAddress = "";
          instituteProxyPort = null;
          allTagsofUser = [];
          allCollectionsofUser = [];
          //also reset proxy
          clearProxySettings()
          return { 'success': false }
        }
        globalRefreshTokenProcess = false;
        return { 'success': false }
      }

    } catch (error) {
      console.log(error)
      globalRefreshTokenProcess = false;
      return { 'success': false }
    }
  } else {
    var globalCheckInterval = setInterval(() => {
      if (globalRefreshTokenProcess == false) {
        clearInterval(globalCheckInterval);
        return { 'success': true }
      }
    }, 3000)
  }
}



chrome.proxy.onProxyError.addListener(function (details) {

})

//chrome extensions inbuilt message passing listener

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {

  if (request.refreshToken) {

  }

  if (request.refreshTokenwithgetArticle) {
    try {
      var data = await refreshToken();
      sendRequesttoScrape(true);
    } catch (err) {
      somethingWentWrongNoti()
      console.log('Something went wrong , please retry');
    }

  }

  if (request.getArticleOnly) {
    sendRequesttoScrape(true);
  }

  if (request.readableArticleData) {

    //add article now 
    var articleJsonData = JSON.parse(request.readableArticleData);
    addArticle(articleJsonData);
  }


  if (request.getMyTags) {
    sendResponse({
      response: allTagsofUser
    });
  }

  if (request.getMyCollections) {
    sendResponse({
      response: allCollectionsofUser
    })
  }

  if (request.saveTags) {
    taggingChecker(request.saveTags);
  }

  if (request.report_myloft) {
    sendReports(request.report_myloft)
  }

  if (request.search_report) {
    searchKeywordAnalytics(request.search_report)
  }

  if (request.logoutFromOptions) {
    globalRefreshTokenProcess = false;
    //reset global vars on local storage clear
    newTabMapJSON = {};
    previousTabId = 0;
    previousUrl = "";
    currentTabId = 0;
    currentUrl = "";
    accessibleDomains = [];
    instituteHostname = "";
    instituteIpAddress = "";
    instituteProxyPort = null;
    allTagsofUser = [];
    allCollectionsofUser = [];
  }

  if (request.getDomainsListing) {
    getListOfDomains();
  }
});


//getting all data from search keywrod report

async function searchKeywordAnalytics(jsonData) {
  if (localStorage.getItem('token')) {
    var data = await mainAnalyticsDataStore('SearchKeyword', localStorage.getItem('token'), { 'keyword': jsonData.keyword, 'source': jsonData.source, 'searchEngine': jsonData.searchEngine })
  }
}

async function articleSavedAnalytics(jsonData) {
  if (localStorage.getItem('token')) {
    var data = await mainAnalyticsDataStore('ArticleSave', localStorage.getItem('token'), { 'name': jsonData.name, 'url': jsonData.url, 'hasTemplate': String(jsonData.hasTemplate), 'doi': jsonData.doi, 'viaReadability': String(jsonData.viaReadability), 'isReadable': String(jsonData.isReadable), 'source': 'Browser', 'type': jsonData.type })
  }
}


function taggingChecker(tagsD) {
  var localId = tagsD.id;
  var localTags = tagsD.list;
  var localUrl = tagsD.url;
  if (localTags.length > 0) {
    // check if article has already been added
    var articleIdCheck = localStorage.getItem(localId);
    if (articleIdCheck) {
      var articleIdData = JSON.parse(articleIdCheck);
      var articleIdFinal = articleIdData.id;
      addTagstoArticle(localTags, articleIdFinal);

    } else {
      var encUrl = window.btoa(localUrl + "_TAGS")
      localStorage.setItem(encUrl, JSON.stringify(localTags))

    }
  }
  var localCol = tagsD.collection;
  var localIdCol = tagsD.idCol;
  if (localCol) {
    // check if article has already been added
    var articleIdCheck = localStorage.getItem(localIdCol);
    if (articleIdCheck) {
      //add collection to article
      var articleIdD = JSON.parse(articleIdCheck);
      var articleIdFinal = articleIdD.id;
      var colIdtoReplace = articleIdD.colId;
      var articlesTitle = articleIdD.title;
      if (articleIdFinal && colIdtoReplace) {
        addCollectiontoArticle(localCol, articleIdFinal, colIdtoReplace, articlesTitle)
      }
    }
  } else {
    var encColl = window.btoa(localUrl + "_COLLECTION")
    localStorage.setItem(encColl, localCol)
  }
}


function sendRequesttoScrape(scrapeHTML, tabURL, tabId, domainName) {
  if (scrapeHTML) {
    //get current tab first 
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currentTabUrl = tabs[0].url;
      chrome.tabs.sendMessage(tabs[0].id, {
        tabId: tabs[0].id, tabUrl: currentTabUrl, report_url: currentTabUrl, articleType: "HTML"
      });
    });
  } else {

    updateProxyPDFStatus(domainName);
    var doifromURL = getDOIFromURL(tabURL);
    if (!doifromURL || doifromURL == undefined) {
      var dntDomainsPDF = dntArrayPDFs.filter((dataIs) => { return tabURL.includes(dataIs) })
      if (dntDomainsPDF.length == 0) {
        chrome.tabs.sendMessage(tabId, {
          report_url: tabURL, articleType: "PDF"
        });
      } else {
        var reportData = { 'title': '', 'doi': null, 'articleType': 'PDF', 'url': tabURL, 'biblioData': {} }
        sendReports(reportData, 'PDF')
      }
    } else {
      var reportData = { 'title': '', 'doi': doifromURL, 'articleType': 'PDF', 'url': tabURL, 'biblioData': {} }
      sendReports(reportData, 'PDF')
    }
  }
}


//function to send data to reporting api

async function sendReports(reportData, articleType) {
  try {
    var title = '';
    //check if we need to refresh token
    var data = await isRefreshTokenUpdated();
    if (data['success']) {
      var localURL = reportData.url;
      var currentSessId = await generateUUID();
      //get session id from local
      // var currentSessId = "";
      var localStorageSess = localStorage.getItem('sessionId');
      if (localStorageSess) {
        var parsedSession = JSON.parse(localStorageSess);
        if (parsedSession) {
          if (parsedSession['ts']) {
            var currentTimestamp = new Date().getTime();
            if ((currentTimestamp - parsedSession['ts']) < 750000) {
              currentSessId = parsedSession['id'];
            } else {
              localStorage.setItem('sessionId', JSON.stringify({ 'ts': new Date().getTime(), 'id': currentSessId }))
            }
          } else {
            localStorage.setItem('sessionId', JSON.stringify({ 'ts': new Date().getTime(), 'id': currentSessId }))
          }
        } else {
          localStorage.setItem('sessionId', JSON.stringify({ 'ts': new Date().getTime(), 'id': currentSessId }))
        }
      } else {
        localStorage.setItem('sessionId', JSON.stringify({ 'ts': new Date().getTime(), 'id': currentSessId }))
      }
      //check if domain is in my list to report
      var accDomain = accessibleDomains.filter((d) => { var tempURL = new URL(localURL); var hostname = tempURL.hostname; return hostname.includes(d) && hostname.endsWith(d) });
      if (accDomain.length > 0) {
        if (articleType && articleType == 'PDF') {
          articleSavedAnalytics(
            {
              'name': title ? title : '',
              'url': reportData.url,
              'doi': reportData.doi,
              'type': 'PDF',
              'hasTemplate': false,
              'viaReadability': false,
              'isReadable': false
            }
          )
        }
        var customJSON = {};
        var timeStamp = new Date().getTime();
        var today = new Date().setHours(0, 0, 0, 0);
        customJSON['timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
        customJSON['sessionID'] = "BROWSER_SESS_" + currentSessId;
        customJSON['domain'] = accDomain[0];
        customJSON['articleURL'] = reportData.url;
        customJSON['device'] = deviceName;
        customJSON['platform'] = platformName;
        customJSON['doi'] = reportData.doi;
        customJSON['articleReportType'] = "article_saved";
        customJSON['type'] = reportData.articleType;
        customJSON['biblioData'] = reportData.biblioData;
        customJSON['ts'] = timeStamp;
        customJSON['date'] = today;
        var reportResponse = await simpleHTTPReportQuery(customJSON);
        return { 'success': true };
      } else {
        return { 'success': false };
      }
    } else {
      return { 'success': false };
    }
  } catch (error) {
    console.log(error)
    return { 'success': false };
  }
}


//reporting http query

async function simpleHTTPReportQuery(reportData) {

  try {
    var url = "https://reporting.myloft.xyz/api/report/add"
    var localBodyReportData = reportData;
    var settings = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Device': deviceName,
        'X-Authorization': localStorage.getItem('token')
      },
      body: JSON.stringify(localBodyReportData)
    };

    var responseData = await fetch(url, settings)
      .then(response => response.json())
      .then(json => {
        return json;
      })
      .catch(e => {
        console.log(e)
        return { 'success': false, 'msgId': "FAILEDREQ" }
      })

    if (responseData['success']) {
      return { 'success': true }
    } else {
      if (responseData['msgId'] == "INVALIDTOKEN") {
        var refreshTokenData = await refreshToken();
        if (refreshTokenData['success']) {
          var reportingData = await simpleHTTPReportQuery(localBodyReportData);
          if (reportingData['success']) {
            return { 'success': true }
          } else {
            return { 'success': false }
          }
        } else {
          return { 'success': false }
        }
      } else {
        return { 'success': false }
      }
    }
  } catch (error) {
    console.log(error)
    return { 'success': false }
  }
}

//function to get doi from url 

function getDOIFromURL(pageURL) {
  if (pageURL) {
    pageURL = decodeURIComponent(pageURL);
    if (pageURL.endsWith(".pdf")) {
      pageURL = pageURL.replace('.pdf', '');
    }
    if (pageURL.match(findDoi)) {
      return pageURL.match(findDoi)[0]
    }
    else if (pageURL.match(findDoiURL)) {
      return pageURL.match(findDoiURL)[0]
    }
    else {
      return null;
    }
  }
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
        'X-Device': deviceName
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


// function for anayltics engine


async function reportingFetchQuery(queryData, withAuth) {
  var localTempData = queryData;
  var localAuthStatus = withAuth;
  // var localQueryName = queryName;
  var url = "https://reporting.myloft.xyz/api/analytics/add";
  var deviceId = localStorage.getItem('deviceId');
  try {
    var settings = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-DeviceID': deviceId,
        'X-Device': deviceName
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

    if (data['data'][queryName]['msgId'] == "INVALIDTOKEN") {
      //refresh token first as msg received from server says invalid token
      var refreshTokenNow = await refreshToken();
      if (refreshTokenNow['success']) {
        var reData = await reportingFetchQuery(localTempData, localAuthStatus);
        return reData;
      } else {
        return { 'success': false, 'msgId': "FAILEDREQ" }
      }
    } else {
      return data['data'][queryName];
    }
  } catch (err) {
    return { 'success': false, 'msgId': "FAILEDREQ" }
  }
}

async function mainAnalyticsDataStore(event_name, token, jsonData) {
  var version = chrome.runtime.getManifest().version;
  var paramJSON = {
    "event_name": event_name,
    "device": deviceName,
    "platform": platformName,
    "event_ts": new Date().getTime(),
    'token': token,
    'params': {},
    'appVersion': version
  }

  for (var key in jsonData) {
    paramJSON['params'][key] = jsonData[key]
  }
  var paramArray = [];
  paramArray.push(paramJSON);
  var stringfiedArray = JSON.stringify(paramArray)
  //get from local storage / update and save to localstorage
  var eventData = localStorage.getItem(event_name + '_analytics');
  if (eventData) {
    var parsedEventData = JSON.parse(eventData);
    var mergedData = parsedEventData.concat(paramArray);
    var stringfiedMergedData = JSON.stringify(mergedData);
    localStorage.setItem(event_name + '_analytics', stringfiedMergedData)
  }
  else {
    localStorage.setItem(event_name + '_analytics', []);
    localStorage.setItem(event_name + '_analytics', stringfiedArray);
  }
  return true;
}

// function to get list of all tags

async function getlistOfTags() {
  var queryData = JSON.stringify({
    "query": "query{getTags(orderBy:name_ASC){data{id name} msg msgId success}}"
  });
  try {
    var tagData = await simpleFetchQuery(queryData, true, 'getTags');
    if (tagData['success']) {
      allTagsofUser = tagData['data'].map((singleTag) => {
        return singleTag['name']
      })
      return { 'success': true }
    } else {
      return { 'success': false }
    }

  } catch (error) {
    console.log(error);
    return { 'success': false }
  }
}

//function to get list of all collections

async function getlistOfCollections() {
  var queryData = JSON.stringify({
    "query": "query{ getCollections(order:title_ASC){data{id title} msg msgId success}}"
  });
  try {
    var collectionsData = await simpleFetchQuery(queryData, true, 'getCollections');
    if (collectionsData['success']) {
      allCollectionsofUser = collectionsData['data'];
      return { 'success': true }
    } else {
      return { 'success': false }
    }

  } catch (error) {
    console.log(error);
    return { 'success': false }
  }
}

// function to get all domains users can access

async function getListOfDomains() {
  //temp test to check if local usage policy url is opening or not



  var queryData = JSON.stringify({
    "query": "query{getMyDomainsForUsers{msgId msg success ip instituteData{ remotexsHostName instituteProxyIP instituteProxyPort} data}}"
  });
  try {

    var netqueryData = JSON.stringify({
      "query": "query{getCampusAccessType{data{ip type} msg msgId success}}"
    });
    var networkData = await simpleFetchQuery(netqueryData, true, 'getCampusAccessType');
    if (networkData) {
      // console.log(netqueryData)
      if (networkData['success']) {
        if (networkData.data.type == "ON_CAMPUS") {
          isOnCampus = true;
          clearProxySettings();
        } else {
          isOnCampus = false;
        }
      }
    }

    var recData = await simpleFetchQuery(queryData, true, 'getMyDomainsForUsers');
    if (recData['success']) {

      //check if usage policy is accepted -- this code has been commented till finalized ;

      // if (recData['msgId'] == "GETMYDOMAINS001_USAGEPOLICY") {
      //   //send to policy acceptance page

      //   chrome.tabs.getAllInWindow(undefined, function (tabs) {
      //     var policyTabPage = false;
      //     for (var i = 0, tab; tab = tabs[i]; i++) {
      //       if (tab.url && tab.url.includes('src/usagepolicy/usage_policy.html')) {
      //         policyTabPage = true;
      //         break;
      //       }
      //     }
      //     if (!policyTabPage) {
      //       chrome.tabs.create({ url: chrome.runtime.getURL("src/usagepolicy/usage_policy.html") });
      //     }
      //   });

      // }

      var domainsList = recData['data'];
      accessibleDomains = domainsList;
      if (recData['instituteData']) {
        instituteHostname = recData['instituteData']['remotexsHostName'];
        instituteIpAddress = recData['instituteData']['instituteProxyIP'];
        instituteProxyPort = recData['instituteData']['instituteProxyPort']

        var hostName = instituteHostname.replace('https://', '')
        if (hostName && instituteIpAddress && instituteProxyPort) {
          ///my ip address here
          var pubIPAddress = recData['ip'];
          accessibleDomains.push('ping.myloft.xyz');
          pacFileCreator(accessibleDomains, instituteIpAddress, instituteProxyPort, hostName)
        } else {
          instituteHostname = "";
          instituteIpAddress = "";
          instituteProxyPort = null;
          clearProxySettings();
        }
      } else {
        instituteHostname = "";
        instituteIpAddress = "";
        instituteProxyPort = null;
        clearProxySettings();
      }
      //send domain list to reporting sript if needed
      return { 'success': true }

    }
  } catch (error) {
    clearProxySettings()
    // pacFileCreator(["example.com"], '', 0000)
    return { 'success': false }
  }

}


//clear proxy settings

function clearProxySettings() {
  chrome.proxy.settings.clear({ scope: 'regular' },
    function (data) {
      return { 'success': true }
    }
  );
}


// funtion to generate the pac file dynamically based on domains and inst hostname

function pacFileCreator(domains, proxyURL, instituteProxyPort, hostName) {
  var startString = "function FindProxyForURL(url, host) {\n";
  var endString = "  return 'DIRECT';\n" + "}"
  var middleString = "";
  var finalPACString = "";
  var domainArray = [];
  var domainArrayEachString = "";
  for (var key in domains) {
    domainArrayEachString = "*://*." + domains[key] + "/*";
    domainArray.push(domainArrayEachString);
    middleString = middleString + "  if (shExpMatch(host,'*." + domains[key] + "'))\n" + "    return 'PROXY " + proxyURL + ":" + instituteProxyPort + "';\n" + "  if (shExpMatch(host,'" + domains[key] + "'))\n" + "    return 'PROXY " + proxyURL + ":" + instituteProxyPort + "';\n"
  }
  finalPACString = startString + middleString + endString;
  configureProxyonAuth(finalPACString)
}


// set the proxy based on the pac file

function configureProxyonAuth(pacFileData) {

  if (!isOnCampus) {

    var config = {
      mode: "pac_script",
      pacScript: {
        data: pacFileData,
        mandatory: true
      }
    };
    chrome.proxy.settings.set(
      { value: config, scope: 'regular' },
      function () {

      });

  }
}

// external message listener for web app
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message == 'version') {
      const manifest = chrome.runtime.getManifest();
      sendResponse({
        type: 'success',
        version: manifest.version
      });
      return true;
    }
    if (message == 'device') {
      generateUUID().then((newId) => {
        localStorage.setItem('deviceId', newId);
        sendResponse({
          type: 'success',
          device: newId
        });
      })
      return true;
    }

    if (message == 'loginStatus') {
      var token = localStorage.getItem('token');
      if (token) {
        sendResponse({
          type: 'success',
          loggedIn: true
        });
      } else {
        generateUUID().then((newId) => {
          localStorage.setItem('deviceId', newId);
          sendResponse({
            type: 'success',
            device: newId,
            loggedIn: false
          });
        })
      }
      return true;
    }
    return false;
  }
);

chrome.runtime.onInstalled.addListener(() => {
  var deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    generateUUID().then((data) => {
      localStorage.setItem('deviceId', data);
      var token = localStorage.getItem('token')
      if (!token) {
        chrome.tabs.create({ url: 'https://app.myloft.xyz/user/login?deviceId=' + data });
      }
    })
  } else {
    chrome.tabs.create({ url: 'https://app.myloft.xyz/user/login?deviceId=' + deviceId });
  }
})

var myNotificationID = null;
var currentlySavedArticleId = "https://app.myloft.xyz/";
var isReadableArticle = true;
var currentlySavedArticleUrl = "https://app.myloft.xyz/";

//function to add article data;

async function addArticle(articleData) {
  try {
    var title = articleData.title;
    var isReadable = articleData.readable;
    var imageUrl = "";
    if (articleData.image) {
      imageUrl = articleData.image;
    }
    var contentURL = articleData.url;
    var htmlData = "";
    if (articleData.html) {
      htmlData = articleData.html;
    }
    var articleType = 'HTML';
    var doiNumber = '';
    if (articleData.doi && articleData.doi != undefined) {
      doiNumber = articleData.doi;
    }

    var variables = {
      'title': title,
      'imageURL': imageUrl,
      'isReadable': isReadable,
      'contentURL': contentURL,
      'htmlData': htmlData,
      'toDeflate': true,
      'articleType': articleType,
      'doi': doiNumber,
      'pdfURL': articleData.pdf ? articleData.pdf : ''
    }
    var queryData = JSON.stringify({
      "query": "mutation($title: String!,$imageURL: String!, $isReadable: Boolean!,$contentURL: String!, $htmlData: String!, $articleType:ArticleType!, $toDeflate: Boolean, $doi: String, $pdfURL: String){addArticle(title:$title,imageURL:$imageURL,isReadable:$isReadable,url:$contentURL,contentURL:$contentURL,html:$htmlData,type:$articleType,toDeflate:$toDeflate, doi: $doi, pdfURL: $pdfURL){msgId data{ id isReadable url collection{id} } msg success} }", "variables": variables
    });

    var articleResponseData = await simpleFetchQuery(queryData, true, 'addArticle');
    if (articleResponseData['success']) {
      var customJSONDataforArticleSaved = {
        'name': title,
        'url': contentURL,
        'hasTemplate': articleData.hasTemplate,
        'viaReadability': articleData.isReadabilityContent,
        'isReadable': isReadable,
        'doi': articleData.doi,
        'type': 'HTML'
      }
      articleSavedAnalytics(customJSONDataforArticleSaved);

      var articleId = articleResponseData['data']['id'];
      currentlySavedArticleId = articleId;
      var articleTitle = articleResponseData['data']['title'] ? articleResponseData['data']['title'] : title;
      currentlySavedArticleUrl = articleResponseData['data']['url'];
      isReadableArticle = articleResponseData['data']['isReadable'];

      var opt = {
        iconUrl: '../../icon.png',
        title: chrome.i18n.getMessage('article_success'),
        type: 'basic',
        message: title
      }
      chrome.notifications.create('', opt, function (id) {
        myNotificationID = id;
      })
      //save the base64 of the URL of the saved article
      var encUrl = window.btoa(contentURL + "_TAGS")
      var checkTaginLocal = localStorage.getItem(encUrl);
      if (!checkTaginLocal) {
        localStorage.setItem(window.btoa(contentURL + "_ARTICLE"), JSON.stringify({ 'id': articleId }));
      } else {
        var localTagstoAdd = JSON.parse(checkTaginLocal);
        addTagstoArticle(localTagstoAdd, articleId)
      }

      var encColl = window.btoa(contentURL + "_COLLECTION")
      var checkColinLocal = localStorage.getItem(encColl);
      var currentCollectionId = articleResponseData['data']['collection'][0]['id'];
      if (checkColinLocal && checkColinLocal != 'null' && checkColinLocal != null && checkColinLocal != undefined) {
        var localColtoAdd = checkColinLocal;
        addCollectiontoArticle(localColtoAdd, articleId, currentCollectionId, articleTitle);
      } else {
        localStorage.setItem(window.btoa(contentURL + "_ARTICLE_COLLECTION"), JSON.stringify({ 'id': articleId, 'colId': currentCollectionId, 'title': articleTitle }));
      }

    } else {
      if (articleResponseData['msgId'] == "ARTICLEADD004") {
        //alloow adding tags and collection for already present article 

        var articleId = articleResponseData['data']['id'];
        currentlySavedArticleId = articleId;
        var articleTitle = articleResponseData['data']['title'] ? articleResponseData['data']['title'] : title
        currentlySavedArticleUrl = articleResponseData['data']['url'];
        isReadableArticle = articleResponseData['data']['isReadable'];
        var opt = {
          iconUrl: '../../icon.png',
          title: chrome.i18n.getMessage('article_present'),
          type: 'basic',
          message: title
        }
        chrome.notifications.create('', opt, function (id) {
          myNotificationID = id;
        })

        //save the base64 of the URL of the saved article
        var encUrl = window.btoa(contentURL + "_TAGS")
        var checkTaginLocal = localStorage.getItem(encUrl);
        if (!checkTaginLocal) {
          localStorage.setItem(window.btoa(contentURL + "_ARTICLE"), JSON.stringify({ 'id': articleId }));
        } else {
          var localTagstoAdd = JSON.parse(checkTaginLocal);
          addTagstoArticle(localTagstoAdd, articleId)
        }

        var encColl = window.btoa(contentURL + "_COLLECTION")
        var checkColinLocal = localStorage.getItem(encColl);
        var currentCollectionId = articleResponseData['data']['collection'][0]['id'];
        if (checkColinLocal && checkColinLocal != 'null' && checkColinLocal != null && checkColinLocal != undefined) {
          var localColtoAdd = checkColinLocal;
          addCollectiontoArticle(localColtoAdd, articleId, currentCollectionId, articleTitle)
        } else {
          localStorage.setItem(window.btoa(contentURL + "_ARTICLE_COLLECTION"), JSON.stringify({ 'id': articleId, 'colId': currentCollectionId, 'title': articleTitle }));
        }
      }
      else {
        somethingWentWrongNoti()
        console.log('Something went wrong and hence the article could not be added')
      }
    }

  } catch (error) {
    somethingWentWrongNoti()
    console.log(error)
    console.log('Something went wrong')
  }
}


/* Respond to the user's clicking one of the buttons */
chrome.notifications.onClicked.addListener(function (notifId, ) {
  if (notifId === myNotificationID) {

    if (isReadableArticle) {
      window.open("https://app.myloft.xyz/browse/article/" + currentlySavedArticleId);
    } else {
      window.open(currentlySavedArticleUrl);
    }
  }
});


function somethingWentWrongNoti() {
  var opt = {
    iconUrl: '../../icon.png',
    title: chrome.i18n.getMessage('something_went_wrong'),
    type: 'basic',
    message: 'Please try again'
  }
  chrome.notifications.create('', opt)
}

async function addTagstoArticle(tagsNameArray, articleId) {

  var variables = {
    "articleId": articleId,
    "tagNames": tagsNameArray,
    "nameOnly": true
  }

  var queryData = JSON.stringify({ "query": "mutation($articleId: String!, $tagNames:[String!], $nameOnly: Boolean ){addArticleTags(articleID: $articleId, tagNames: $tagNames, nameOnly: $nameOnly){data{ id } msg msgId success}}", "variables": variables });

  try {
    var tagsResponseData = await simpleFetchQuery(queryData, true, 'addArticleTags');
    if (tagsResponseData) {
      if (tagsResponseData['success']) {
        return { 'success': true }
      } else {
        return { 'success': false }
      }
    } else {
      return { 'success': false }
    }

  } catch (error) {
    return { 'success': false }
  }
}

//function to add the required colletion to the article 


async function addCollectiontoArticle(newId, articleId, oldId, articleTitle) {
  var variables = {
    "articleId": articleId,
    "nCol": newId,
    "oCol": oldId,
    "title": articleTitle
  }

  var queryData = JSON.stringify({ "query": "mutation($articleId: String!,$nCol: String!, $oCol: String!, $title:String ){editArticleCollection(id:$articleId , newCollectionID:$nCol,currentCollectionID:$oCol, title:$title){msgId data{id} success msg}}", "variables": variables });

  try {
    var colResponseData = await simpleFetchQuery(queryData, true, 'editArticleCollection');
    if (colResponseData) {
      if (colResponseData['success']) {
        return { 'success': true }
      }
    }
    return { 'success': false }

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


//function to decode a jwt token
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
};

//get limits

async function getExceededLimits() {
  if (instituteHostname) {
    try {
      var url = instituteHostname + "/api/user/exceed";
      var settings = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Authorization': localStorage.getItem('token')
        }
      };
      var responseData = await fetch(url, settings)
        .then(response => response.json())
        .then(json => {
          return json;
        })
        .catch(e => {
          console.log(e)
          return { 'success': false, 'msgId': "FAILEDREQ" }
        })
      if (responseData['success']) {
        pdfArray = responseData['domains']
        return { 'success': true };

      } else {
        return { 'success': false };
      }

    } catch (error) {
      return { 'success': false }
    }
  } else {
    return { 'success': false }
  }
}


async function updateProxyPDFStatus(domain) {
  try {
    if (instituteHostname) {
      var url = instituteHostname + "/api/pdf/update";
      var localDomain = domain;
      var bodyData = {};
      bodyData[domain] = 1;
      var settings = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify(bodyData)
      };

      var responseData = await fetch(url, settings)
        .then(response => response.json())
        .then(json => {
          return json;
        })
        .catch(e => {
          console.log(e)
          return { 'success': false, 'msgId': "FAILEDREQ" }
        })

      if (responseData) {
        if (responseData['success']) {
          return { 'success': true };
        } else {
          if (responseData['msgId'] == "INVALIDTOKEN") {
            var refreshTokenData = await refreshToken();
            if (refreshTokenData['success']) {
              var ReresponseData = await updateProxyPDFStatus(localDomain);
              if (ReresponseData['success']) {
                return { 'success': true };
              }
            }
          }
        }
      }
      return { 'success': false };
    } else {
      return { 'success': false };
    }
  } catch (error) {
    return { 'success': false };
  }
}

//Dev: Vineet Deshpande
//Author : Eclat Engineering Pvt. Ltd.
//Copyright Eclat Engineering Pvt. Ltd.