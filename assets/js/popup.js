function getBlockedWebsitesList(callback) {
	chrome.storage.sync.get({'blockedWebsites': []}, (result) => {
		callback(result.blockedWebsites);
	});
}

window.addEventListener('load', function() {
	document.querySelectorAll('.btnGoToOptionsPage').forEach(function(btn) {
		btn.addEventListener('click', function(e) {
			e.preventDefault();

			if (chrome.runtime.openOptionsPage) {
				chrome.runtime.openOptionsPage();
			} else {
				window.open(chrome.runtime.getURL('views/options.html'));
			}
		});
	});

	getBlockedWebsitesList((blockedWebsites) => {
		let listElement = document.getElementById('blockedWebsitesList');

		listElement.innerHTML = '';

		if (blockedWebsites) {
			let template = document.getElementById('sitesListTemplate');

			blockedWebsites.forEach((website, i) => {
				let liElement = template.content.firstElementChild.cloneNode(true);

				liElement.setAttribute('data-index', i);

				liElement.querySelector('.siteURL').textContent = website;

				listElement.append(liElement);
			});
		}
	});
});