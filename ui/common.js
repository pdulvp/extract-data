/* 
 This Code is published under the terms and conditions of the CC-BY-NC-ND-4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 SPDX-License-Identifier: CC-BY-NC-ND-4.0
 @author: pdulvp@laposte.net
 */

var compat = (typeof module === "object") ? require("./compat") : compat;
var browser = compat.adaptBrowser();

var common = {
	
	hasClass: (item, value) => {
		return item.getAttribute("class") != null && (item.getAttribute("class").includes(value));
	},
	
	removeClass: (item, value) => {
		if (common.hasClass(item, value)) {
			item.setAttribute("class", item.getAttribute("class").replace(value, "").trim());
		}
	},

	addClass: (item, value) => {
		if (!common.hasClass(item, value)) {
			let current = item.getAttribute("class");
			current = current == null ? "" : current;
			item.setAttribute("class", (current+ " "+value+" ").trim());
		}
	},

	registerDropdownMenu: (button, menu, onopening, dispatch) => {
		document.addEventListener("click", event => {
			if (!event.target.hasAttribute("data-menu") && !menu.contains(event.target)) {
				menu.setAttribute("style", `display:none;`);
			}
		});
		
		let displayPopup = function (event) {
			
			let opening = onopening == null ? new Promise( x => true ) : onopening;
			opening(menu).then(() =>  {
				let top = event.target.offsetTop + event.target.offsetHeight - 1;
				let size = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--popup-width'), 10);
				let left = event.target.offsetLeft - size + event.target.offsetWidth;
				let attr = `display:block; left:${left}px; top:${top}px;`;
				menu.setAttribute("style", attr);
				menu.addEventListener("click", menuEvent => {
					menu.setAttribute("style", `display:none;`);
					dispatch(menuEvent);
				}, { useCapture: true } );
			});
		};

		button.addEventListener("click", displayPopup, { useCapture: true } );
	},

	uuidv4: () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
		});
	},

	copyToClipboard: (text, html) => {
		function oncopy(event) {
			document.removeEventListener("copy", oncopy, true);
			// Hide the event from the page to prevent tampering.
			event.stopImmediatePropagation();

			// Overwrite the clipboard content.
			event.preventDefault();
			event.clipboardData.setData("text/plain", text);
			//event.clipboardData.setData("text/html", html);
		}
		document.addEventListener("copy", oncopy, true);

		// Requires the clipboardWrite permission, or a user gesture:
		document.execCommand("copy");
	},

	registerEditor: (element, cancel, save) => {

		let currentEditor = null;

		let editorStartEdit = function (event) {
			editorCancel(event);
			if (event.target.hasAttribute("readonly")) {
				event.target.removeAttribute("readonly");
				event.target.addEventListener("focusout", editorValidate, { once: true });
				event.target.setSelectionRange(0, event.target.value.length);
				currentEditor = event.target;
			}
		};

		let editorValidate = function (event) {
			if (currentEditor != null) {
				save(currentEditor);
				currentEditor.setAttribute("readonly", "readonly");
				currentEditor.setSelectionRange(0, 0);
				currentEditor = null;
				element.removeEventListener("keydown", keyListener);
			}
		}

		let editorCancel = function (event) {
			if (currentEditor != null) {
				let value = cancel(currentEditor);
				currentEditor.value = value;
				currentEditor.setAttribute("readonly", "readonly");
				currentEditor.setSelectionRange(0, 0);
				currentEditor = null;
				element.removeEventListener("keydown", keyListener);
			}
		}

		let keyListener = event => {
			if (event.code == "Delete" && currentEditor != null) {
				event.stopImmediatePropagation();

			} else if (event.code == "F2") {
				editorStartEdit(event);

			} else if (event.code == "Enter") {
				editorValidate(event);

			} else if (event.code == "Escape") {
				editorCancel(event);
			}
		};
		
		element.addEventListener("keydown", keyListener, { capture : true });

		element.addEventListener("dblclick", event => {
			editorStartEdit(event);
		});
	},

	doesMatch: (url, sitematch) => {
		if (sitematch == undefined || sitematch.length == 0) {
			return false;
		}
		return new RegExp(sitematch).test(url);
	},

	openOptions: (initialRuleId, initialItemId) => {
		let query = "";
		if (initialRuleId != undefined) {
			query += `?initialRule=${initialRuleId}`;
		}
		if (initialItemId != undefined) {
			query += `&initialItem=${initialItemId}`;
		}

		var popupURL = browser.extension.getURL("ui/options.html");
		let createData = {
			type: "popup",
			allowScriptsToClose: true,
			width: 1200,
			height: 600,
			url: popupURL+query
		};

		browser.tabs.query({ url: popupURL }, (tabs) => {
			if (tabs.length ==0) {
				let creating = browser.windows.create(createData);
					creating.then(() => { });
			} else {
				browser.windows.update(tabs[0].windowId, { focused: true }).then(result => { 
					browser.tabs.update(tabs[0].id, { active: true }).then(result => { 
						const sending = browser.runtime.sendMessage({ "action": "setSelection", "initialRule": initialRuleId, "initialItem": initialItemId});
						sending.then(x => {}, x => {}); 
					});
				});
			}
		});
	}
}

if (typeof module === "object") {
	module.exports = common;
}