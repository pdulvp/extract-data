/* 
 This code is published under CC BY-NC-ND 4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 @author: pdulvp@laposte.net
 */
 let clickedElement;

function restoreOptions() {
	let resend = function(result) {
		const sending = browser.runtime.sendMessage({ "action": "setResult", "result": result});
		sending.then(x => {}, x => {}); 
	}
	browser.storage.local.get('rules').then((res) => {
		if (res.rules && Array.isArray(res.rules)) {
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
	let results = storage.rules.filter(r => document.URL == r.sitematch).map(r => {
		let items = r.items.map(i => {
			let element = getElementByXpath(i.xpath);
			let value = null;
			if (element != null) {
				value = element.textContent;
			}
			return { id: i.id, item: i, valid: element != null, value: value } ;
		});
		return { id: r.id, rule: r, itemsResults: items } ;
	});
	return { rulesResults: results };
}

function highlightResult(result) {
	result.rulesResults.forEach(rule => {
		rule.itemsResults.forEach(i => {
			let element = getElementByXpath(i.item.xpath);
			if (element != null) {
				highlight(element);
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

function getElementByXpath(path) {
	return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

//https://developer.mozilla.org/en-US/docs/Web/XPath/Snippets#getXPathForElement
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

setTimeout(restoreOptions, 2000);

document.addEventListener("mousedown", function(event) {
    if(event.button == 2) { //right click
		clickedElement = event.target;
		const sending = browser.runtime.sendMessage({ "action": "setClickedElement" });
		sending.then(x => {}, x => {}); 
    }
}, true);