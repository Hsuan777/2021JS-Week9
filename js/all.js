/* get DOM */
const productsList = document.querySelector('.js-productsList');
const cartsList = document.querySelector('.js-cartsList');
const finalTotal = document.querySelector('.js-finalTotal');
const submitOrder = document.querySelector('.js-submitOrder');
const inputs = document.querySelectorAll("input[type=text],input[type=number],input[type=email],select");



/* set 變數與初始值 */

let originProductsData = []
let originCartsData = []
const constraints = {
  clientName: {
    presence: {
      message: "請輸入姓名"
    },
    length: {
      minimum: 2,
      tooShort: "請勿輸入一個字",
    }
  },
  clientPhone: {
    presence: {
      message: "請輸入電話"
    },
    length: {
      minimum: 10,
      tooShort: "請輸入正確的電話號碼",
    },
    format: {
      pattern: "[0-9]+",
      message: "請輸入正確的電話號碼"
    }
  },
  clientEmail: {
    presence: {
      message: "請輸入電子信箱"
    },
    email: {
      message: "請輸入正確的電子信箱"
    },
  },
  clientAddress: {
    presence: {
      message: "請輸入寄送地址"
    },
    length: {
      minimum: 10,
      tooShort: "請輸入正確地址",
    },
  },
  clientPay: {
    presence: {
      message: "請選擇交易方式"
    },
  }
}

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
const postProduct = (productID) => {
  let tempProduct = {data:{}}
  let cartsHas = originCartsData.find(item => {
    return item.product.id === productID
  });
  if (cartsHas === undefined) {
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
}

const postOrder = (Event) => {
  let userObj = {}
  userObj.name    = Event.target[0].value;
  userObj.tel     = Event.target[1].value;
  userObj.email   = Event.target[2].value;
  userObj.address = Event.target[3].value;
  userObj.payment = Event.target[4].value;
  if (cartsList.textContent !== ''){
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
}

// patch carts
const patchProduct = (catrsID, quantity, action) => {
  let tempProduct = {data:{}}
  tempProduct.data.id = catrsID
  if (action === "+"){
    tempProduct.data.quantity = quantity*1 + 1
    axios.patch(apiUrl('carts'), tempProduct).then(response => {
      cartsRender(response.data.carts, response.data.finalTotal)
    })
  } else if (action === "-" && quantity !== "1"){
    tempProduct.data.quantity = quantity - 1
    axios.patch(apiUrl('carts'), tempProduct).then(response => {
      cartsRender(response.data.carts, response.data.finalTotal)
    })
  }
}

// delete carts
const deleteProduct = (cartsID) => {
  if (cartsID === 'clearAll' && cartsList.textContent === '') {
    return
  } else if (cartsID === 'clearAll' && cartsList.textContent !== '') {
    axios.delete(apiUrl('carts')).then(response => {
      cartsRender(originCartsData, response.data.finalTotal)
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
          <del>${formatPrice(item.origin_price)}</del>
          <p class="h4">${formatPrice(item.price)}</p>
        </div>
      </div>
    </li>`
  })
  productsList.innerHTML = dataStr
  const addCartsBtns = document.querySelectorAll('.js-addCartsBtn')
  addCartsBtns.forEach(item => {
    item.addEventListener('click', (Event)=>{
      postProduct(Event.target.value)
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
      <td>${formatPrice(item.product.price)}</td>
      <td>
        <div class="d-flex justify-content-around align-items-center">
          <button type="button" value="${item.id}" class="js-qtDown btn btn-light">-</button>
          <button class="btn btn-light">${item.quantity}</button>
          <button type="button" value="${item.id}" class="js-qtUp btn btn-light">+</button>
        </div>
      </td>
      <td>${formatPrice(item.product.price * item.quantity)}</td>
      <td><button type="button" value="${item.id}" class="js-delBtn btn btn-light">X</button></td>
    </tr>
    `
  })
  cartsList.innerHTML = dataStr
  finalTotal.textContent = `NT$${formatPrice(totalMoney)}`
  const delBtns = document.querySelectorAll('.js-delBtn')
  const qtDown = document.querySelectorAll('.js-qtDown');
  const qtUp = document.querySelectorAll('.js-qtUp');
  delBtns.forEach(item => {
    item.addEventListener('click', Event => {
      deleteProduct(Event.target.value)
    })
  })
  qtDown.forEach(item => {
    item.addEventListener('click', Event => {
      patchProduct(Event.target.value, item.nextElementSibling.textContent, "-")
    })
  })
  qtUp.forEach(item => {
    item.addEventListener('click', Event => {
      patchProduct(Event.target.value, item.previousElementSibling.textContent, "+")
    })
  })
  
}

const formatPrice = numStr => {
  return numStr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

submitOrder.addEventListener('submit', (Event) => {
  Event.preventDefault();
  postOrder(Event);
  
})


inputs.forEach(item => {
  item.addEventListener('change', () => {
    item.nextElementSibling.textContent = '';
    let errors = validate(submitOrder, constraints);
    if (errors) {
      Object.keys(errors).forEach(item => {
        document.querySelector(`.${item}`).textContent =  errors[item][0].split(' ')[2]
      })
    }
  })
})

init()