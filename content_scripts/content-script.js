/* 
 This Code is published under the terms and conditions of the CC-BY-NC-ND-4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 SPDX-License-Identifier: CC-BY-NC-ND-4.0
 @author: pdulvp@laposte.net
 */

var common = (typeof module === "object") ? require("../ui/common") : common;
var browser = compat.adaptBrowser();
let clickedElement;

 let rightClickEventListener = function(event) {
    if (event.button == 2) { //right click
		clickedElement = event.target;
		const sending = browser.runtime.sendMessage({ action: "setClickedElement" });
		sending.then(x => {}, x => {}); 
    }
};

let currentObserver = null;

var mutationObserver = new MutationObserver(function(mutations) {
	// Avoid computation if there is changes between 200ms
	if (currentObserver != null) {
		clearTimeout(currentObserver);
	}
	currentObserver = setTimeout(reloadResults, 200);
});

mutationObserver.observe(document.documentElement, {
	childList: true,
	subtree: true,
	attributes: false,
	characterData: true
});

function reloadResults() {
	currentObserver = null;
	let resend = function(result) {
		const sending = browser.runtime.sendMessage({ action: "setResult", result: result});
		sending.then(x => {}, x => {}); 
	}
	common.rules.matchingRules(document.URL).then(rules => {
		resend(evaluateResults( rules ));

	});
}

function handleMessage(request, sender, sendResponse) {
	if (request.action == "highlight") {
		let result = evaluateResults( [ request.rule ] )
		highlightResult(result);
		sendResponse( result );
		
	} else if (request.action == "reloadResults") {
		console.log("Receive on tab: reloadResults");
		reloadResults();
		
	} else if (request.action == "getContextMenuContext") {
		if (clickedElement != null) {
			highlight(clickedElement);
		}
		sendResponse( { expression: getXPathForElement(clickedElement, document) } );
	}
}

function evaluateResults(rules) {
	let results = rules.map(r => {
		let items = r.items.map(i => {
			let elements = getElementsByExpression(i.expression);
			let value = null;
			if (elements != null) {
				value = elements.map(e => {
					if (e === null) {
						return null;
					} else if (typeof e === 'object') {
						if (!(e.tagName) && e.ownerElement != null && e.ownerElement.hasAttribute(e.nodeName)) {
							return e.ownerElement[e.nodeName];
							
						} else if (e.tagName) {
							if (e.tagName.toLowerCase() == "input") {
								return e.value;
							} else if (e.tagName.toLowerCase() == "meta") {
								return e.content;
							} else if (e.textContent) {
								return e.textContent;
							}
						}

					} else if (typeof e === 'string') {
						return e;
					}
					return e;
				});
			}
			return { id: i.id, item: i, valid: elements != null, value: value } ;
		});
		return { id: r.id, rule: r, itemsResults: items } ;
	});
	return { rulesResults: results };
}

function highlightResult(result) {
	result.rulesResults.forEach(rule => {
		rule.itemsResults.forEach(i => {
			let elements = getElementsByExpression(i.item.expression);
			if (elements != null) {
				elements.forEach(e => highlight(e));
			}
		});
	});
}

function highlight(element) {
	if (element != undefined && !element.tagName) {
		element = element.ownerElement;
	}
	if (element != undefined && element.tagName) {
		if (!element.hasAttribute("previous")) {
			element.setAttribute("previous", element.getAttribute("style"));
		}
		element.setAttribute("style", "background-color: red; border: 5px solide red;");
		setTimeout(e => {
			let previous = element.getAttribute("previous");
			if (previous != null) {
				element.setAttribute("style", previous);
			} else {
				element.removeAttribute("style");
				element.removeAttribute("previous");
			}
		}, 1000);
	}
}

browser.runtime.onMessage.addListener(handleMessage);

function getElementsByExpression(path) {
	let result = null;
	if (path == null || path.length == 0) {
		console.log("no path to evaluate");
		return result;
	}
	if (result == null || result.length == 0) {
		result = getElementsByPredefinedExpression(path);
	}
	if (result == null || result.length == 0) {
		result = getElementsByXpath(path);
	}
	if (result == null || result.length == 0) {
		result = getElementsBySelector(path);
	}
	return result;
}

function getElementsByPredefinedExpression(path) {
	let object = {
		document: () => { return {
			location: () => { return {
				href: () => { return document.location.href },
				protocol: () => { return document.location.protocol },
				host: () => { return document.location.host },
				hostname: () => { return document.location.hostname },
				hash: () => { return document.location.hash },
				port: () => { return document.location.port },
				pathname: () => { 
					let result = {
						toString: () => { return document.location.pathname }
					};
					let i = 0;
					document.location.pathname.substring(1).split("/").forEach(x => {
						result[""+i]=() => { return x; };
						i++;
					});
					return result;
				},
				search: () => {
					let result = {
						toString: () => { return document.location.search }
					};
					let params = new URLSearchParams(document.location.search.substring(1));
					for (const [key, value] of params) {
						result[key]=() => { return value; };
					}
					return result;
				},
				origin: () => { return document.location.origin },
				toString: () => { return document.location.toString() }
			} }
		} }
	};
	try {
		let root = object;
		let evaluation = path.split(".");
		for (i = 0; i < evaluation.length; ++i) {
			if (root != undefined) {
				let t = evaluation[i];
				let t2= root[t];
				if (t2 != undefined) {
					root = t2();
				} else {
					return null;
				}
			}
		}
		if (typeof root === 'object' && root != undefined) {
			root = root.toString();
		}
		let result = [];
		result.push(root);
		return result;
	} catch(e) {
		return null;
	}
}

function getElementsBySelector(path) {
	try {
		let evaluation = document.querySelectorAll(path);
		let result = [];
		for (i = 0; i < evaluation.length; ++i) {
			result.push(evaluation[i]);
		}
		return result;

	} catch(e) {
		return null;
	}
}

function getElementsByXpath(path) {
	try {
		let evaluation = document.evaluate(path, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		let result = [];
		for (var i = 0; i < evaluation.snapshotLength; i++) {
			var node = evaluation.snapshotItem(i);
			result.push(node);
		}
		return result;

	} catch(e) {
		return null;
	}
}

function getXPathForElement(el, xml) {
	let value = function(e) {
		let path = e.nodeName.toLowerCase();
		let sameType = Array.from(e.parentNode.childNodes).filter(x => x.nodeType === 1 && x.nodeName == e.nodeName);
		if (sameType.length > 1) {
			return path + "["+(sameType.indexOf(e)+1)+"]";
		}
		return path;
	};

	var xpath = '';
	while(el !== xml.documentElement) {
		xpath = value(el)+`/${xpath}`;
		el = el.parentNode;
	}

	xpath = value(xml.documentElement)+`/${xpath}`;
	xpath = xpath.replace(/\/$/, '');
	return xpath;
}


common.storage.addRulesChangedListener(reloadResults);
document.addEventListener("mousedown", rightClickEventListener, true);

reloadResults();