/* 
 This Code is published under the terms and conditions of the CC-BY-NC-ND-4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 SPDX-License-Identifier: CC-BY-NC-ND-4.0
 @author: pdulvp@laposte.net
 */


var browser = adaptBrowser();
let clickedElement;

 let clickListener = function(event) {
    if (event.button == 2) { //right click
		clickedElement = event.target;
		const sending = browser.runtime.sendMessage({ "action": "setClickedElement" });
		sending.then(x => {}, x => {}); 
    }
};

let currentObserver = null;

var mutationObserver = new MutationObserver(function(mutations) {
	// Avoid computation if there is changes between 200ms
	if (currentObserver != null) {
		clearTimeout(currentObserver);
	}
	currentObserver = setTimeout(restoreOptions, 200);
});

function restoreOptions() {
	currentObserver = null;
	let resend = function(result) {
		const sending = browser.runtime.sendMessage({ "action": "setResult", "result": result});
		sending.then(x => {}, x => {}); 
	}
	browser.storage.local.get('rules').then((res) => {
		if (res.rules && Array.isArray(res.rules)) {
			
			mutationObserver.observe(document.documentElement, {
				childList: true,
				subtree: true,
				attributes: false,
				characterData: true
			});

			resend(getRulesResult( { rules: res.rules} ));
		} else {
			resend(getRulesResult( { rules: []} ));
		}
	}, (error) => {
		resend(getRulesResult( { rules: []} ));
	});
}

function handleMessage(request, sender, sendResponse) {
	if (request.action == "highlight") {
		let result = getRulesResult( { rules: [ request.rule ] } )
		highlightResult(result);
		sendResponse( result );

	} else if (request.action == "getContextMenuContext") {
		if (clickedElement != null) {
			highlight(clickedElement);
		}
		sendResponse( { xpath: getXPathForElement(clickedElement, document) } );
	}
}

function getRulesResult(storage) {
	let results = storage.rules.filter(r => doesMatch(document.URL, r.sitematch)).map(r => {
		let items = r.items.map(i => {
			
			let elements = getElementsByXpath(i.xpath);
			let value = null;
			if (elements != null) {
				value = elements.map(e => e.textContent);
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
			let elements = getElementsByXpath(i.item.xpath);
			if (elements != null) {
				elements.forEach(e => highlight(e));
			}
		});
	});
}

function highlight(element) {
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

browser.runtime.onMessage.addListener(handleMessage);

function getElementsByXpath(path) {
	try {
		if (path == null || path.length == 0) {
			console.log("no path to evaluate");
			return null;
		}
		let evaluation = document.evaluate(path, document, null, XPathResult.ANY_TYPE, null);
		var node, result = []
		while (node = evaluation.iterateNext())
			result.push(node);
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


browser.storage.onChanged.addListener(restoreOptions);
document.addEventListener("mousedown", clickListener, true);

restoreOptions();