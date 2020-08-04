document.getElementById("queryBox").onkeypress = function (event) {
    if (event.keyCode == 13 || event.which == 13) {
        var query = cleanUpSpecialChars(event.target.value);
        $('.p-column').empty();

        drawBoxes("pichau", query);
        drawBoxes("kabum", query);
        drawBoxes("cissa", query);
    }
};

function getProducts(store, query) {
    var lPrice = $("#lowestPrice")[0].checked; //Currently only works for Kabum. Trying to deal with CORS in other stores.
    var storeUrl = {
        "kabum": `https://www.kabum.com.br/cgi-local/site/listagem/listagem.cgi?string=${query}&btnG=&pagina=1&ordem=${lPrice ? "3" : "5"}&limite=2000&prime=false&marcas=[]&tipo_produto=[]&filtro=[]`,
        "pichau": `https://api.allorigins.win/get?url=https://www.pichau.com.br/catalogsearch/result/?q=${lPrice ? query + "&product_list_order=price" : query}`,
        "cissa": `https://api.allorigins.win/get?url=https://www.cissamagazine.com.br/busca?q=${lPrice ? query + "&ordem=menorpreco" : query}`
    };
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            $.get(storeUrl[store], function (response) {
                resolve(response);
            });
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
        var urls = names = prices = images = [];

        if(store == "pichau") {
            var productsRawSub = productsRaw["contents"].match(/(?<=products list items product-items).*?(?=Atendimento <strong>Por e-mail)/sg)[0];
            productsRawSub = productsRawSub.replace(/(?<=<span class=\"old-price\">).*?(?=<\/script>)/sg, "")

            urls = productsRawSub.match(/(?<=\"product-item-link\" href=\").*?(?=\")/sg);
            names = productsRawSub.match(/(?<= height=\"\" alt=\").*?(?=\")/sg);
            prices = productsRawSub.match(/(?<=<span>à vista R\$).*?(?=<)/sg);
            images = productsRawSub.match(/(?<=photo\" src=\").*?(?=\")/sg);
        } else {
            var productsRawSub = productsRaw["contents"].match(/(?<=lista-produtos-area\">).*?(?=<scrip)/sg)[0];

            urls = productsRawSub.match(/(?<=<a href=\"\/\/).*?(?=\" class=)/sg);
            names = productsRawSub.match(/(?<=product-name\">\s*.{28}).*?(?=[ \r\n\s]*<)/sg);
            prices = productsRawSub.match(/(?<=R\$ <span>).*?(?=<)/sg);
            images = productsRawSub.match(/(?<=class=\"lazyload\" data-src=\").*?(?=\")/sg);
        }
        
        if (prices == null) {
            $(`#${store}-column`).append("<h5>Nada por aqui.</h5>")
            $(`#${store}-column .lds-dual-ring`).remove();
            return;
        }

        products.push(prices.map((price, index) => {
            console.log(names[index].length);
            console.log(names[index]);
            names[index] = names[index].replace("&quot", "\"");

            $("<a>", { class: "product", "href": `${store == "cissa" ? "https://" + urls[index] : urls[index]}` }).append(
                $("<img>", { class: "picture", src: images[index] }),
                $("<h3>", { class: "name" }).text(names[index].length > 100 ? names[index].substring(0,95) + "..." : names[index]),
                $("<h3>", { class: "price" }).text(price.replace(".", ""))
            ).appendTo(`#${store}-column`);
            return {
                name: names[index],
                url: `${store == "cissa" ? "https://" + urls[index] : urls[index]}`,
                image: images[index],
                price: price.replace(".", "")
            }
        }));
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




