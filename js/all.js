/* get DOM */
const productsList = document.querySelector('.js-productsList');
const cartsList = document.querySelector('.js-cartsList');
const finalTotal = document.querySelector('.js-finalTotal');
const submitOrder = document.querySelector('.js-submitOrder');


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
// get Data
const getProducts = () => {
  axios.get(apiUrl('products')).then(response => {
    originProductsData = response.data.products
    productsRender(originProductsData)
  })
}
const getCarts = () => {
  axios.get(apiUrl('carts')).then(response => {
    originCartsData = response.data.carts
    cartsRender(originCartsData, response.data.finalTotal)
  })
}

// post Data
const postProcust = (productID) => {
  let tempProduct = {data:{}}
  originProductsData.forEach(item => {
    if (item.id === productID){
      tempProduct.data.productId = productID
      tempProduct.data.quantity = 1
    }
  })
  axios.post(apiUrl('carts'), tempProduct).then(response => {
    cartsRender(response.data.carts, response.data.finalTotal)
  })
}

const postOrder = (Event) => {
  console.log(Event);
  let userObj = {}
  userObj.name    = Event.target[0].value;
  userObj.tel     = Event.target[1].value;
  userObj.email   = Event.target[2].value;
  userObj.address = Event.target[3].value;
  userObj.payment = Event.target[4].value;
  axios.post(apiUrl('orders'), {data:{user:userObj}}).then(response => {
    if (response.status === 200) {
      cartsRender([], 0)
      Array.from(Event.target).forEach(item => {
      if (item.value === '送出預訂資料'){
        item.value = '送出預訂資料';
      } else {
        item.value = '';
      }
      })
    }
  })
}

// delete carts
const deleteProduct = (cartsID) => {
  if (cartsID === 'clearAll' && cartsList.textContent === '') {
    return
  } else if (cartsID === 'clearAll' && cartsList.textContent !== '') {
    axios.delete(apiUrl('carts')).then(response => {
      if (response.status === 200) {
        cartsRender(originCartsData, response.data.finalTotal)
      }
    }) 
  } else {
    axios.delete(`${apiUrl('carts')}/${cartsID}`).then(response => {
      cartsRender(response.data.carts, response.data.finalTotal)
    })
  }
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
          <button type="button" value="${item.id}" class="js-addCartsBtn btn btn-dark rounded-0 w-100">加入購物車</button>
          <h4 class="card-text text-info py-2 mb-0">${item.title}</h4>
          <del>${formatPrice(item.origin_price.toString())}</del>
          <p class="h4">${formatPrice(item.price.toString())}</p>
        </div>
      </div>
    </li>`
  })
  productsList.innerHTML = dataStr
  const addCartsBtns = document.querySelectorAll('.js-addCartsBtn')
  addCartsBtns.forEach(item => {
    item.addEventListener('click', (Event)=>{
      postProcust(Event.target.value)
    })
  })
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
      <td><button type="button" value="${item.id}" class="js-delBtn btn btn-light">X</button></td>
    </tr>
    `
  })
  cartsList.innerHTML = dataStr
  finalTotal.textContent = `NT$${totalMoney}`
  const delBtns = document.querySelectorAll('.js-delBtn')
  delBtns.forEach(item => {
    item.addEventListener('click', (Event) => {
      deleteProduct(Event.target.value)
    })
  })
}


const formatPrice = numStr => {
  return numStr.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

submitOrder.addEventListener('submit', (Event) => {
  Event.preventDefault();
  postOrder(Event);
})

init()