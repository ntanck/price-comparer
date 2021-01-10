import "./css/style.css"
let $ = require("jquery");

const expressions = require('./regex.json');

document.getElementById("queryBox").onkeypress = function (event) {
    if (event.keyCode == 13 || event.which == 13) {
        var query = cleanUpSpecialChars(event.target.value);
        var websites = Object.keys(expressions);
        $('.p-column').empty();

        websites.forEach(website => {
            drawBoxes(website, query);
        });
    }
};

async function drawBoxes(store, query) {
    $(`#${store}-title .lds-dual-ring`).show();
    
    $.ajax({
        url: `https://hardware-scraper-api.herokuapp.com/get?store=${store}&query=${query}`,
    })
        .done(function (products) {
            for (const p of products) {
                $("<a>", { class: "product", "href": p.url }).append(
                    $("<img>", { class: "picture", src: p.img }),
                    $("<h3>", { class: "name" }).text(p.name),
                    $("<h3>", { class: "price" }).text(`R\$${p.price}`)
                ).appendTo(`#${store}-column`);
                $(`#${store}-title .lds-dual-ring`).hide();
            };
        });
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


