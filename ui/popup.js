/* 
 This Code is published under the terms and conditions of the CC-BY-NC-ND-4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 SPDX-License-Identifier: CC-BY-NC-ND-4.0
 @author: pdulvp@laposte.net
 */
var browser = compat.adaptBrowser();

function reloadRules() {
	var table = document.getElementById("panel");
	while (table.childNodes.length > 1) {
		table.removeChild(table.firstChild);
	}

	let menu = document.getElementById("menu-editrules");
	getResultOfActiveTab().then(results => {
		
		if (results.rulesResults.length == 0) {
			let noRuleMsg = browser.i18n.getMessage("no_rule_for_tab");
			let panel = createPanel(createTitle(noRuleMsg));
			common.addClass(panel, "panel-tooltip-error");
			document.getElementById("panel").insertBefore(panel, menu);
			return;
		}
	
		let rulesRenders = results.rulesResults.filter(r => r.rule.realId == undefined).map(r => {
			let rule = r.rule;
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

	}).catch(e => {
		let noRuleMsg = browser.i18n.getMessage("no_rule_for_tab");
		let panel = createPanel(createTitle(noRuleMsg));
		common.addClass(panel, "panel-tooltip-error");
		document.getElementById("panel").insertBefore(panel, menu);
	});
}

function getResult(tabId) {
	return browser.runtime.sendMessage( { action: "getResult", tabId: tabId } );
}

function getActiveTabId() {
	return new Promise((resolve, reject) => {
		browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			let tabId = tabs[0].id;
			resolve(tabId);
		});
	});
}

function getResultOfActiveTab() {
	return getActiveTabId().then(tabId => {
		return getResult(tabId);
	});
}

function getRuleContent(ruleId, type) {
	if (ruleId != null) {
		return getResultOfActiveTab().then((results) => {
			console.log(results);
			let ruleResult = results.rulesResults.find(r => r.id == ruleId);
			return common.results.toContent(ruleResult, type);
		});
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
		common.results.types.forEach(t => {
			let button = document.createElement("div");
			common.addClass(button, "panel-icon");
			button.textContent = t.toUpperCase();
			button.setAttribute("type", t.toLowerCase());
			child3.appendChild(button);
		})

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
			getRuleContent(ruleId, type).then(content => {
				
				if (event.button == 1 && type == "json") {
					const blob = new Blob([content], {type: 'application/json;charset=utf-8'});
					const url = URL.createObjectURL(blob);
					browser.tabs.create(
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
			});
		}
	};

	child.onclick = proceed;
	child.onauxclick = proceed;
	return child;
}

document.addEventListener('DOMContentLoaded', reloadRules);

document.getElementById("menu-editrules").onclick = function (event) {
	common.openOptions();
};
document.getElementById("menu-editrules").textContent = browser.i18n.getMessage("popup_edit_rules");

if ( document.getElementById("menu-configure") != null) {
	document.getElementById("menu-configure").onclick = function (event) {
		browser.runtime.openOptionsPage();
	};
}
 
function handleMessage(request, sender, sendResponse) {
	if (request.action == "onResultChange") {
		reloadRules();
	}
}

browser.runtime.onMessage.addListener(handleMessage);
common.storage.addRulesChangedListener(reloadRules);
