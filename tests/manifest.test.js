let testh = require("./testh");
let fsh = require("@pdulvp/fsh");
testh.init(__filename.slice(__dirname.length + 1));

function filterNotExist(files) {
    return files.map(s => { return { name: s, exist: fsh.fileExists(s) } } ).filter(s => !s.exist).map(x => x.name);
}

function check(title, files) {
    let notExist = filterNotExist(files);
    if (notExist.length > 0) {
        testh.error(`${title} '${notExist}' not exists`);
    } else {
        testh.success(`${title}`);
    }
}

let mod = require("../manifest.json");
check("background.scripts", mod.background.scripts);
check("background.scripts", mod.background.scripts);

mod.content_scripts.forEach(c => {
    check("content_scripts.scripts", c.js);
});

check("icons", Object.keys(mod.icons).map(k => mod.icons[k]));
check("browser_action.default_icon", Object.keys(mod.browser_action.default_icon).map(k => mod.icons[k]));
