/* 
 This code is published under CC BY-NC-ND 4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 @author: pdulvp@laposte.net
 */
var rules = [];

function updateRules(response, value, ccc) {
	rules = response.rules;
	var left = document.getElementById("left");
	var activeIds = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id"));
	while (left.firstChild) {
		left.removeChild(left.lastChild);
	}
	rules.forEach(rule => {
		var item = createRuleEntry(rule.name);
		item.setAttribute("rule-id", rule.id);
		left.appendChild(item);
	});
	Array.from(left.childNodes).filter(x => activeIds.includes(x.getAttribute("rule-id"))).forEach(x => addClass(x, "active"));
}

registerEditor(document.getElementById("left"), editor => {
	var lastActiveId = editor.getAttribute("rule-id");
	let rule = rules.find(r => r.id == lastActiveId);
	if (rule != null) {
		return rule.name;
	}
	return "";

}, editor => {
	var lastActiveId = editor.getAttribute("rule-id");
	let rule = rules.find(r => r.id == lastActiveId);
	if (rule != null) {
		rule.name = editor.value;
	}
});

document.getElementById("left").addEventListener("keydown", event => {
	if (event.code == "Delete") {
		var left = document.getElementById("left");
		var ruleIds = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id"));
		rules = rules.filter(x => !ruleIds.includes(x.id));
		updateRules({rules: rules});
	}
});

document.getElementById("left").addEventListener("click", event => {
	if (hasClass(event.target, "left-pane-item")) {
		var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
		Array.from(left.childNodes).forEach(x => removeClass(x, "active"));
		addClass(event.target, "active");
		clickOnRule(lastActiveId, event.target.getAttribute("rule-id"));
	}
});

var table = document.getElementById("table-cache");
table.addEventListener("click", event => {
	let target = event.target;
	if (hasClass(target, "table-column")) {
		target = target.parentNode;
	}
	if (hasClass(target, "table-row")) {
		Array.from(table.childNodes).forEach(x => removeClass(x, "active"));
		addClass(target, "active");
	}
});

registerEditor(document.getElementById("table-cache"), editor => {
	var left = document.getElementById("left");
	var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
	let rule = rules.find(r => r.id == lastActiveId);
	if (rule) {
		var lastItemId = editor.getAttribute("item-id");
		var itemData = editor.getAttribute("item-data");
		let item = rule.items.find(i => i.id == lastItemId);
		if (item != null) {
			return item[itemData];
		}
	}
	return "";

}, editor => {
	var left = document.getElementById("left");
	var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
	let rule = rules.find(r => r.id == lastActiveId);
	if (rule) {
		var lastItemId = editor.getAttribute("item-id");
		var itemData = editor.getAttribute("item-data");
		let item = rule.items.find(i => i.id == lastItemId);
		if (item != null) {
			item[itemData] = editor.value;
		}
	}
	return "";
});


document.getElementById("table-cache").addEventListener("keydown", event => {
	if (event.code == "Delete") {
		var left = document.getElementById("left");
		var cache = document.getElementById("table-cache");
		var itemIds = Array.from(cache.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("id"));
		var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
		let rule = rules.find(r => r.id == lastActiveId);
		rule.items = rule.items.filter(x => !itemIds.includes(x.id));
		updateRules({rules: rules});
		clickOnRule(lastActiveId, lastActiveId);
	}
});

if (document.getElementById("field-sitematch")) {
	document.getElementById("field-sitematch").oninput = function (event) {
		var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
		let rule = rules.find(r => r.id == lastActiveId);
		if (rule) {
			rule.sitematch = event.target.value;
		}
	};
}

function clickOnRule(previousRuleId, ruleId) {
	saveCurrentRule(previousRuleId);
	let rule = rules.filter(x => x.id == ruleId)[0];
	if (rule.sitematch) {
		document.getElementById("field-sitematch").value = rule.sitematch;
	}

	var table = document.getElementById("table-cache");
	while (table.childNodes.length > 1) {
		table.removeChild(table.lastChild);
	}
	if (rule.items) {
		rule.items.forEach(i => {
			table.appendChild(createCacheEntry(i));
		});
	}
}

function setItemResult(itemResult) {
	var table = document.getElementById("table-cache");
	var row = Array.from(table.childNodes).find(e => e.id == itemResult.id);
	let icon = Array.from(row.childNodes).find(e => e.getAttribute("class") == "table-column table-column-icon");
	let value = Array.from(row.childNodes).find(e => e.getAttribute("class") == "table-column table-column-value");
	if (icon) {
		if (itemResult.valid) {
			addClass(row, "valid");
			addClass(icon, "icon-valid");
			value.textContent = itemResult.value;
		} else {
			addClass(row, "warning");
			addClass(icon, "icon-warning");
			value.textContent = " ";
		}
	}
}

function saveCurrentRule(ruleId) {
	if (ruleId) {
		let rule = rules.find(r => r.id == ruleId);
		if (rule) {
			if (document.getElementById("field-sitematch")) {
				rule.sitematch = document.getElementById("field-sitematch").value;
			}
		}
	}
}

function createRuleEntry(label) {
    var node = document.createElement("input");
	addClass(node, "left-pane-item");
	node.value = label;
	node.setAttribute("readonly", "readonly");
	return node;
}

function createCacheEntry(item) {
	let node = document.createElement("div");
	node.setAttribute("id", item.id);
	addClass(node, "table-row");

	let child = null;
	child = document.createElement("div");
	addClass(child, "table-column table-column-icon");
	child.textContent = item.icon;
	node.appendChild(child);

	child = document.createElement("input");
	addClass(child, "table-column table-column-name");
	child.setAttribute("item-id", item.id);
	child.setAttribute("item-data", "name");
	child.value = item.name;
	child.setAttribute("readonly", "readonly");
	node.appendChild(child);

	child = document.createElement("input");
	child.setAttribute("type", "text");
	addClass(child, "table-column table-column-xpath");
	child.setAttribute("item-id", item.id);
	child.setAttribute("item-data", "xpath");
	child.value = item.xpath;
	child.setAttribute("readonly", "readonly");
	node.appendChild(child);

	child = document.createElement("div");
	addClass(child, "table-column table-column-value");
	child.textContent = "";
	node.appendChild(child);

	return node;
}


registerDropdownMenu(document.getElementById("button-inspect"), document.getElementsByClassName("popup-menu")[0], (menu) => {
	return new Promise((resolve, reject) => {
		while (menu.firstChild) {
			menu.removeChild(menu.lastChild);
		}
		var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
		let rule = rules.find(r => r.id == lastActiveId);
		if (rule) {
			browser.tabs.query({}, (tabs) => {
				tabs = tabs.filter(t => t.url == rule.sitematch);
				if (tabs.length == 0) {
					let child = document.createElement("div");
					addClass(child, "menuitem-iconic");
					child.setAttribute("enabled", "false");
					child.textContent = "There is opened tab matching this rule";
					menu.appendChild(child);
				} else {
					tabs.forEach(t => {
						let child = document.createElement("div");
						addClass(child, "menuitem-iconic");
						child.setAttribute("tab-id", t.id);
						child.textContent = t.title;
						menu.appendChild(child);
					});
				}
				resolve();
			});
		}
	});
}, event => {
	console.log(event);
	let tabId = event.target.getAttribute("tab-id");
	browser.tabs.query({}, (tabs) => {
		console.log(tabs);
		let tab = tabs.filter(x => x.id == tabId).find(x => true);
		var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
		var sending = browser.tabs.sendMessage(tab.id, { "action": "highlight", rule: rules.find(r => r.id == lastActiveId) } );
		sending.then(result => {
			result.rulesResults.find(r => r.id == lastActiveId).itemsResults.forEach(itemResult => {
				console.log(itemResult);
				setItemResult(itemResult);
			});
		}, x => {});
		//sendResponse({"response": "wait", "action" : request.action }); 

	});


});


//registerDropdownMenu(document.getElementById("button-variables"), document.getElementsByClassName("popup-menu")[0], clickPopupItem);

function clickPopupItem(event) {
	console.log(event);
}

 document.getElementById("button-ok").onclick = function (event) {
	browser.storage.local.set({
		"rules": rules
	}).then(() => {
		browser.storage.onChanged.removeListener(logStorageChange);
		window.close();
	}, (error) => {
		console.log(error);
		browser.storage.onChanged.removeListener(logStorageChange);
		window.close();
	});
 };

 document.getElementById("button-cancel").onclick = function (event) {
	browser.storage.onChanged.removeListener(logStorageChange);
	window.close();
 };

 document.getElementById("button-new-rule").onclick = function (event) {
	console.log(rules);
	let ruleName = "Rule #"+(rules.length+1);
	rules.push({ id: uuidv4(), name: ruleName, sitematch: "", items: [] });
	updateRules( { rules: rules } );
 };

 document.getElementById("button-new-item").onclick = function (event) {
	var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
	let rule = rules.find(r => r.id == lastActiveId);
	if (rule) {
		rule.items.push({ id: uuidv4(), name: "Item", xpath: "" });
	}
	updateRules( { rules: rules } );
	clickOnRule(lastActiveId, lastActiveId);
 };
 
function restoreOptions() {
	var lastActiveId = Array.from(left.childNodes).filter(x => hasClass(x, "active")).map(x => x.getAttribute("rule-id")).find(x => true);
	let rule = rules.find(r => r.id == lastActiveId);
	
	browser.storage.local.get('rules').then((res) => {
		if (res.rules && Array.isArray(res.rules)) {
			updateRules( { rules: res.rules } );
			if (rule) {
				clickOnRule(lastActiveId, lastActiveId);
			}
		} else {
			updateRules( { rules: [] } );
			if (rule) {
				clickOnRule(lastActiveId, lastActiveId);
			}
		}
	}, (error) => {
		updateRules( { rules: [] } );
		if (rule) {
			clickOnRule(lastActiveId, lastActiveId);
		}
	});
}

function logStorageChange(changes) {
	restoreOptions();
}

document.addEventListener('DOMContentLoaded', restoreOptions);
browser.storage.onChanged.addListener(logStorageChange);
// var sending = browser.runtime.sendMessage( { "action": "callback" } );
// sending.then( updateRules , function (error) {});
