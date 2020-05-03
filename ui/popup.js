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

				let rulesRenders = matchingRules.map(r => {
					let rule = findRule(r.id);
					let items = r.itemsResults.filter(x => x.value != null);
					if (items.length > 0) {
						let content = `<div rule-id="${rule.id}" class="tooltip-title">${rule.name}</div>`;
						content += items.map(x => {
							return `${x.value}`;
						}).join("<br/>");
						return createPanel(`<div rule-id="${rule.id}" class="tooltip-content">${content}</div>`, r.id);
					} else {
						let content = `<div rule-id="${rule.id}" class="tooltip-title">${rule.name}</div>`;
						content += 'No result';
						return createPanel(`<div class="tooltip-content">${content}</div>`, r.id);
					}
					return null;
				}).filter(x => x != null);

				if (rulesRenders.length == 0) {
					let panel = createPanel('<div class="tooltip-title">No result from this page</div>');
					addClass(panel, "panel-tooltip-error");
					document.getElementById("panel").insertBefore(panel, menu);
				} else {
					rulesRenders.map(v => {
						document.getElementById("panel").insertBefore(v, menu);
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

function getRuleContent(ruleId, type) {
	if (Results != null && ruleId != null) {
		let rule = Results.result.rulesResults.find(r => r.id == ruleId);
		if (rule != null) {
	
			if (type == "raw") {
				let content = rule.itemsResults.map(x => {
					return `${x.value}`;
				}).join("\n");
				return content;

			} else if (type == "text") {
				let content = rule.itemsResults.filter(x => x.value != null).map(x => {
					return `${x.value}`;
				}).join("\n");
				return content;

			} else if (type == "xls") {
				let content = rule.itemsResults.map(x => {
					let name = x.item.name; 
					if (name != null) {
						name = name.replace(/\t/g, '');
					}
					let value = x.value;
					if (value != null) {
						value = value.replace(/\t/g, '');
					}
					return `${name}\t${value}`;
				}).join("\n");
				return content;

			} else if (type == "json") {
				let content = { "rule": rule.rule.name, items: [] };
				rule.itemsResults.forEach(x => {
					content.items.push({ "name": x.item.name, "value": x.value }); 
				});
				return JSON.stringify(content, null, 2);
			}
		}
	}
}

function createTitle(title) {
	let child = document.createElement("div");
	addClass(child, "tooltip-title");
	child.textContent = title;
	return child;
}

function createPanel(content, id) {
	let child = document.createElement("div");
	child.setAttribute("rule-id", id);
	addClass(child, "panel-tooltip");

	let child2 = document.createElement("div");
	addClass(child2, "panel-tooltip-content");
	child2.innerHTML = content;
	child.appendChild(child2);

	let child3 = document.createElement("div");
	addClass(child3, "panel-tooltip-toolbar");
	
	if (id != undefined) {
		let button1 = document.createElement("div");
		addClass(button1, "panel-icon");
		button1.textContent = "JSON";
		button1.setAttribute("type", "json");
		child3.appendChild(button1);
		let button2 = document.createElement("div");
		addClass(button2, "panel-icon");
		button2.textContent = "XLS";
		button2.setAttribute("type", "xls");
		child3.appendChild(button2);
		let button3 = document.createElement("div");
		addClass(button3, "panel-icon");
		button3.textContent = "RAW";
		button3.setAttribute("type", "raw");
		child3.appendChild(button3);
	}
	child.appendChild(child3);

	child.onclick = function(event) {
		let ruleId = event.target.getAttribute("rule-id");
		let type = "text";
		if (event.target.hasAttribute("type")) {
			type = event.target.getAttribute("type");
			ruleId = event.target.parentNode.parentNode.getAttribute("rule-id");
		}

		if (ruleId != undefined) {
			let content = getRuleContent(ruleId, type);
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
