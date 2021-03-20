var testh = {

	init: (message) => { 
		console.log(`\x1b[36m[INIT] ####### \x1b[0m${message}\x1b[36m ####### \x1b[0m`);
	},
	info: (message) => { 
		console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
	},
	warn: (message) => {
		console.log(`\x1b[33m[WARN]\x1b[0m ${message}`);
	},
	error: (message) => {
		console.log(`\x1b[31m[ERRO]\x1b[0m ${message}`);
	},
	success: (message) => {
		console.log(`\x1b[32m[SUCC]\x1b[0m ${message}`);
	},
	log: (message) => {
		console.log(`${message}`);
	},
	check: (errorMessage, fBool) => {
		if (fBool()) {
			testh.success("success");
		} else {
			testh.error(errorMessage);
		}
	}
};

module.exports = testh;