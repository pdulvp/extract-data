/* 
 This code is published under CC BY-NC-ND 4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 @author: pdulvp@laposte.net
 */
var Rules = null;

function restoreOptions() {
	browser.storage.local.get('rules').then((res) => {
		if (res.rules && Array.isArray(res.rules)) {
			updateRules( { rules: res.rules } );
		} else {
			updateRules( { rules: [] } );
		}
	}, (error) => {
		updateRules( { rules: [] } );
	});
}

function updateRules(storage) {
	this.Rules = storage.rules;

	let menu = document.getElementById("menu-editrules");
	browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {

		console.log(tabs);
		let tabId = tabs[0].id;
		let tabUrl = tabs[0].url;
		
		var sending = browser.runtime.sendMessage( { "action": "getResult", "tabId": tabId } );
		sending.then((ree) => {
			
			let result = '';
			if (ree != null && ree.result != null) {
				let matchingRules = ree.result.rulesResults.filter(r => {
					let rule = findRule(r.id);
					if (rule == null) {
						return false;
					}
					if (tabUrl != rule.sitematch) {
						return false;
					}
					return true;
				});

				if (matchingRules.length == 0) {
					let panel = createPanel('<div class="tooltip-title">No rule from this page</div>');
					addClass(panel, "panel-tooltip-error");
					document.getElementById("panel").insertBefore(panel, menu);
					return;
				}

				let values = matchingRules.map(r => {
					let rule = findRule(r.id);
					let items = r.itemsResults.filter(x => x.value != null);
					if (items.length > 0) {
						let content = '<div class="tooltip-title">'+rule.name+"</div>";
						content += items.map(x => {
							return `${x.value}`;
						}).join("<br/>");
						return `<div class="tooltip-content">${content}</div>`;
					} else {
						let content = '<div class="tooltip-title">'+rule.name+"</div>";
						content += 'No result';
						return `<div class="tooltip-content">${content}</div>`;
					}
					return null;
				}).filter(x => x != null);

				if (values.length == 0) {
					let panel = createPanel('<div class="tooltip-title">No result from this page</div>');
					addClass(panel, "panel-tooltip-error");
					document.getElementById("panel").insertBefore(panel, menu);
				} else {
					values.map(v => {
						let panel = createPanel(v);
						document.getElementById("panel").insertBefore(panel, menu);
					});
				}
				return;
			}

			let panel = createPanel('<div class="tooltip-title">No rule from this page</div>');
			addClass(panel, "panel-tooltip-error");
			document.getElementById("panel").insertBefore(panel, menu);
			
		}, e => {
			let panel = createPanel('<div class="tooltip-title">An error occured</div>');
			addClass(panel, "panel-tooltip-error");
			document.getElementById("panel").insertBefore(panel, menu);
			console.log(e);
		});
	
	});
}

function createPanel(content) {
	let child = document.createElement("div");
	addClass(child, "panel-tooltip");
	child.innerHTML = content;
	child.onclick = function(event) {
		copyToClipboard(event.target.innerText);
		window.close();
	}
	return child;
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById("menu-editrules").onclick = function (event) {
	let createData = {
		type: "popup",
		allowScriptsToClose: true,
		width: 1200,
		height: 500,
		url: "options.html"
	};
	let creating = browser.windows.create(createData);
	creating.then(() => {
		console.log("The popup has been created");
	}); 
 };
 
 if ( document.getElementById("menu-configure") != null) {
	document.getElementById("menu-configure").onclick = function (event) {
		browser.runtime.openOptionsPage();
	};
 }
 
function handleMessage(request, sender, sendResponse) {
	if (request.action == "result") {
		console.log("popup");
		console.log(request);
		console.log(sender);
	  return;
	}
}

browser.runtime.onMessage.addListener(handleMessage);

function findRule(ruleId) {
	if (Rules != null)  {
		return Rules.filter(x => x.id == ruleId)[0];
	}
	return null;
}
