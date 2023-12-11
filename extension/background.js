const currency = "GBP";

var tlds = {}, lists = {};

chrome.storage.local.get("tlds").then(l => tlds = l.tlds||tlds);
chrome.storage.local.get("lists").then(l => lists = l.lists||lists);


chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.message === "get:price") {
        if (tlds[request.tld] && tlds[request.tld].updated > (Date.now() - 1000*60*60*24*5)) {
            chrome.tabs.sendMessage(sender.tab.id, {
                'message': 'return:table',
                'tld': request.tld,
                'html': tlds[request.tld].html
            })
        } else {
            var html = await (await fetch("https://tld-list.com/tld/" + request.tld + "?cur="+currency)).text();
            chrome.tabs.sendMessage(sender.tab.id, {
                'message': 'return:raw',
                'tld': request.tld,
                'html': html
            })
        }
    } else if (request.message === "set:price") {
        tlds[request.tld] = {
            'html': request.html,
            'updated': Date.now()
        };
        chrome.storage.local.set({
            "tlds": tlds
        })
    }
});
