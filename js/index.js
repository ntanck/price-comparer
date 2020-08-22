
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

function getProducts(store, query) {
    var lPrice = $("#lowestPrice")[0].checked; //Currently only works for Kabum. Trying to deal with CORS in other stores.
    var storeUrl = {
        "kabum": `https://www.kabum.com.br/cgi-local/site/listagem/listagem.cgi?string=${query}&btnG=&pagina=1&ordem=${lPrice ? "3" : "5"}&limite=2000`,
        "pichau": `https://www.pichau.com.br/catalogsearch/result/?q=${lPrice ? query + "&product_list_order=price" : query}`,
        "cissa": `https://www.cissamagazine.com.br/busca?q=${lPrice ? query + "&ordem=menorpreco" : query}`,
        "pcxpress": `https://www.pcxpress.com.br/page/1/?s=${query}&post_type=product`
    };

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if(store != "kabum"){
            $.getJSON(`http://api.allorigins.win/get?url=${encodeURIComponent(storeUrl[store])}&callback=?`, function (data) {
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
    $("<div>", { class: "lds-dual-ring" }).appendTo(`#${store}-column`);
    var productsRaw = await getProducts(store, query);
    var products = [];

    if (store == "kabum") {
        var tempProducts = JSON.parse(productsRaw.match(/(?<=listagemDados = ).*?(?=const listagemCount)/s));

        products.push(tempProducts.map((p) => {
            if (p.disponibilidade) {
                $("<a>", { class: "product", "href": `https://www.kabum.com.br${p.link_descricao}` }).append(
                    $("<img>", { class: "picture", src: p.img }),
                    $("<h3>", { class: "name" }).text(p.nome.length > 100 ? p.nome.substring(0, 95) + "..." : p.nome),
                    $("<h3>", { class: "price" }).text(p.preco_desconto.toFixed(2).replace('.', ','))
                ).appendTo(`#${store}-column`);
                return {
                    name: p.nome,
                    url: p.link_descricao,
                    image: p.img,
                    price: p.preco_desconto.toFixed(2).replace('.', ',')
                }
            }
        }));
    } else {
        var status = scrapeStore(store, productsRaw["contents"]);
        
        if (status == -1) {
            $(`#${store}-column`).append("<h5>Nada por aqui.</h5>")
            $(`#${store}-column .lds-dual-ring`).remove();
            return;
        }
    }
    $(`#${store}-column .lds-dual-ring`).remove();
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
    catch (err) {return -1;}

    if(window.expressions[store].toRemove !== null)
    {
        html = html.replace(new RegExp(window.expressions[store].toRemove, "sg"),"")
    }

    var products = [];

    var urls = html.match(new RegExp(window.expressions[store].urls, "sg"));
    var names = html.match(new RegExp(window.expressions[store].names, "sg"));
    var prices = html.match(new RegExp(window.expressions[store].prices, "sg"));
    var images = html.match(new RegExp(window.expressions[store].images, "sg"));

    if(prices == null){
        return -1;
    }
    
    products.push(prices.map((price, index) => {
        names[index] = names[index].replace("&quot", "\"");
        $("<a>", { class: "product", "href": urls[index]}).append(
            $("<img>", { class: "picture", src: images[index] }),
            $("<h3>", { class: "name" }).text(names[index].length > 100 ? names[index].substring(0,95) + "..." : names[index]),
            $("<h3>", { class: "price" }).text(price.replace(".", ""))
        ).appendTo(`#${store}-column`);
    }));
}




