//om message listener for content / injectedjs

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

	if (request.fathom) {
		chrome.runtime.sendMessage({ readableArticleData: request.fathom }, (response) => {

		});
	}
	if (request.tabUrl) {
		//send the dom of the page for processing
		var bodyDom = document.documentElement.outerHTML;
		var sendobject = {
			tabid: request.tabId,
			url: request.tabUrl,
			dom: bodyDom,
			platform: "CHROMEEXTENSION",
			deviceType: "desktop"
		}
		chrome.runtime.sendMessage({ sendobject_msg: sendobject }, (response) => {
			//reqData also allowed in future
		});

	}
})

// setInterval(() => {
// 	var session = sessionStorage.getItem('wfhowes');
// 	if (location.href.indexOf('rbdigitalglobal.com') > -1 && session != null) {
// 		var cookieName = 'britishcouncil';
// 		var cookieValue = session;
// 		var myDate = new Date();
// 		myDate.setHours(myDate.getHours() + 12);
// 		document.cookie = cookieName + "=" + cookieValue + ";expires=" + myDate
// 			+ ";domain=britishcouncil.rbdigitalglobal.com;path=/"
// 	}
// 	if (!session && location.href.indexOf('rbdigitalglobal.com') > -1) {

// 		var cookieIs = getCookie('britishcouncil');
// 		sessionStorage.setItem('wfhowes', cookieIs);
// 	}
// }, 1000)


// function getCookie(cname) {
// 	var name = cname + "=";
// 	var decodedCookie = decodeURIComponent(document.cookie);
// 	var ca = decodedCookie.split(';');
// 	for (var i = 0; i < ca.length; i++) {
// 		var c = ca[i];
// 		while (c.charAt(0) == ' ') {
// 			c = c.substring(1);
// 		}
// 		if (c.indexOf(name) == 0) {
// 			return c.substring(name.length, c.length);
// 		}
// 	}
// 	return "";
// }


//Dev: Vineet Deshpande
//Author : Eclat Engineering Pvt. Ltd.
//Copyright Eclat Engineering Pvt. Ltd.