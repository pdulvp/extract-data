﻿const fsh = require('@pdulvp/fsh');

return fsh.read("manifest.json").then(p => {
	let res = JSON.parse(p);
	res.browser_specific_settings = {
		gecko: {
			"id": "extract-data@pdulvp"
		}
	};
	return fsh.writeIfChange("manifest.json", JSON.stringify(res, null, 2));
});