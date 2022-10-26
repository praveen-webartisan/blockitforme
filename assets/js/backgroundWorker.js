importScripts('./common.js');

let blockedWebsites = [];

 async function checkAndBlockWebsite(url, tabId, frameType = false, frameId = false) {
	let tabInfo = null;

	try {
		tabInfo = await chrome.tabs.get(tabId);
	} catch(err) {
		console.info('Unable to get TabInfo.', err, 'Reason: TabId might have changed!');
		tabInfo = null;
	}

	if (typeof tabInfo != 'undefined' && typeof url != 'undefined' && blockedWebsites) {
		if (canBlockURL(url, blockedWebsites)) {
			let target = {
				'tabId': tabId
			};

			if (frameType && frameId) {
				// Check if website is in iframe
				if (frameType != 'outermost_frame' && frameId > 0) {
					target['frameIds'] = [ frameId ];
				}
			}

			try {
				await chrome.scripting.insertCSS({
					target: target,
					files: ['assets/css/common.css', 'assets/css/blockedPage.css']
				});

				await chrome.scripting.executeScript({
					target: target,
					files: ['assets/js/blockedPage.js']
				});
			} catch(err) {
				console.info('Unable to inject script.', err, 'Reason: Tab might be closed while inject methods are running!');
			}
		}
	}
}

function initBackgroundWorker() {
	Storage.BlockedWebsites.List(function(websitesList) {
		blockedWebsites = websitesList;
	});

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message == 'showOptionsPage') {
			if (chrome.runtime.openOptionsPage) {
				chrome.runtime.openOptionsPage();
			} else {
				window.open(chrome.runtime.getURL('views/options.html'));
			}
		}
	});

	chrome.storage.onChanged.addListener(function (changes, namespace) {
		if (typeof changes.blockedWebsites != "undefined") {
			blockedWebsites = changes.blockedWebsites.newValue;
		}
	});

	chrome.runtime.onInstalled.addListener((details) => {
		if (details.reason == chrome.runtime.OnInstalledReason.INSTALL) {
			if (chrome.runtime.openOptionsPage) {
				chrome.runtime.openOptionsPage();
			} else {
				window.open(chrome.runtime.getURL('views/options.html'));
			}
		}

		chrome.contextMenus.create({
			'id': 'ctxmenu-block-site',
			'title': 'Block this site',
			'contexts': ['page']
		});
	});

	chrome.webNavigation.onCommitted.addListener(function (details) {
		checkAndBlockWebsite(details.url, details.tabId, details.frameType, details.frameId);
	});

	chrome.contextMenus.onClicked.addListener(function(info, tab) {
		if (info.menuItemId == 'ctxmenu-block-site' && tab && tab.id) {
			let url;

			if (info.frameId > 0 && info.frameUrl) {
				url = info.frameUrl;
			} else if (info.pageUrl) {
				url = info.pageUrl;
			}

			if (url && url != 'new-tab-page' && ( url.startsWith('http://') || url.startsWith('https://') )) {
				Storage.BlockedWebsites.Add(url);

				chrome.tabs.reload(tab.id);
			}
		}
	});
}

initBackgroundWorker();