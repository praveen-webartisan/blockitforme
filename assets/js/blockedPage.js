window.stop();

document.documentElement.innerHTML =	`<div class="blockitforme-blocked-website-container">`+
											`<span class="blockitforme-blocked-website-icon">🚫</span>`+
											`<span class="blockitforme-blocked-website-title">This website has been blocked</span>`+
											`<a href="javascript:void(0);" id="btnOpenOptionsPage" class="blockitforme-blocked-website-link">Allow</a>`+
										`</div>`;

document.title = 'Blocked by You';

document.addEventListener('click', function(e) {
	let btnOpenOptionsPage = document.getElementById('btnOpenOptionsPage');

	if(e.target == btnOpenOptionsPage || btnOpenOptionsPage.contains(e.target)) {
		e.preventDefault();

		chrome.runtime.sendMessage('showOptionsPage');
	}
});