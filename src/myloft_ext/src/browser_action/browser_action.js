//global tag list var
var tagsList = []

//current article url

var currentArticleURL = "";


// current article tags 

var currentArticleTagsList = [];

// selected article collection

var selectedCollectionId = null;

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
    //first check if user is authenticated or not , if not then redirect to login page.

    //do basic check with token from localStorage;
    var currentToken = localStorage.getItem('token');
    if (currentToken && currentToken != undefined && currentToken.length > 0) {
        //user has authenticated before;
        chrome.tabs.getSelected(null, function (tab) {

            var checkCurrentURL = tab
            if (checkCurrentURL.url) {
                var checkURL = is_url(checkCurrentURL.url);
                if (checkURL) {
                    currentArticleURL = checkCurrentURL.url;
                    setPopupTitle(checkCurrentURL.title);
                    var decodedToken = parseJwt(currentToken);
                    var currentTime = new Date().getTime();
                    if (decodedToken['exp'] <= currentTime) {
                        //refresh token first and then other requests should follow;
                        chrome.runtime.sendMessage({ refreshTokenwithgetArticle: true })
                        loadTags();
                    } else {
                        //no need to refresh token
                        chrome.runtime.sendMessage({ getArticleOnly: true })
                        loadTags();
                    }
                } else {
                    //invalid url or chrome blank page opened , go to web app;
                    chrome.tabs.create({ url: 'https://app.myloft.xyz/' });
                }
            } else {
                chrome.tabs.create({ url: 'https://app.myloft.xyz/' });
            }
        })
    }
    else {
        //request user to login;
        //send to app.myloft.xyz login page
        var deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            generateUUID().then((data) => {
                localStorage.setItem('deviceId', data);
                chrome.tabs.create({ url: 'https://app.myloft.xyz/user/login?deviceId=' + data });
            })
        } else {
            chrome.tabs.create({ url: 'https://app.myloft.xyz/user/login?deviceId=' + deviceId });
        }

    }
}

function setPopupTitle(title) {
    $('#popup_title').text(title)
    return true;
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


function loadTags() {

    // Shorthand for $( document ).ready()
    $(function () {
        console.log("ready!");
        loadTagify()
    });
}



function loadTagify() {

    //load initital white list and then update it;


    var $input = $('input[name=tags-jquery]').tagify(
        {
            'whitelist': [],
            'pattern': /^.{2,128}$/,
            'maxTags': 10
        }
    ).on('add', function (e, tagName) {
        currentArticleTagsList.push(tagName['value']);
    }).on("remove", function (e, tagName) {
        for (var i = 0; i < currentArticleTagsList.length; i++) {
            if (currentArticleTagsList[i] === tagName['value']) {
                currentArticleTagsList.splice(i, 1);
            }
        }

    }).on("invalid", function (e, tagName) {
    });

    var jqTagify = $input.data('tagify');

    //once api call is completed update the whitelst;
    //load tags from api here
    chrome.runtime.sendMessage({ getMyTags: true }, (response) => {
        if (response.response) {
            var whitelistTags = response.response;
            jqTagify.settings.whitelist = whitelistTags;
        }
    })

    chrome.runtime.sendMessage({ getMyCollections: true }, (response) => {
        if (response.response) {
            var whitelistCollections = response.response;
            $('.ui.search').search({
                source: whitelistCollections, searchFields: ['title'], fullTextSearch: false, onSelect: (coldata) => {
                    if (coldata['id']) {
                        selectedCollectionId = coldata['id']
                    }
                }
            });
            // var modifiedColArray = whitelistCollections.map((data) => {
            //     var json = {};
            //     json['name'] = data.title;
            //     json['value'] = data.id;
            //     return json
            // })
            // console.log(modifiedColArray)
            // $('.ui.search.dropdown').dropdown({
            //     values: modifiedColArray,
            //     transition: 'drop',
            //     minCharacters: 3,
            //     placeholder: 'Search and Select a Collection ...'
            // });
        }
    });
    onSave();
}


function onSave() {
    //get all tags from current article tags list array;
    //now assign these tags to the article by sending them to the background js
    $("#saveButton").click(function () {
        var encUrl = window.btoa(currentArticleURL + "_ARTICLE");
        var encUrlCol = window.btoa(currentArticleURL + "_ARTICLE_COLLECTION");
        chrome.runtime.sendMessage({ saveTags: { id: encUrl, url: currentArticleURL, list: currentArticleTagsList, idCol: encUrlCol, collection: selectedCollectionId } }, (response) => {
        });
        setTimeout(function () {
            currentArticleTagsList = [];
            selectedCollectionId = null;
            window.close();
        }, 500)
    });

}

//function to decode a jwt token
function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
};

//function to check if the url is valid or not
function is_url(str) {
    regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (regexp.test(str)) {
        return true;
    }
    else {
        return false;
    }
}


(function () {

    window.addEventListener('load', function () {
        var needsTranslation = document.querySelectorAll("[data-i18n]"),
            t = chrome.i18n.getMessage;
        for (var i = 0, l = needsTranslation.length; i < l; i++) {
            if (needsTranslation[i]) {
                // console.log(needsTranslation[i]);
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

//Dev: Vineet Deshpande
//Author : Eclat Engineering Pvt. Ltd.
//Copyright Eclat Engineering Pvt. Ltd.