/* 
 This code is published under CC BY-NC-ND 4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 @author: pdulvp@laposte.net
 */
function hasClass(item, value) {
	return item.getAttribute("class") != null && (item.getAttribute("class").includes(value));
}

function removeClass(item, value) {
	if (hasClass(item, value)) {
		item.setAttribute("class", item.getAttribute("class").replace(value, "").trim());
	}
}

function addClass(item, value) {
    if (!hasClass(item, value)) {
        let current = item.getAttribute("class");
        current = current == null ? "" : current;
        item.setAttribute("class", (current+ " "+value+" ").trim());
    }
}

function registerDropdownMenu(button, menu, onopening, dispatch) {
	document.addEventListener("click", event => {
		if (!event.target.hasAttribute("data-menu")) {
		  if (!menu.contains(event.target)) {
			menu.setAttribute("style", `display:none;`);
		  }
		}
	});
	
	let displayPopup = function (event) {
		let top = event.target.offsetTop + event.target.offsetHeight - 1;
		let left = event.target.offsetLeft;
		let opening = onopening == null ? new Promise( x => true ) : onopening;
		opening(menu).then(() =>  {
			let attr = `display:block; left:${left}px; top:${top}px;`;
			menu.setAttribute("style", attr);
			menu.addEventListener("click", menuEvent => {
				menu.setAttribute("style", `display:none;`);
				dispatch(menuEvent);
			}, { useCapture: true } );
		});
	};

	button.addEventListener("click", displayPopup, { useCapture: true } );
};

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

function copyToClipboard(text, html) {
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
}