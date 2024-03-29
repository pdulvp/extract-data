let testh = require("./testh");
let domh = require("./domh");

let fsh = require("@pdulvp/fsh");
const compat = require("../ui/compat");
const common = require("../ui/common");

let item = domh.mockItem();

common.addClass(item, "i");
testh.check("item doesn't have a class", () => {
    return item.getAttribute("class") == "i";
});

common.addClass(item, "b");
testh.check("item doesn't have a class", () => {
    return item.getAttribute("class") == "i b";
});

common.removeClass(item, "i");
testh.check("item doesn't have a class", () => {
    return item.getAttribute("class") == "b";
});

common.removeClass(item, "c");
testh.check("item doesn't have a class", () => {
    return item.getAttribute("class") == "b";
});

common.removeClass(item, "b");
testh.check("item doesn't have a class", () => {
    return item.getAttribute("class") == "";
});



let rules = { rules: [
    { "name": "Rule1", "items": [
        { "name" : "Item1", "xpath": "ooooo" }
    ]}
]};

common.storage.migrateRules(rules, undefined, "1.6.0").then(result => {
    testh.check( "xpath not removed", () => { 
        return result.rules[0].items[0].xpath == undefined;
    });
    testh.check( "expression not migrated", () => { 
        return result.rules[0].items[0].expression == "ooooo";
    });
});

