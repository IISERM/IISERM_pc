//below is default null response for scraper

var defaultNullResponse = { 'success': false, 'doi': null, 'data': {} };

//my doi checks below
var findDoi = /\b(10[.][0-9]{3,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/ig;
var findDoiURL = /^(?:https?\:\/\/)(?:dx\.)?doi\.org\/(10[.][0-9]{3,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)$/ig;

//my isbn checks below

var isbnrw = /(978)?(?:-?\d){10}/gm;

//my list of metas to check
var metaArray = ['citation_doi', 'dc.identifier.doi', 'prism.doi', 'bepress_citation_doi', 'ppl.doi', 'doi', 'digital object identifier, doi', 'dc.source.doi', 'dc.source.volume.doi', 'dc.identifier', 'dc.Identifier', 'wkhealth_doi', 'st.discriminator', 'dcsext.wt_doi', 'rft_id']

//my list of metas for publisher

var metaPubArray = ['dc.publisher', 'citation_publisher', 'st.publisher', 'og:site_name'];

//my list of metas for biblio title

var metabiblioArray = ['citation_journal_title', 'st.title'];

// my list of metas for article title

var metaarticleArray = ['citation_title', 'dc.title'];

// my list to check the data type of article

var metaDataTypeArray = ['st.dataType', 'og:type']

//var domains list

var myDomains = []

// my list to check pdf URL;

try {
	var PDF_URL = document.querySelector('meta[name="citation_pdf_url"]').getAttribute("content")
} catch (err) {
	var PDF_URL = ""
}
//well we need the URL obv
var pageURL = location.href;

//get metatags of page

var metaX = document.getElementsByTagName("META");

Object.defineProperty(Array.prototype, "pushMax", {
	configurable: false,
	enumerable: false,
	writable: false,
	value: function (value, max) {
		if (this.length >= max) {
			this.splice(0, this.length - max + 1);
		}
		return this.push(value);
	}
});

//add listener for sending response to recommendation eng

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

	if (request.domainsList) {
		myDomains = JSON.parse(request.domainsList);
		injectSearchIcons()
	}

	if (request.articleType) {
		localStorage.setItem(btoa(pageURL).substring(0, 20), request.articleType);
	}
	if (request.report_url) {
		var data = getDOIFromURL(decodeURIComponent(pageURL));
		var arType = localStorage.getItem(btoa(pageURL).substring(0, 20));
		if (!data || data == undefined) {
			var getdata = getDOIFromMetadata();
			if (getdata || getdata == undefined) {
				var localTitle = document.getElementsByTagName('title')[0].textContent;
				messageSender({ 'title': localTitle, 'doi': getdata, 'articleType': arType, 'url': request.report_url, 'biblioData': {} })
				localStorage.removeItem(btoa(pageURL).substring(0, 20));
			}
			else {

				var doiData = getDOIfromAltmetric();
				if (!doiData || doiData == undefined) {
					var plumXData = getDOIfromPlumX();
					if (!plumXData || plumXData == undefined) {
						var dimensionsData = getDOIfromDimensionsAI();
						if (!dimensionsData || dimensionsData == undefined) {
							var customData = customDataGetters(decodeURIComponent(pageURL));
							if (customData.success) {
								var localTitle = document.getElementsByTagName('title')[0].textContent;
								messageSender({ 'title': localTitle, 'doi': customData.doi, 'articleType': arType, 'url': request.report_url, 'biblioData': customData.data })
								localStorage.removeItem(btoa(pageURL).substring(0, 20));
							}
							else {
								messageSender({ 'title': '', 'doi': '', 'articleType': arType, 'url': request.report_url })
								localStorage.removeItem(btoa(pageURL).substring(0, 20));
							}
						} else {
							var localTitle = document.getElementsByTagName('title')[0].textContent;
							messageSender({ 'doi': dimensionsData, 'title': localTitle, 'articleType': arType, 'url': request.report_url, 'biblioData': {} })
							localStorage.removeItem(btoa(pageURL).substring(0, 20));
						}

					} else {
						var localTitle = document.getElementsByTagName('title')[0].textContent;
						messageSender({ 'doi': plumXData, 'title': localTitle, 'articleType': arType, 'url': request.report_url, 'biblioData': {} })
						localStorage.removeItem(btoa(pageURL).substring(0, 20));
					}
				}
				else {
					//altmetric found
					var localTitle = document.getElementsByTagName('title')[0].textContent;
					messageSender({ 'doi': doiData, 'title': localTitle, 'articleType': arType, 'url': request.report_url, 'biblioData': {} })
					localStorage.removeItem(btoa(pageURL).substring(0, 20));
				}
			}

		}
		else {
			var localTitle = document.getElementsByTagName('title')[0].textContent;
			messageSender({ 'doi': data, 'title': localTitle, 'articleType': arType, 'url': request.report_url, 'biblioData': {} })
			localStorage.removeItem(btoa(pageURL).substring(0, 20));
		}
	}
});


// message sender to send data back to backg

function messageSender(msgData) {
	chrome.runtime.sendMessage({ report_myloft: msgData }, function (response) {

	});
}


//function to parse doi from url

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



//function to check doi from metas

function getDOIFromMetadata(metaData) {
	//get all meta tags and check if anyone matches from our list of know DOI array

	var i;
	for (i = 0; i < metaX.length; i++) {
		if (metaArray.indexOf(metaX[i].name.toLowerCase().trim()) > -1) {
			if (metaX[i].content.match(findDoi)) {
				return metaX[i].content.match(findDoi)[0]
			}
			else if (metaX[i].content.match(findDoiURL)) {
				return metaX[i].content.match(findDoiURL)[0]
			}
			else {
				return null;
			}
		}
	}
}

function getDOIfromAltmetric() {
	try {
		var doi = document.querySelectorAll('*[data-doi]')[0].getAttribute("data-doi");// get DOIs from the altmetric.com widget.
		return doi;
	} catch (error) {
		return null;
	}
}

function getDOIfromPlumX() {

	try {
		var dataLinks = document.links;
		var doi = null;
		var dataArray = Array.from(dataLinks);
		for (var key in dataArray) {
			var data = dataArray[key];
			if (data) {
				if (data.href) {
					if (data.href.indexOf('https://plu.mx') > -1) {
						if (data.href.match(findDoi)[0]) {
							doi = data.href.match(findDoi)[0];
							break;
						}
						else if (data.href.match(findDoiURL)[0]) {
							doi = data.href.match(findDoiURL)[0];
							break;
						}
					}
				}
			}
		}
		return doi;
	} catch (error) {
		return null;
	}
}



function getDOIfromDimensionsAI() {

	try {
		var dataLinks = document.links;
		var doi = null;
		var dataArray = Array.from(dataLinks);
		for (var key in dataArray) {
			var data = dataArray[key];
			if (data) {
				if (data.href) {
					if (data.href.indexOf('https://badge.dimensions.ai/details/doi') > -1) {
						if (data.href.match(findDoi)[0]) {
							doi = data.href.match(findDoi)[0];
							break;
						}
						else if (data.href.match(findDoiURL)[0]) {
							doi = data.href.match(findDoiURL)[0];
							break;
						}
					}
				}
			}
		}
		return doi;
	} catch (error) {
		return null;
	}
}


//get custom data as per the required domains of the institute content
function customDataGetters(URL) {
	if (URL.indexOf('search.proquest.com') > -1) {
		try {
			var doi = document.getElementsByClassName('abstract_Text')[0].textContent.match(findDoi)[0];
			return { 'success': true, 'doi': doi, 'data': {} }
		} catch (err) { return defaultNullResponse }
	} else if (URL.indexOf('ebscohost.com') > -1) {
		try {
			var citationData = document.getElementById('citationFields').textContent;
			if (citationData) {
				var checkDOi = citationData.match(findDoi);
				var checkISBN = citationData.match(isbnrw);
				if (checkDOi && checkDOi.length > 0) {
					return { 'success': true, 'doi': checkDOi[0], 'data': {} }
				} else if (checkISBN && checkISBN.length > 0) {
					var tempJSON = {};
					tempJSON['isbn'] = checkISBN[0];
					return { 'success': true, 'data': tempJSON, 'doi': null }
				}
				else {
					return defaultNullResponse
				}
			} else {
				return defaultNullResponse
			}

		} catch (err) { return defaultNullResponse }
	}
	else if (URL.indexOf('nature.com') > -1) {
		try {
			var arrayData = Array.from(document.getElementById('article-info-content').getElementsByTagName('a'))
			var doi = null;
			for (var i = 0; i < arrayData.length; i++) {
				if (arrayData[i].href && arrayData[i].href.match(findDoi)[0]) {
					var doi = arrayData[i].href.match(findDoi)[0];
					break;
				}
			}
			return { 'success': true, 'doi': doi, 'data': {} }
		} catch (err) { return defaultNullResponse }

	} else if (URL.indexOf('ovidsp.tx.ovid.com') > -1) {
		var data = document.getElementById('fulltext-source-right-top');
		if (data) {
			var ovidText = data.textContent;
			if (ovidText) {
				var doi = ovidText.match(findDoi)[0];
				if (doi) {
					return { 'success': true, 'doi': doi, 'data': {} }
				} else {
					return defaultNullResponse
				}
			} else {
				return defaultNullResponse
			}
		} else {
			try {
				var isbn = document.getElementsByClassName('citation-view')[0].textContent.match(isbnrw)[0];
				var tempJSON = {};
				tempJSON['isbn'] = isbn;
				return { 'success': true, 'data': tempJSON, 'doi': null }
			} catch (err) { return defaultNullResponse }
		}
	}
	else if (URL.indexOf('webofknowledge.com') > -1) {
		try {
			var doi = document.getElementById('fullurl_2').value.match(findDoi)[0];
			return { 'success': true, 'doi': doi, 'data': {} }
		} catch (err) { return defaultNullResponse }

	}
	else if (URL.indexOf('mhmedical.com') > -1) {
		try {
			var isbnData = document.getElementById('pageContent_imgCoverPlaceholder').src.match(isbnrw)[0];
			var tempJSON = {};
			tempJSON['isbn'] = isbnData;
			return { 'success': true, 'data': tempJSON, 'doi': {} }
		} catch (err) { return defaultNullResponse }

	}
	else if (URL.indexOf('eurekaselect.com') > -1 || URL.indexOf('benthamscience.com') > -1) {
		try {
			var doi = document.getElementsByClassName('doi')[0].textContent.match(findDoi)[0];
			return { 'success': true, 'doi': doi, 'data': {} }
		} catch (err) { return defaultNullResponse }
	}
	else if (URL.indexOf('hstalks.com') > -1) {
		var hstalksJSON = {};
		hstalksJSON['article_title'] = getArticleTitle().article_title;
		hstalksJSON['biblio_title'] = getBiblioTitle().biblio_title;
		hstalksJSON['publisher_name'] = getPublisherName().publisher_name;
		hstalksJSON['biblio_type'] = getPublicationType().type;

		return { 'success': true, 'doi': null, 'data': hstalksJSON }
	}
	else if (URL.indexOf('ispub.com') > -1) {
		var ispubJSON = {};
		ispubJSON['article_title'] = getArticleTitle().article_title;
		ispubJSON['biblio_title'] = getBiblioTitle().biblio_title;
		ispubJSON['publisher_name'] = getPublisherName().publisher_name;
		ispubJSON['biblio_type'] = 'Journal';
		return { 'success': true, 'doi': null, 'data': ispubJSON }
	}
	else if (URL.indexOf('thieme.com') > -1) {
		try {
			var doi = document.getElementsByClassName('meta ebook')[0].textContent.match(findDoi)[0];
			return { 'success': true, 'doi': doi, 'data': {} }
		} catch (err) { return defaultNullResponse }
	}
	else if (URL.indexOf('ncbi.nlm.nih.gov') > -1) {
		try {
			var doi = document.getElementsByClassName('cit')[0].textContent.match(findDoi)[0];
			return { 'success': true, 'doi': doi, 'data': {} }
		} catch (err) { return defaultNullResponse }

	}
	else if (URL.indexOf('portal.euromonitor.com') > -1) {
		try {
			var euroData = document.getElementById('lblTitle').childNodes[1].textContent;
			var iseuroJSON = {};
			iseuroJSON['article_title'] = '';
			iseuroJSON['biblio_title'] = euroData;
			iseuroJSON['publisher_name'] = 'Euromonitor';
			iseuroJSON['biblio_type'] = 'Report';
			return { 'success': true, 'doi': null, 'data': iseuroJSON }
		} catch (err) { return defaultNullResponse }
	}
	else if (URL.indexOf('capitaline.com') > -1) {
		try {
			var capitalineData = document.getElementById('LblComp').innerHTML.split('<br>')[0];
			iscapitalJSON['article_title'] = '';
			iscapitalJSON['biblio_title'] = capitalineData;
			iscapitalJSON['publisher_name'] = 'Capitaline';
			iscapitalJSON['biblio_type'] = 'Report';
			return { 'success': true, 'doi': null, 'data': iscapitalJSON }
		} catch (err) { return defaultNullResponse }
	}
	else if (URL.indexOf('acekp.in') > -1) {
		try {
			var acekpData = document.getElementById('ContentPlaceHolder1_navscheme').textContent;
			var isacekpJSON = {};
			isacekpJSON['article_title'] = '';
			isacekpJSON['biblio_title'] = acekpData;
			isacekpJSON['publisher_name'] = 'Accord Fintech Pvt. Ltd';
			isacekpJSON['biblio_type'] = 'Report';
			return { 'success': true, 'doi': null, 'data': isacekpJSON }
		} catch (err) { return defaultNullResponse }
	}
	else if (URL.indexOf('insight.dionglobal.in')) {
		try {
			document.querySelector('[id*="ContentPlaceHolder1_lblCompTitle"]').textContent.trim();
		} catch (err) { return defaultNullResponse }
	}
	else if (URL.indexOf('infraline.com') > -1) {
		try {
			var infralineData = document.getElementsByClassName('dataheading')[0].textContent;
			var isinfraJSON = {};
			isinfraJSON['article_title'] = '';
			isinfraJSON['biblio_title'] = infralineData;
			isinfraJSON['publisher_name'] = 'Infraline';
			isinfraJSON['biblio_type'] = 'Report';
			return { 'success': true, 'doi': null, 'data': isinfraJSON }
		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('frost.com') > -1) {
		try {
			var frostData = document.getElementsByTagName("cd-deliverable-title")[0].childNodes[1].childNodes[7].textContent;
			var isfrostJSON = {};
			isfrostJSON['article_title'] = '';
			isfrostJSON['biblio_title'] = frostData;
			isfrostJSON['publisher_name'] = 'Frost & Sullivan';
			isfrostJSON['biblio_type'] = 'Report';
			return { 'success': true, 'doi': null, 'data': isfrostJSON }
		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('advantage.marketline.com') > -1) {
		try {
			var marketlineData = document.getElementById('pagetitle').childNodes[0].textContent;
			var ismarketlineJSON = {};
			ismarketlineJSON['article_title'] = '';
			ismarketlineJSON['biblio_title'] = marketlineData;
			ismarketlineJSON['publisher_name'] = 'MarketLine';
			ismarketlineJSON['biblio_type'] = 'Report';
			return { 'success': true, 'doi': null, 'data': ismarketlineJSON }
		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('statista.com') > -1) {
		try {
			var i;
			for (i = 0; i < metaX.length; i++) {
				if (metaX[i].getAttribute('property') == "og:title") {
					var titleData = metaX[i].content.split('|')[0].trim()
					var isstatistaJSON = {};
					isstatistaJSON['article_title'] = '';
					isstatistaJSON['biblio_title'] = titleData;
					isstatistaJSON['publisher_name'] = 'Statista';
					isstatistaJSON['biblio_type'] = 'Report';
					return { 'success': true, 'doi': null, 'data': isstatistaJSON }
				}
			}
			return defaultNullResponse
		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('warc.com') > -1) {
		try {
			var i;
			for (i = 0; i < metaX.length; i++) {
				if (metaX[i].getAttribute('property') == "og:title") {
					var titleData = metaX[i].content.split('|')[0].trim()
					var iswarcJSON = {};
					iswarcJSON['article_title'] = '';
					iswarcJSON['biblio_title'] = titleData;
					iswarcJSON['publisher_name'] = 'Statista';
					iswarcJSON['biblio_type'] = 'Report';
					return { 'success': true, 'doi': null, 'data': iswarcJSON }
				}
			}
			return defaultNullResponse
		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('acm.org') > -1) {
		try {
			var i;
			for (i = 0; i < metaX.length; i++) {
				if (metaX[i].name == "citation_conference_title") {
					var titleData = metaX[i].content.trim()
					var isJSON = {};
					isJSON['article_title'] = '';
					isJSON['biblio_title'] = titleData;
					isJSON['publisher_name'] = 'ACM';
					isJSON['biblio_type'] = 'Conference Proceedings';
					return { 'success': true, 'doi': null, 'data': isJSON }
				}
				else if (metaX[i].name == "citation_title") {
					var titleData = metaX[i].content.trim()
					var isJSON = {};
					isJSON['article_title'] = '';
					isJSON['biblio_title'] = titleData;
					isJSON['publisher_name'] = 'ACM';
					isJSON['biblio_type'] = 'eBook';
					return { 'success': true, 'doi': null, 'data': isJSON }
				}
				else if (metaX[i].name == "title") {
					var doi = document.getElementsByClassName('byline')[0].textContent.match(findDoi)[0];
					return { 'success': true, 'doi': doi, 'data': null }

				}
			}
			return defaultNullResponse
		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('kluwerarbitration.com') > -1) {


		var articleLocalTitle = document.getElementsByClassName('documenttitle')[0].textContent;
		var biblioLocalType = "Journal";
		var pub = document.getElementsByClassName('docinfoblock-item');
		for (var key in pub) {
			if (pub[key].textContent) {
				if (pub[key].textContent.includes('Publication')) {
					var biblioLocalTitle = pub[key].textContent.replace(/\n/g, '').split('Publication')[1].trim();
					var local = (/href="(.*)">/gm).exec(pub[key].innerHTML.trim())[1];
					if (local.indexOf('journal') > -1) {
						biblioLocalType = "Journal"
					} else if (local.indexOf('book') > -1) {
						biblioLocalType = "eBook"
					}
					break;
				}
			}
		}
		isJSON['article_title'] = articleLocalTitle;
		isJSON['biblio_title'] = biblioLocalTitle;
		isJSON['publisher_name'] = 'Kluwer Law International by Wolter Kluwers';
		isJSON['biblio_type'] = biblioLocalType;
		return { 'success': true, 'doi': null, 'data': isJSON }
	}
	else if (URL.indexOf('scconline.com') > -1) {
		try {
			var articleLocalTitle = "";
			var biblioLocalTitle = document.getElementsByClassName('SectionheadText')[0].textContent.trim().split('\n')[0];
			var isJSON = {};
			isJSON['article_title'] = articleLocalTitle;
			isJSON['biblio_title'] = biblioLocalTitle;
			isJSON['publisher_name'] = 'SCC Online';
			isJSON['biblio_type'] = 'Journal';
			return { 'success': true, 'doi': null, 'data': isJSON }
		} catch (error) {
			try {
				var articleLocalTitle = "";
				var biblioLocalTitle = document.getElementsByClassName('SectionHeading')[0].textContent.trim().split('\n')[0];
				var isJSON = {};
				isJSON['article_title'] = articleLocalTitle;
				isJSON['biblio_title'] = biblioLocalTitle;
				isJSON['publisher_name'] = 'SCC Online';
				isJSON['biblio_type'] = 'Journal';
				return { 'success': true, 'doi': null, 'data': isJSON }
			}
			catch (err) {
				return defaultNullResponse
			}
		}
	}
	else if (URL.indexOf('southasiaarchive.com') > -1) {

		try {
			var articleLocalTitle = "";
			var biblioLocalTitle = "";
			var publisherName = "";
			var biblioLocalType = "Journal"
			var allData = $('div.metadataWrapper > table > tbody').text().trim().replace(/\s\s+/g, '$').split('$');
			for (var key in allData) {
				if (allData[key] == "Publication Title") {
					biblioLocalTitle = allData[Number(key) + 1];
				}
				else if (allData[key] == "Publisher Name") {
					publisherName = allData[Number(key) + 1];
				} else if (allData[key] == "Document Type") {
					if (allData[Number(key) + 1] == "Book") {
						biblioLocalType = "eBook";
					} else if (allData[Number(key) + 1] == "Report") {
						biblioLocalType = "Report";
					} else if (allData[Number(key) + 1] == "Proceedings") {
						biblioLocalType = "Conference Proceedings"
					}
					else {
						biblioLocalType = allData[Number(key) + 1]
					}
				}
			}

			var isJSON = {};
			isJSON['article_title'] = articleLocalTitle;
			isJSON['biblio_title'] = biblioLocalTitle;
			isJSON['publisher_name'] = publisherName;
			isJSON['biblio_type'] = biblioLocalType;
			return { 'success': true, 'doi': null, 'data': isJSON }
		} catch (error) {
			return defaultNullResponse
		}

	}
	else if (URL.indexOf('sciencemag.org') > -1) {
		try {
			var doi = document.getElementsByClassName('meta-line')[0].textContent.match(findDoi)[0];
			return { 'success': true, 'doi': doi, 'data': null }

		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('portal.igpublish.com') > -1) {
		try {
			var isbn = document.getElementById('id13f').textContent.trim().match(isbnrw);
			var tempJSON = {};
			tempJSON['isbn'] = isbn;
			return { 'success': true, 'data': tempJSON, 'doi': null }
		} catch (error) {
			return defaultNullResponse
		}
	}
	else if (URL.indexOf('www.karger.com') > -1) {
		try {
			var doi = document.getElementsByClassName('articleDetails')[0].textContent.match(findDoi)[0];
			return { 'success': true, 'doi': doi, 'data': null }
		} catch (error) {
			return defaultNullResponse
		}
	}
	// else if (URL.indexOf('manupatrafast.in') > -1 || URL.indexOf('manupatra.com') > -1 || URL.indexOf('manupatra.in') > -1 ||  URL.indexOf('manupatrafast.com') > -1) {
	// 	try {
	// 		var doi = document.getElementsByClassName('articleDetails')[0].textContent.match(findDoi)[0];
	// 		return { 'success': true, 'doi': doi, 'data': null }
	// 	} catch (error) {
	// 		return defaultNullResponse
	// 	}
	// }
	else {
		return defaultNullResponse
	}
}


function getBiblioTitle() {
	var i;
	for (i = 0; i < metaX.length; i++) {
		if (metabiblioArray.indexOf(metaX[i].name.toLowerCase().trim()) > -1) {
			return { 'biblio_title': metaX[i].content }
		}
	}
	return { 'biblio_title': null }
}

function getArticleTitle() {
	var i;
	for (i = 0; i < metaX.length; i++) {
		if (metaarticleArray.indexOf(metaX[i].name.toLowerCase().trim()) > -1) {
			return { 'article_title': metaX[i].content }
		}
	}
	return { 'article_title': null };
}


function getPublisherName() {
	var i;
	for (i = 0; i < metaX.length; i++) {
		if (metaarticleArray.indexOf(metaX[i].name.toLowerCase().trim()) > -1) {
			return { 'publisher_name': metaX[i].content }
		}
	}
	return { 'publisher_name': null };
}

function getPublicationType() {
	var possibilities = ['Journal', 'eBook', 'Video', 'Conference Proceedings', 'Standard', 'Dissertation', 'Proceedings'];
	var i;
	for (i = 0; i < metaX.length; i++) {
		var tempName = possibilities.filter((d) => { return metaX[i].content.includes(d) });
		if (tempName && tempName.length > 0) {
			return { 'type': tempName[0] };
		}
	}
	return { 'type': null };
}


//check if page has metatags or not

// var lastLinks = [];
// var lastLinkArray = ['og:type', 'type'];
// var lastLinkContent = ['articles', 'article', 'Articles', 'Article'];
// for (var lastLink = 0; lastLink < metaX.length; lastLink++) {
// 	if (metaX[lastLink].getAttribute('property') && lastLinkArray.indexOf(metaX[lastLink].getAttribute('property').toLowerCase().trim()) > -1) {
// 		if (lastLinkContent.indexOf(metaX[lastLink].getAttribute('content')) > -1) {
// 			var temp = {
// 				'title': getDocTitle(),
// 				'url': getDocUrl()
// 			}
// 			lastLinks.pushMax(temp, 3);
// 		}
// 	}
// }

function getDocTitle() {
	if (document.getElementsByTagName("title")[0].innerText) {
		return document.getElementsByTagName("title")[0].innerText;
	}
	if (document.title) {
		return document.title;
	}
	return null;
}


function getDocUrl() {
	if (pageURL) {
		return pageURL;
	}
	if (document.location.href) {
		return document.location.href;
	}
	return null;
}

//access icon
function injectSearchIcons() {
	Array.from(document.getElementsByClassName('myloft_access')).forEach((data) => { data.remove() });
	var domains = myDomains;
	var targetDomains = ['.google.', 'xueshu.baidu.com'];
	let mainUrlhost = document.location.hostname;

	var shouldGoAhead = false;
	targetDomains.forEach((aHost) => {
		if ((mainUrlhost.includes(aHost))) {
			shouldGoAhead = true;
		}
	});
	if (!shouldGoAhead) {
		return;
	}
	var googleArr = [];
	Array.from(document.links).forEach((e) => {
		if (e) {
			domains.forEach((aDomain) => {
				if ((e.getAttribute('href').includes(aDomain) && e.hostname.endsWith(aDomain))) {
					googleArr.push(e)
				}
			});
		}
	});
	googleArr.forEach((data) => {
		var t = document.createElement('div');
		t.className = 'myloft_access';
		t.style.display = 'inline';
		t.style.width = '24px';
		var imgHght = "24px";
		if (mainUrlhost.includes('cse.google.com')) {
			imgHght = "18px";
		}
		t.innerHTML = '<img height="' + imgHght + '" src="https://s3.amazonaws.com/myloft-institute-content-covers/search-engines/ml-icon.svg">';
		data.appendChild(t);
	});
	googleArr.forEach((data) => {
		var url = data.querySelector('a');
		if (url) {
			var finalURL = url.getAttribute('href');
		}
	})
}


// function ebscohostSearchQuery() {
// 	try {
// 		var queryStrings = getQueryStringValue('bquery')
// 		var data = queryStrings.split('+AND+');
// 		var ebsData = [];
// 		data.forEach((q) => {
// 			var aD = q.replace('(', '').replace(')', '');
// 			ebsData.push(aD);
// 		});
// 		return ebsData;
// 	} catch (error) {
// 		return [];
// 	}

// }

// function summonsSearchQuery() {
// 	try {
// 		var location = window.location.href;
// 		var middlewareData = location.match(/\A?q=[^&]+&*/);
// 		var summsData = decodeURIComponent(middlewareData[0].replace('q=', '')).split(' ')
// 		return summsData;
// 	} catch (error) {
// 		return [];
// 	}

// }

if (pageURL.indexOf('scholar.google.') > -1) {
	var value = googleandScholarSearchQuery();
	if (value) {
		reportMessenger(value, 'Google Scholar')
	}
}

if (pageURL.indexOf('xueshu.baidu.com') > -1) {
	var value = baiduScholarSearchQuery();
	if (value) {
		reportMessenger(value, "Baidu Scholar")
	}
}

function googleandScholarSearchQuery() {
	try {
		let params = (new URL(document.location)).searchParams;
		let name = params.get("q");
		return name;
	} catch (error) {
		return null;
	}
}


function baiduScholarSearchQuery() {
	try {
		let params = (new URL(document.location)).searchParams;
		let name = params.get("wd");
		return name;
	} catch (error) {
		return null;
	}
}

function reportMessenger(keywordText, searchEngineText) {
	var sendobject = {
		keyword: keywordText,
		source: 'Browser',
		searchEngine: searchEngineText
	}
	chrome.runtime.sendMessage({ search_report: sendobject }, (response) => {
	});
}


// function getQueryStringValue(key) {
// 	return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
// }


//Dev: Vineet Deshpande
//Author : Eclat Engineering Pvt. Ltd.
//Copyright Eclat Engineering Pvt. Ltd.