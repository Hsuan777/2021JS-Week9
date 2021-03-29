/* get DOM */
const productsList = document.querySelector('.js-productsList');
const cartsList = document.querySelector('.js-cartsList');
const finalTotal = document.querySelector('.js-finalTotal');

/* set 變數與初始值 */
let originProductsData = []
let originCartsData = []

/* function */
// 資料初始化
const init = () => {
  getProducts()
  getCarts()
}
// api 網址 行為
const apiUrl = name => {
  return `https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/vic/${name}`
}
// 取得資料
const getProducts = () => {
  axios.get(apiUrl('products')).then(response => {
    originData = response.data.products
    productsRender(originData)
  })
}
const getCarts = () => {
  axios.get(apiUrl('carts')).then(response => {
    originCartsData = response.data.carts
    cartsRender(originCartsData, response.data.finalTotal)
  })
}
// 渲染畫面
const productsRender = data => {
  let dataStr = ``
  data.forEach(item => {
    dataStr += `
    <li class="col">
      <div class="card border-0 h-100">
        <div class="position-relative">
          <a href="">
            <img src="${item.images}" class="card-img-top" alt="...">
          </a>
          <p class="position-absolute top-0 end-0 translate-middle-y bg-secondary rounded-start p-3 text-white">新品</p>
        </div>
        <div class="card-body p-0">
          <input type="button" value="加入購物車" class="btn btn-dark rounded-0 w-100">
          <h4 class="card-text text-info py-2 mb-0">${item.title}</h4>
          <del>${formatPrice(item.origin_price.toString())}</del>
          <p class="h4">${formatPrice(item.price.toString())}</p>
        </div>
      </div>
    </li>`
  })
  productsList.innerHTML = dataStr
}

const cartsRender = (data, totalMoney) => {
  let dataStr = ``
  data.forEach(item => {
    dataStr += `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <img src="${item.product.images}" alt="" class="custom__carts__image me-2">
          <p class="mb-0">${item.product.title}</p>
        </div>
      </td>
      <td>${item.product.price}</td>
      <td>${item.quantity}</td>
      <td>${item.product.price * item.quantity}</td>
      <td><button type="button" class="btn btn-light">X</button></td>
    </tr>
    `
  })
  cartsList.innerHTML = dataStr
  finalTotal.textContent = `NT$${totalMoney}`
}


const formatPrice = numStr => {
  return numStr.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
init()