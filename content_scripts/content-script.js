/* 
 This code is published under CC BY-NC-ND 4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 @author: pdulvp@laposte.net
 */
 let clickedElement;

function restoreOptions() {
	browser.storage.local.get('rules').then((res) => {
		if (res.rules && Array.isArray(res.rules)) {
			updateRules( { rules: res.rules} );
		} else {
			updateRules( { rules: []} );
		}
	}, (error) => {
		updateRules( { rules: []} );
	});
}

function handleMessage(request, sender, sendResponse) {
	if (request.action == "highlight") {
		let elements = request.rule.items.map(i => {
			let element = getElementByXpath(i.xpath);
			let value = null;
			if (element != null) {
				value = element.textContent;
			}
			return { id: i.id, element: getElementByXpath(i.xpath), value: value };
		});
		elements.filter(e => e.element != null).forEach(i => {
			highlight(i.element);
		});
		elements = elements.map( i => {
			return { id: i.id, valid: i.element != null, value: i.value }
		} );
		sendResponse( elements );

	} else if (request.action == "getContextMenuContext") {
		if (clickedElement != null) {
			highlight(clickedElement);
		}
		sendResponse( { xpath: getXPathForElement(clickedElement, document) } );
	}
}

function highlight(element, timeout) {
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

function updateRules(storage) {
	let results = storage.rules.filter(r => document.URL == r.sitematch).map(r => {
		let items = r.items.map(i => {
			let res = getElementByXpath(i.xpath);
			if (res != null) {
				return { id: i.id, name: i.name, value: res.textContent } ;
			}
			return { id: i.id, value: null } ;
		});
		return { id: r.id, items: items } ;
	});

	const sending = browser.runtime.sendMessage({ "action": "setResult", "rules": results});
	sending.then(x => {}, x => {}); 
}

setTimeout(restoreOptions, 2000);


document.addEventListener("mousedown", function(event) {
    if(event.button == 2) { //right click
		clickedElement = event.target;

		const sending = browser.runtime.sendMessage({ "action": "setClickedElement" });
		sending.then(x => {}, x => {}); 
    }
}, true);