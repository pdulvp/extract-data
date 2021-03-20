/* 
 This Code is published under the terms and conditions of the CC-BY-NC-ND-4.0
 (https://creativecommons.org/licenses/by-nc-nd/4.0)
 
 Please contribute to the current project.
 
 SPDX-License-Identifier: CC-BY-NC-ND-4.0
 @author: pdulvp@laposte.net
 */

var browser = (typeof module === "object") ? {} : browser;
var compat = {

    adaptBrowser: () => {
        if (browser != undefined) {
            return browser;
        }
        let browser2 = {
            storage: {
                local: {
                    get: function(key) {
                        return new Promise((resolve, reject) => {
                            chrome.storage.local.get(key, function(e) {
                                var lastError = chrome.runtime.lastError;
                                if (lastError) {
                                    console.log(lastError);
                                } else {
                                    resolve(e);
                                }
                            });
                        });
                    },
                    set: function(value) {
                        return new Promise((resolve, reject) => {
                            chrome.storage.local.set(value, function(e) {
                                var lastError = chrome.runtime.lastError;
                                if (lastError) {
                                    console.log(lastError);
                                } else {
                                    resolve(e);
                                }
                            });
                        });
                    }
                },
                onChanged: chrome.storage.onChanged,
            },
            browserAction: {
                setBadgeTextColor: function(data) {
                    console.log("setBadgeTextColor not supported in chrome");
                },
                setBadgeBackgroundColor: function(data) {
                    return new Promise((resolve, reject) => {
                        chrome.browserAction.setBadgeBackgroundColor(data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                setBadgeText: function(data) {
                    return new Promise((resolve, reject) => {
                        chrome.browserAction.setBadgeText(data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                getBadgeText: function(data) {
                    return new Promise((resolve, reject) => {
                        chrome.browserAction.getBadgeText(data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                }
            },
            contextMenus: {
                create: function(data) {
                    delete data.icons;
                    return new Promise((resolve, reject) => {
                        chrome.contextMenus.create(data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                //console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                }, 
                update: function(menuId, data) {
                    delete data.icons;
                    return new Promise((resolve, reject) => {
                        chrome.contextMenus.update(menuId, data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                }
            },
            
            runtime: {
                sendMessage: function(object) {
                    return new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage(object, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log("sendMessage");
                                console.log(object);
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                onMessage: chrome.runtime.onMessage
            },
            i18n: chrome.i18n,
            extension: chrome.extension,
            windows: {
                create: function (data) {
                    delete data.allowScriptsToClose;

                    return new Promise((resolve, reject) => {
                        chrome.windows.create(data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                }, update: function (windowsId, data) {
                    delete data.allowScriptsToClose;

                    return new Promise((resolve, reject) => {
                        chrome.windows.update(windowsId, data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                }
            }
        };

        if (chrome.tabs) {
            browser2.tabs = {
                sendMessage: function(tabId, object) {
                    return new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(tabId, object, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                onActivated: chrome.tabs.onActivated,
                query: chrome.tabs.query,
                create: function(data) {
                    return new Promise((resolve, reject) => {
                        chrome.tabs.create(data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                update: function(tabId, data) {
                    return new Promise((resolve, reject) => {
                        chrome.tabs.update(tabId, data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                }
            };
        }

        if (chrome.notifications) {
            browser2.notifications = {
                create: function(id, content) {
                    if (content.iconUrl == undefined) {
                        console.log("Missing iconUrl for notification");
                    }
                    return new Promise((resolve, reject) => {
                        chrome.notifications.create(id, content, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                clear: function(data) {
                    return new Promise((resolve, reject) => {
                        chrome.notifications.clear(data, function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                getAll: function() {
                    return new Promise((resolve, reject) => {
                        chrome.notifications.getAll(function(e) {
                            var lastError = chrome.runtime.lastError;
                            if (lastError) {
                                console.log(lastError);
                            } else {
                                resolve(e);
                            }
                        });
                    });
                },
                onClicked: chrome.notifications.onClicked
            }
        }
        return browser2;
    }   
}

if (typeof module === "object") {
	module.exports = compat;
}