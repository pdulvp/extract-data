/* 
 This Code is published under the terms and conditions of the CC-BY-NC-ND-4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 SPDX-License-Identifier: CC-BY-NC-ND-4.0
 @author: pdulvp@laposte.net
 */
var Rules = null;
var Results = null;

var browser = compat.adaptBrowser();

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

			if (ree != null && ree.result != null) {
				let matchingRules = ree.result.rulesResults.filter(r => {
					let rule = findRule(r.id);
					if (rule == null) {
						return false;
					}
					if (!common.doesMatch(tabUrl, rule.sitematch)) {
						return false;
					}
					return true;
				});

				if (matchingRules.length == 0) {
					let noRuleMsg = browser.i18n.getMessage("no_rule_for_tab");
					let panel = createPanel(createTitle(noRuleMsg));
					common.addClass(panel, "panel-tooltip-error");
					document.getElementById("panel").insertBefore(panel, menu);
					return;
				}

				let rulesRenders = matchingRules.map(r => {
					let rule = findRule(r.id);
					let items = r.itemsResults.filter(x => x.value != null);
					if (items.length > 0) {
						let contents = [ createTitle(rule.name, rule.id) ];
						items.forEach(x => {
							contents.push(createValue(x.value, rule.id));
						})
						return createPanel(createContent(contents, rule.id), rule.id);
					} else {
						let contents = [ createTitle(rule.name, rule.id), createValue(browser.i18n.getMessage("no_result"), rule.id) ];
						return createPanel(createContent(contents, rule.id), rule.id);
					}

				}).filter(x => x != null);

				if (rulesRenders.length == 0) {
					let noRuleMsg = browser.i18n.getMessage("no_rule_for_tab");
					let panel = createPanel(createTitle(noRuleMsg));
					common.addClass(panel, "panel-tooltip-error");
					document.getElementById("panel").insertBefore(panel, menu);
				} else {
					rulesRenders.map(v => {
						document.getElementById("panel").insertBefore(v, menu);
					});
				}
				return;
			}

			let noRuleMsg = browser.i18n.getMessage("no_rule_for_tab");
			let panel = createPanel(createTitle(noRuleMsg));
			common.addClass(panel, "panel-tooltip-error");
			document.getElementById("panel").insertBefore(panel, menu);
			
		}, e => {
			let errorMsg = browser.i18n.getMessage("error_occured");
			let panel = createPanel(createTitle(errorMsg));
			common.addClass(panel, "panel-tooltip-error");
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
						value = value.toString().replace(/\t/g, '');
					}
					return `${name}\t${value}`;
				}).join("\n");
				return content;

			} else if (type == "json") {
				let content = { "rule": rule.rule.name, items: [] };
				rule.itemsResults.forEach(x => {
					content.items.push({ "name": x.item.name, "value": x.value.join(", "), "values": x.value }); 
				});
				return JSON.stringify(content, null, 2);
			}
		}
	}
}

function createTitle(title, ruleId) {
	let child = document.createElement("div");
	if (ruleId != undefined) {
		child.setAttribute("rule-id", ruleId);
	}
	common.addClass(child, "tooltip-title");
	child.textContent = title;
	return child;
}

function createValue(value, ruleId) {
	let child = document.createElement("div");
	if (ruleId != undefined) {
		child.setAttribute("rule-id", ruleId);
	}
	common.addClass(child, "tooltip-value");
	child.textContent = value;
	return child;
}

function createContent(content, ruleId) {
	let child = document.createElement("div");
	if (ruleId != undefined) {
		child.setAttribute("rule-id", ruleId);
	}
	common.addClass(child, "tooltip-content");
	if (Array.isArray(content)) {
		content.forEach(c => {
			child.appendChild(c);
		});
	} else {
		child.appendChild(content);
	}
	return child;
}

function createPanel(content, id) {
	let child = document.createElement("div");
	child.setAttribute("rule-id", id);
	common.addClass(child, "panel-tooltip");

	let child2 = document.createElement("div");
	common.addClass(child2, "panel-tooltip-content");
	if (Array.isArray(content)) {
		content.forEach(c => {
			child2.appendChild(c);
		});
	} else {
		child2.appendChild(content);
	}
	child.appendChild(child2);

	let child3 = document.createElement("div");
	common.addClass(child3, "panel-tooltip-toolbar");
	
	if (id != undefined) {
		let button1 = document.createElement("div");
		common.addClass(button1, "panel-icon");
		button1.textContent = "JSON";
		button1.setAttribute("type", "json");
		child3.appendChild(button1);
		let button2 = document.createElement("div");
		common.addClass(button2, "panel-icon");
		button2.textContent = "XLS";
		button2.setAttribute("type", "xls");
		child3.appendChild(button2);
		let button3 = document.createElement("div");
		common.addClass(button3, "panel-icon");
		button3.textContent = "RAW";
		button3.setAttribute("type", "raw");
		child3.appendChild(button3);

		let button4 = document.createElement("div");
		common.addClass(button4, "panel-icon");
		button4.textContent = "EDIT";
		button4.setAttribute("type", "edit");
		child3.appendChild(button4);
	}
	child.appendChild(child3);

	let proceed = function(event) {
		console.log(event);
		let type = "text";
		let root = event.target.closest(".panel-tooltip"); 
		let ruleId = root.getAttribute("rule-id");
		if (event.target.hasAttribute("type")) {
			type = event.target.getAttribute("type");
		}

		if (ruleId != undefined) {
			if (type == "edit") {
				common.openOptions(ruleId);
				return;
			}
			let content = getRuleContent(ruleId, type);

			if (event.button == 1 && type == "json") {
				const blob = new Blob([content], {type: 'application/json;charset=utf-8'});
				const url = URL.createObjectURL(blob);
				var creating = browser.tabs.create(
					{url: url}
				);

			} else {
				common.copyToClipboard(content);
				browser.notifications.create(common.uuidv4(), {
					"type": "basic",
					"iconUrl" : browser.extension.getURL("icons/icon.svg"),
					"title": browser.i18n.getMessage("notification_copied_title"),
					"message": browser.i18n.getMessage("notification_copied_description"),
				}).then(e => {
					window.close();
					  setTimeout(ee => {
						browser.notifications.clear(e);
					  }, 2000);
				});
			}
		}
	};

	child.onclick = proceed;
	child.onauxclick = proceed;
	return child;
}

document.addEventListener('DOMContentLoaded', restoreOptions);

document.getElementById("menu-editrules").onclick = function (event) {
	common.openOptions();
};
document.getElementById("menu-editrules").textContent = browser.i18n.getMessage("popup_edit_rules");

if ( document.getElementById("menu-configure") != null) {
	document.getElementById("menu-configure").onclick = function (event) {
		browser.runtime.common.openOptionsPage();
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
