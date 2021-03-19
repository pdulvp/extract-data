let testh = require("./testh");
let fsh = require("@pdulvp/fsh");

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

fsh.read("README.md").then(r => {
    const regexp = /\((images\/[^\)]+)\)/g;
    let usedImages = [...r.matchAll(regexp)];
    usedImages = Array.from(usedImages, m => m[1]);
    check("images", usedImages);

    fsh.getFiles("images").then(files => {
        files = files.map(f => f.replace("\\", "/"));
        let unusedImages = files.filter(x => !usedImages.includes(x));
        if (unusedImages.length > 0) {
            unusedImages = unusedImages.join("\n");
            testh.warn(`unusedImages: some images seem unused:\n'${unusedImages}' `);
        } else {
            testh.success(`unusedImages`);
        }
    });
}); 

