
$.getJSON("js/regex.json", function(result){
    window.expressions = result;
});

document.getElementById("queryBox").onkeypress = function (event) {
    if (event.keyCode == 13 || event.which == 13) {
        var query = cleanUpSpecialChars(event.target.value);
        var websites = Object.keys(window.expressions);
        $('.p-column').empty();

        websites.forEach(website => {
            drawBoxes(website, query);
        });
    }
};

function getProducts(store, query, page) {
    var lPrice = $("#lowestPrice")[0].checked; //Currently only works for Kabum. Trying to deal with CORS in other stores.
    var storeUrl = {
        "kabum": `https://www.kabum.com.br/cgi-local/site/listagem/listagem.cgi?string=${query}&btnG=&pagina=1&ordem=${lPrice ? "3" : "5"}&limite=2000`,
        "pichau": `https://www.pichau.com.br/catalogsearch/result/index/?p=${page}&q=${query}${lPrice ? "&product_list_order=price" : ""}&product_list_limit=48`,
        "cissa": `https://www.cissamagazine.com.br/busca?q=${lPrice ? query + "&ordem=menorpreco" : query}&p=${page}`,
        "pcxpress": `https://www.pcxpress.com.br/page/${page}/?${lPrice ? "orderby=price&" : ""}s=${query}&post_type=product`
    };
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(store != "kabum"){
            $.getJSON(`https://api.allorigins.win/get?url=${encodeURIComponent(storeUrl[store])}&callback=?`, function (data) {
            resolve(data);
        });
    } else {
        $.get(storeUrl[store], function (response) {
            resolve(response);
        });
    }
        }, 2000);
    });
}

async function drawBoxes(store, query) {
    $(`#${store}-title .lds-dual-ring`).show();
    if (store == "kabum") {
        var productsRaw = await getProducts(store, query);

        var products = JSON.parse(productsRaw.match(/(?<=listagemDados = ).*?(?=const listagem)/s));

        if(products < 1) {
            $(`#${store}-column`).append("<h5>Nada por aqui.</h5>")
            $(`#${store}-column .lds-dual-ring`).hide
        }

        for (p of products) {
            if (p.disponibilidade) {
                $("<a>", { class: "product", "href": `https://www.kabum.com.br${p.link_descricao}` }).append(
                    $("<img>", { class: "picture", src: p.img }),
                    $("<h3>", { class: "name" }).text(p.nome.length > 100 ? p.nome.substring(0, 95) + "..." : p.nome),
                    $("<h3>", { class: "price" }).text(p.preco_desconto.toFixed(2).replace('.', ','))
                ).appendTo(`#${store}-column`);
            }
        }
    } else {
        var i = 1;
        while(true) {
            var productsRaw = await getProducts(store, query, i);
            var status = scrapeStore(store, productsRaw["contents"]);
            
            if (status == -1) {
                if(i == 1){
                    $(`#${store}-column`).append("<h5>Nada por aqui.</h5>")
                    $(`#${store}-column .lds-dual-ring`).hide
                }
                break;
            }

            i = productsRaw["contents"].match(new RegExp(window.expressions[store].pages, "s"));

            if(i == undefined) {break;}
        }
    }
    $(`#${store}-title .lds-dual-ring`).hide();
}

function cleanUpSpecialChars(str) {
    return str.toLowerCase()
        .replace(/[àáâãäå]/g, "a")
        .replace(/[èééêë]/g, "e")
        .replace(/[óòôõö]/g, "o")
        .replace(/[íìï]/g, "i")
        .replace(/[úùü]/g, "u")
        .replace(" ", "+")
        .replace(/[^a-z0-9\+]/gi, '');
}

function scrapeStore(store, html){
    try {html = html.match(new RegExp(window.expressions[store].content, "sg"))[0];}
    catch (err) {return;}

    if(window.expressions[store].toRemove !== null)
    {
        html = html.replace(new RegExp(window.expressions[store].toRemove, "sg"),"")
    }

    var urls = html.match(new RegExp(window.expressions[store].urls, "sg"));
    var names = html.match(new RegExp(window.expressions[store].names, "sg"));
    var prices = html.match(new RegExp(window.expressions[store].prices, "sg"));
    var images = html.match(new RegExp(window.expressions[store].images, "sg"));

    // I could build an array of objects based on these original arrays, but that would mean more processing for
    // no valid reason

    if(prices == null){
        return;
    }
    
    for (index in prices) {
        names[index] = names[index].replace("&quot", "\"");
        $("<a>", { class: "product", "href": urls[index]}).append(
        $("<img>", { class: "picture", src: images[index] }),
        $("<h3>", { class: "name" }).text(names[index].length > 100 ? names[index].substring(0,95) + "..." : names[index]),
        $("<h3>", { class: "price" }).text(prices[index].replace(".", ""))
        ).appendTo(`#${store}-column`);
    };
}




