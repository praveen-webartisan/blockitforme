function toggleProgressBar(show) {
	if (show) {
		document.body.classList.add('loading');
	} else {
		document.body.classList.remove('loading');
	}
}

function onEditSiteClicked(e) {
	e.preventDefault();

	let liElement = e.target.closest('li');
	liElement.classList.add('editing');

	liElement.querySelector('.editingSite').focus();
}

function onSaveEditingSiteClicked(liElement) {
	let editingIndex = liElement.getAttribute('data-index');

	if (editingIndex && editingIndex > -1) {
		let editedSite = sanitizeURL(liElement.querySelector('.editingSite').value);

		if (editedSite && editedSite.trim().length > 0) {
			toggleProgressBar(true);

			Storage.BlockedWebsites.Update(editingIndex, editedSite, () => {
				liElement.classList.remove('editing');
				liElement.querySelector('.siteURL').textContent = editedSite;
				liElement.querySelector('.editingSite').value = editedSite;

				toggleProgressBar(false);
			});
		}
	}
}

function onCancelEditingSiteClicked(liElement) {
	liElement.classList.remove('editing');
}

function onRemoveSiteClicked(e) {
	e.preventDefault();

	let removeIndex = this.getAttribute('data-index');

	if (removeIndex && removeIndex > -1) {
		toggleProgressBar(true);

		Storage.BlockedWebsites.Delete(removeIndex, () => {
			toggleProgressBar(false);

			Storage.BlockedWebsites.List(renderBlockedWebsitesList);
		});
	}
}

function renderBlockedWebsitesList(blockedWebsites) {
	let listElement = document.getElementById('blockedWebsitesList');

	listElement.innerHTML = '';

	if (blockedWebsites) {
		let template = document.getElementById('sitesListTemplate');

		blockedWebsites.forEach((website, i) => {
			let liElement = template.content.firstElementChild.cloneNode(true);

			liElement.setAttribute('data-index', i);

			liElement.querySelector('.siteURL').textContent = website;

			liElement.querySelector('.editingSite').value = website;
			liElement.querySelector('.editingSite').addEventListener('keydown', function(e) {
				if (e.which == 27) {
					onCancelEditingSiteClicked(liElement);
				} else if (e.which == 13) {
					onSaveEditingSiteClicked(liElement);
				}
			});

			liElement.querySelector('.btnRemoveSite').setAttribute('data-index', i);
			liElement.querySelector('.btnRemoveSite').addEventListener('click', onRemoveSiteClicked);

			liElement.querySelector('.btnEditSite').addEventListener('click', onEditSiteClicked);

			liElement.querySelector('.btnSaveEditedSite').addEventListener('click', function(e) {
				e.preventDefault();

				onSaveEditingSiteClicked(e.target.closest('li'));
			});
			liElement.querySelector('.btnCancelEditSite').addEventListener('click', function(e) {
				e.preventDefault();

				onCancelEditingSiteClicked(e.target.closest('li'));
			});

			listElement.append(liElement);
		});
	}
}

function onAddNewSiteClicked() {
	let newWebsite = sanitizeURL(document.getElementById('newWebsite').value);

	if (newWebsite && newWebsite.length > 0) {
		toggleProgressBar(true);

		Storage.BlockedWebsites.Add(newWebsite, () => {
			document.getElementById('newWebsite').value = '';

			Storage.BlockedWebsites.List(renderBlockedWebsitesList);

			toggleProgressBar(false);
		});
	}
}

window.addEventListener('load', function() {
	document.getElementById('newWebsite').addEventListener('keypress', function(e) {
		if (e.which == 13) {
			onAddNewSiteClicked();
		}
	});

	Storage.BlockedWebsites.List(renderBlockedWebsitesList);

	document.getElementById('btnAddSite').addEventListener('click', function(e) {
		e.preventDefault();

		onAddNewSiteClicked();
	});

});