const interval = 333,
    priceTableLimit = 10,
    missing = 99999,
    columnSort = 3;

var link, input = document.querySelector("form input");

setInterval(() => {
    document.querySelectorAll(".extension .domain:not(.tld)").forEach(a => {
        link = a;
        link.classList.add("tld");
        chrome.runtime.sendMessage({
            'message': 'get:price',
            'tld': link.innerText.slice(1)
        })
    });
    document.querySelectorAll(".search-results>a:not(.init)").forEach(a => {
        a.classList.add("init");
        a.setAttribute("title", [...a.querySelectorAll("div")].map(x => x.innerText.trim()).filter(x => x).join(" - "));
    });
}, interval);

function addTable(tld, html) {
    if (link && link.innerText.trim().slice(1) === tld) {
        link.closest(".domain-detail-content").setAttribute("style", "overflow:visible;max-height:calc(100vh - 75px)");

        var table = (new DOMParser()).parseFromString(html, "text/html").body.children[0],
            body = table.querySelector("tbody");

        table.querySelectorAll("tbody a.nowrap").forEach(x => x.outerText = x.innerText);
        table.querySelectorAll("thead a").forEach(x => x.removeAttribute("title"));

        body.innerHTML = [...table.querySelectorAll("tbody>tr")].sort((a, b) => {
            var c = (+(a.querySelector("tr>td:nth-child(" + columnSort + ")").dataset.order || "0").replace("-", ".")),
                d = (+(b.querySelector("tr>td:nth-child(" + columnSort + ")").dataset.order || "0").replace("-", "."));

            c = c < 1 ? missing : c;
            d = d < 1 ? missing : d;

            return c - d;
        }).slice(0, priceTableLimit).map(e => e.outerHTML).join("");

        link.closest(".domain-detail-content").prepend(table);
    }
}

var ctx = document.createElement("ul");
ctx.id = "ctx";
ctx.innerHTML = `<!--<li id="list">Add to List<ul class="dd"><li id="newList">New List</li></ul></li>-->
<li id="open">Open URL</li>`;

//ctx.querySelector("#list").addEventListener("click", e => console.log(e));
ctx.querySelector("#open").addEventListener("click", e => window.open("http://" + ctx.target.querySelector(".domain").innerText, "_blank"));
document.body.append(ctx);

window.addEventListener("contextmenu", e => {
    if (e.target.matches(".search-results>a")) {
        e.preventDefault();
        ctx.target = e.target;
        ctx.style.top = (e.pageY - 15) + "px";
        ctx.style.left = (e.pageX - 15) + "px";
    } else ctx.removeAttribute("style");
});

window.addEventListener("click", e => {
    ctx.removeAttribute("style");
    input.focus()
});
window.addEventListener("keydown", e => ctx.removeAttribute("style"));

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.message === "return:raw") {
        var dom = (new DOMParser()).parseFromString(request.html, "text/html");
        [...dom.querySelectorAll("#registrars-table tr>*:nth-child(3)~*,#registrars-table tr>* ul,sup.lighter")].forEach(el => el.remove());

        if (dom.querySelector("#registrars-table")) {
            var html = dom.querySelector("#registrars-table").outerHTML;
            addTable(request.tld, html);

            chrome.runtime.sendMessage({
                'message': 'set:price',
                'tld': request.tld,
                'html': html
            })
        }
    } else if (request.message === "return:table") addTable(request.tld, request.html);
});
