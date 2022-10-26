function freezeObject(obj) {
	for (const name of Object.getOwnPropertyNames(obj)) {
		const value = obj[name];

		if (value && typeof value === 'object') {
			freezeObject(value);
		}
	}

	return Object.freeze(obj);
}

const Storage = freezeObject({
	'BlockedWebsites': {
		'List': function(callback) {
			chrome.storage.sync.get({'blockedWebsites': []}, function(result) {
				let websitesList = result.blockedWebsites;

				if (typeof callback == 'function') {
					callback(websitesList);
				}
			});
		},
		'Exists': function(websitesList, website) {
			let exists = false;
			website = website.toLowerCase();

			websitesList.forEach(function(w) {
				if (sanitizeURL(w.toLowerCase()) == website) {
					exists = true;
					return;
				}
			});

			return exists;
		},
		'Add': function(newWebsite, callback) {
			Storage.BlockedWebsites.List((websitesList) => {
				if (websitesList) {
					if (newWebsite) {
						newWebsite = sanitizeURL(newWebsite.trim().toLowerCase());

						if (! Storage.BlockedWebsites.Exists(websitesList, newWebsite)) {
							websitesList.push(newWebsite);
						}
					}
				} else {
					websitesList = [];
				}

				chrome.storage.sync.set({'blockedWebsites': websitesList}, () => {
					if (typeof callback == 'function') {
						callback();
					}
				});
			});
		},
		'Update': function(websiteIndex, updatedWebsite, callback) {
			Storage.BlockedWebsites.List((websitesList) => {
				if (websiteIndex > -1 && updatedWebsite) {
					updatedWebsite = sanitizeURL(updatedWebsite.trim().toLowerCase());

					if (updatedWebsite.length > 0 && websitesList && websitesList.length > websiteIndex) {
						let otherWebsitesList = websitesList.slice();
						otherWebsitesList.splice(websiteIndex, 1);

						if (! Storage.BlockedWebsites.Exists(otherWebsitesList, updatedWebsite)) {
							websitesList[websiteIndex] = updatedWebsite;
						}
					}
				}

				chrome.storage.sync.set({'blockedWebsites': websitesList}, () => {
					if (typeof callback == 'function') {
						callback();
					}
				});
			});
		},
		'Delete': function(websiteIndex, callback) {
			Storage.BlockedWebsites.List((websitesList) => {
				if (websiteIndex > -1) {
					if (websitesList && websitesList.length > websiteIndex) {
						websitesList.splice(websiteIndex, 1);
					}
				}

				chrome.storage.sync.set({'blockedWebsites': websitesList}, () => {
					if (typeof callback == 'function') {
						callback();
					}
				});
			});
		},
	},
});

function sanitizeURL(url) {
	let site;

	try {
		if (url && url.length > 0) {
			if (url.startsWith('http://') || url.startsWith('https://')) {
				let urlObj = new URL(url);

				site = urlObj.hostname;

				site = site.replace(/^www\./, '');
			} else {
				site = url;
			}
		}
	} catch(err) {
		site = url;
	}

	return site;
}

function canBlockURL(url, blockedWebsites) {
	let canBlock = false;
	url = sanitizeURL(url);

	if (blockedWebsites) {
		blockedWebsites.forEach(function(blWebsite) {
			if (url == blWebsite || url.startsWith(blWebsite)) {
				canBlock = true;
			}
		});
	}

	return canBlock;
}