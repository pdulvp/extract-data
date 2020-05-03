/* 
 This code is published under CC BY-NC-ND 4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 @author: pdulvp@laposte.net
 */
var Rules = null;
var Results = null;

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

	var table = document.getElementById("panel");
	while (table.childNodes.length > 1) {
		table.removeChild(table.firstChild);
	}

	let menu = document.getElementById("menu-editrules");
	browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {

		console.log(tabs);
		let tabId = tabs[0].id;
		let tabUrl = tabs[0].url;
		
		var sending = browser.runtime.sendMessage( { "action": "getResult", "tabId": tabId } );
		sending.then((ree) => {
			Results = ree;

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
						let content = `<div rule-id="${rule.id}" class="tooltip-title">`+rule.name+"</div>";
						content += items.map(x => {
							return `${x.value}`;
						}).join("<br/>");
						return `<div rule-id="${rule.id}" class="tooltip-content">${content}</div>`;
					} else {
						let content = `<div rule-id="${rule.id}" class="tooltip-title">`+rule.name+"</div>";
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

function getRuleContent(ruleId) {
	let content = '';
	if (Results != null && ruleId != null) {
		let rule = Results.result.rulesResults.find(r => r.id == ruleId);
		if (rule != null) {
			let items = rule.itemsResults.filter(x => x.value != null);
			if (items.length > 0) {
				content += items.map(x => {
					return `${x.value}`;
				}).join("\n");
			}
		}
	}
	return content;
}

function createPanel(content) {
	let child = document.createElement("div");
	addClass(child, "panel-tooltip");
	child.innerHTML = content;
	child.onclick = function(event) {
		let ruleId = event.target.getAttribute("rule-id");
		if (ruleId != undefined) {
			let content = getRuleContent(ruleId);
			copyToClipboard(content);
	
			browser.notifications.create(uuidv4(), {
				"type": "basic",
				"title": "Copied !",
				"message": "Copied to clipboard"
			}).then(e => {
				  setTimeout(ee => {
					browser.notifications.clear(e);
				  }, 2000);
			});
	
		}
		window.close();
	}
	return child;
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById("menu-editrules").onclick = function (event) {
	openOptions();
 };
 
 if ( document.getElementById("menu-configure") != null) {
	document.getElementById("menu-configure").onclick = function (event) {
		browser.runtime.openOptionsPage();
	};
 }
 
function handleMessage(request, sender, sendResponse) {
	if (request.action == "onResultChange") {
		restoreOptions();
	}
}

function onStorageChange() {
	restoreOptions();
}

browser.runtime.onMessage.addListener(handleMessage);
browser.storage.onChanged.addListener(onStorageChange);

function findRule(ruleId) {
	if (Rules != null)  {
		return Rules.filter(x => x.id == ruleId)[0];
	}
	return null;
}
