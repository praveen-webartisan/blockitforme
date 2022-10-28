importScripts('./common.js');

let blockedWebsites = [];
let activeTabs = {};

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

function removeContextMenusInTheTab(tabId) {
	chrome.contextMenus.remove('ctxmenu-block-site-' + tabId);

	if (activeTabs[tabId]) {
		(activeTabs[tabId]['contextMenus'] || []).forEach((ctxMenuId) => {
			chrome.contextMenus.remove(ctxMenuId);
		});
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
	});

	chrome.webNavigation.onCommitted.addListener(function (details) {
		checkAndBlockWebsite(details.url, details.tabId, details.frameType, details.frameId);
	});

	chrome.contextMenus.onClicked.addListener(function(info, tab) {
		if (info.menuItemId.startsWith('ctxmenu-block-site-') && tab && tab.id) {
			let url;

			if (info.frameId > 0 && info.frameUrl) {
				url = info.frameUrl;
			} else if (info.pageUrl) {
				url = info.pageUrl;
			}

			if (url && url != 'new-tab-page' && ( url.startsWith('http://') || url.startsWith('https://') )) {
				Storage.BlockedWebsites.DeleteIfExistsOrAdd(url, () => {
					chrome.tabs.reload(tab.id);
				});
			}
		}
	});

	chrome.tabs.onCreated.addListener(function(tab) {
		activeTabs[tab.id] = {};
	});

	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if (tab.url) {
			chrome.webNavigation.getAllFrames({
				'tabId': tabId,
			}, (frames) => {
				if (!activeTabs[tabId]) {
					activeTabs[tabId] = {};
				}

				(activeTabs[tabId]['contextMenus'] || []).forEach((ctxMenuId) => {
					chrome.contextMenus.remove(ctxMenuId);
				});

				activeTabs[tabId]['contextMenus'] = [];

				(frames || []).forEach((frame) => {
					if (frame.url) {
						let frameURLObj = new URL(frame.url);
						let frameURL = frameURLObj.origin.replace(/\/$/, '') + '/' + frameURLObj.pathname.replace(/^\//, '');
						let ctxMenuURLPatterns = [frameURL, frameURL.replace(/\/$/, '') + '/*'];

						let ctxMenuId = chrome.contextMenus.create({
							'id': 'ctxmenu-block-site-' + tab.id + '-' + frame.frameId,
							'title': canBlockURL(frame.url, blockedWebsites) ? 'Unblock this site' : 'Block this site',
							'contexts': ['all'],
							'documentUrlPatterns': ctxMenuURLPatterns
						});

						activeTabs[tabId]['contextMenus'].push(ctxMenuId);
					}
				});
			});
		}
	});

	chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
		removeContextMenusInTheTab(tabId);
	});

	chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
		removeContextMenusInTheTab(removedTabId);
	});
}

initBackgroundWorker();