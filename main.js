const productsHtml = document.getElementById('products')
const pagination = document.getElementById("pagination")
const quantityProductsOnPage = 50;
const progress = document.getElementById("progress");
const back = document.getElementById("back");
const forward = document.getElementById("forward");
const formProductBrand = document.getElementById("form-product-brand");
const formProductPrice = document.getElementById("form-product-price");
const formProductName = document.getElementById("form-product-name");
let pageNumber = 1;

//Функция приводит текущую дату в нужный формат для зарпоса 20240226
function dataFormat() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

//Функция выводит на страницу товары
function displayProduct(product_id, product, price, brand, display) {
  let productContent = document.createElement('li');
  productContent.style.display = display
  productContent.innerHTML = `<div class="product_id">ID: ${product_id}</div><div class="product_name">PRODUCT: ${product}</div><div class="product_price">PRICE: ${price}</div><div class="product_brand">BRAND: ${brand}</div><div>---------------------</div>`;
  console.log(productContent);
  productsHtml.appendChild(productContent)
}

//Основная функция с рекурсией, которая делвет запрос на сервер с параметрами для получения товаров
function httpRequest(paramsJson) {
  return new Promise(function(resolve, reject) {
      progress.value = 0;
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open('POST', 'https://api.valantis.store:41000/');
      const password = CryptoJS.MD5(`Valantis_${dataFormat()}`).toString();
      xhr.setRequestHeader('X-Auth', password)
      xhr.setRequestHeader('Content-Type', 'application/json');
      try {
        xhr.upload.onprogress = function() {
          progress.value += event.total / event.loaded;
        };
        xhr.send(paramsJson);
        xhr.onload = () => {
          if (xhr.status == 500) {
            console.log(`Ошибка ${xhr.status}: ${xhr.statusText}` + 'перезапускаем запрос')
            httpRequest(paramsJson).then(resolve)
          } else if (xhr.status != 200) {
            console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`)
          } else {
            resolve (xhr.response.result)}}
      } catch (error) {
      console.log("Запрос не удался");}
      })
}

//Функия получает характеристики продукта по его ids
function getProductCharacteristic(product) {
    let parameter = JSON.stringify({
      "action": "get_items",
      "params": {"ids": [product]}});
  return httpRequest(parameter)
    .then(result => result[0])
}

//Функция управляет страницами и отображением товаров на странице
function getListProducts(param) {
  httpRequest(param)
    .then(allProducts => Promise.all(allProducts.map(product => getProductCharacteristic(product))))
    .then(productsCaracteristics => {
      for (let index = 0; index < productsCaracteristics.length; index++) {
        const dataProduct = productsCaracteristics[index];
        displayProduct(dataProduct.id, dataProduct.product, dataProduct.price, dataProduct.brand, 'block');
      }
  })
}

//При загрузкe страницы запускаем отображение первых пятидесяти товаров
for (let count = 0; count < 10; count++) {
  getListProducts(JSON.stringify({
  "action": "get_ids",
  "params": {"offset": count*5, "limit": 5}
}))
}

//Функция показывает товары на странице
function showPage(pageNumber) {
  const loadedProducts = productsHtml.querySelectorAll('LI')
  const start = (pageNumber-1) * 50;
  const end = pageNumber * 50;
  loadedProducts.forEach((item, index) => {
    if (index >=start && index < end) {
      item.style.display = 'block'
    } else {
      item.style.display = 'none'}
  });
  if (productsHtml.firstElementChild.style.display == 'block') {
    back.style.display = 'none';
  } else {back.style.display = 'block'}
}

//При нажатии на кнопку "вперед" получаем и выводим (новые) 50 товаров, предыдущие скрываем
forward.addEventListener('click', () => {
  let loadedProducts = productsHtml.querySelectorAll('LI')
  if (productsHtml.lastElementChild.style.display == 'block') {
      loadedProducts.forEach((item, index) => {
      item.style.display = 'none'});
      for (let count = 0; count < 10; count++) {
      getListProducts(JSON.stringify({
        "action": "get_ids",
        "params": {"offset": count*5, "limit": 5}
        }))
      }
    pageNumber += 1;
    back.style.display = 'block';
    } else {
      pageNumber += 1;
      showPage(pageNumber);
    }
})

back.addEventListener('click', () => {
  if (productsHtml.firstElementChild.style.display == 'none') {
    showPage(pageNumber-1)
    pageNumber -= 1;
  }
})

//Возможность отфильтровать товары по названию
formProductName.addEventListener("submit", (e) => {
  e.preventDefault();
  const productName = document.getElementById("name").value;
  if (productName != '') {
    productsHtml.innerHTML = '';
    paramFilter = JSON.stringify({
      "action": "filter",
      "params": {"product": productName}
    })
    getListProducts(paramFilter)
    e.target.reset();
    back.style.display = 'none';
  }
})

//Возможность отфильтровать товары по цене
formProductPrice.addEventListener("submit", (e) => {
  e.preventDefault();
  const productPrice = Number(document.getElementById("price").value);
  if (productPrice != '') {
    productsHtml.innerHTML = '';
    paramFilter = JSON.stringify({
      "action": "filter",
      "params": {"price": productPrice}
    })
    getListProducts(paramFilter)
    e.target.reset();
    back.style.display = 'none';
  }
})

//Возможность отфильтровать товары по бренду
formProductBrand.addEventListener("submit", (e) => {
  e.preventDefault();
  const productBrand = document.getElementById("brand").value;
  if (productBrand != '') {
    productsHtml.innerHTML = '';
    paramFilter = JSON.stringify({
      "action": "filter",
      "params": {"brand": productBrand}
    })
    getListProducts(paramFilter)
    e.target.reset();
    back.style.display = 'none';
  }
})