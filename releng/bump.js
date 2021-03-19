const fsh = require('@pdulvp/fsh');

var readh = {
    input: function(question) {
        return new Promise(function(resolve, reject) {
            const readline = require('readline');
            const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
            });
            rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
            });
        });
    }
}

readh.input("Version ? ").then(answer => {
	console.log(answer);
	return Promise.resolve(answer).then(e => {
		return fsh.read("package.json").then(p => {
			let res = JSON.parse(p);
			res.version = answer;
			return fsh.writeIfChange("package.json", JSON.stringify(res, null, 2));
		});
		
	}).then(p => {
		return fsh.read("manifest.json").then(p => {
			let res = JSON.parse(p);
			res.version = answer;
			return fsh.writeIfChange("manifest.json", JSON.stringify(res, null, 2));
		})
	});
});
	
