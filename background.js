/* 
 This code is published under CC BY-NC-ND 4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 @author: pdulvp@laposte.net
 */
var results = [];

function handleMessage(request, sender, sendResponse) {
	if (request.action == "setResult") {
		console.log("background");
		console.log(request);
		console.log(sender);
		results[sender.tab.id] = request.rules;
		updateBadge(sender.tab.id);

	} else if (request.action == "getResult") {
		sendResponse({rules: results[request.tabId]});

	} else if (request.action == "setClickedElement") {
		updateContextMenu(sender.tab);
	}
}

function updateBadge(tabId) {
	if (results[tabId] != null) {
		let len = results[tabId].length;
		if (len != 0) {
			browser.browserAction.setBadgeBackgroundColor({ color: "#29c74b" });
			browser.browserAction.setBadgeTextColor({ color: "#FFFFFF" });
			browser.browserAction.setBadgeText({ text: ""+len, tabId: tabId });
		} else {
			browser.browserAction.setBadgeText({ text: "", tabId: tabId });
		}
	} else {
		browser.browserAction.setBadgeText({ text: "", tabId: tabId });
	}
}

browser.runtime.onMessage.addListener(handleMessage);

function onStorageChange() {
	getStoredRules(updateRules);
}

browser.storage.onChanged.addListener(onStorageChange);
onStorageChange();

function getStoredRules(callback) {
	browser.storage.local.get('rules').then((res) => {
		if (res.rules && Array.isArray(res.rules)) {
			callback( { rules: res.rules } );
		} else {
			callback( { rules: [] } );
		}
	}, (error) => {
		callback( { rules: [] } );
	});
}

function createNewRule(event, tabId) {
	getStoredRules(storage => {
		let ruleName = "Rule #"+(storage.rules.length+1);
		let storedRule = { id: uuidv4(), name: ruleName, sitematch: event.pageUrl, items: [] };
		storage.rules.push(storedRule);

		let itemName = "Item #"+(storedRule.items.length+1);
		let item = { id: uuidv4(), name: itemName, xpath: "" };
		storedRule.items.push(item);
		
		var sending = browser.tabs.sendMessage(tabId, { "action": "getContextMenuContext" } );
		sending.then(element => {
			item.xpath = element.xpath;
			storeRules( storage );
		}, x => {
			storeRules( storage );
		});
	});
}

function createNewItem(event, rule, tabId) {
	console.log(event);
	getStoredRules(storage => {
		let storedRule = storage.rules.find(r => r.id == rule.id);
		if (storedRule != null) {
			let itemName = "Item #"+(storedRule.items.length+1);
			let item = { id: uuidv4(), name: itemName, xpath: "" };
			storedRule.items.push(item);

			var sending = browser.tabs.sendMessage(tabId, { "action": "getContextMenuContext" } );
			sending.then(element => {
				item.xpath = element.xpath;
				storeRules( storage );
			}, x => {
				storeRules( storage );
			});

		}
	});
}

function storeRules(storage) {
	browser.storage.local.set(storage).then(() => {
		console.log("ok");
	}, (error) => {
		console.log(error);
	});
}

function updateRules(storage) {
	browser.contextMenus.create({
		id: `menu-new-rule`,
		title: `Create a new rule`,
		contexts: ["all"],
	});
	if (storage.rules.length > 0) {
		browser.contextMenus.create({
			id: `menu-new-rule-separator`,
			type: "separator",
			contexts: ["all"],
		});
	}
	storage.rules.forEach(rule => {
		browser.contextMenus.create({
			id: `menu-${rule.id}`,
			title: `${rule.name}`,
			contexts: ["all"],
		});
		
		browser.contextMenus.create({
			id: `menu-new-item-${rule.id}`,
			parentId: `menu-${rule.id}`,
			title: `Create a new item`,
			contexts: ["all"],
		});
		if (rule.items.length > 0) {
			browser.contextMenus.create({
				id: `menu-new-item-separator-${rule.id}`,
				parentId: `menu-${rule.id}`,
				type: "separator",
				contexts: ["all"],
			});
		}
		rule.items.forEach(item => {
			console.log(item);
			browser.contextMenus.create({
				id: `menu-${item.id}`,
				parentId: `menu-${rule.id}`,
				title: `${item.name}`,
				contexts: ["all"],
			});
		});
	});
}

function updateContextMenu(tab) {
	getStoredRules(storage => {
		let anyMatch = false;

		storage.rules.forEach(rule => {
			let match = tab.url == rule.sitematch;
			if (match) {
				anyMatch = true;
			}
			browser.contextMenus.update(`menu-${rule.id}`, {
				visible: match
			});
			
			browser.contextMenus.update(`menu-new-rule`, {
				onclick: e => {
					createNewRule(e, tab.id);
				}
			});
			browser.contextMenus.update(`menu-new-item-${rule.id}`, {
				onclick: e => {
					createNewItem(e, rule, tab.id);
				}
			});
			rule.items.forEach(item => {
				//let itemValid = tab.url == rule.sitematch;
				//browser.contextMenus.update(`menu-${item.id}`, {
				//	icon: "ui/accept.png"
				//});
			});
		});

		browser.contextMenus.update(`menu-new-rule-separator`, {
			visible: anyMatch
		});
	});
}


browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "xxxx-clipboard") {
		console.log(tab);
		console.log(info);
		var sending = browser.tabs.sendMessage(tab.id, { "action": "getContextMenuContext" } );
		sending.then(elements => {
			console.log(elements);
		}, x => {});
	}
});



function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}