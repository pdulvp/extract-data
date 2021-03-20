const fsh = require('@pdulvp/fsh');

return fsh.read("manifest.json").then(p => {
	let res = JSON.parse(p);
	delete res.browser_specific_settings;
	delete res.id;
	delete res.key;
	return fsh.writeIfChange("manifest.json", JSON.stringify(res, null, 2));
});