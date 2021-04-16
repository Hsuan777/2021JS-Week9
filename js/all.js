/* get DOM */
const productsList = document.querySelector('.js-productsList') ;
const productsCategory = document.querySelector('.js-productsCategory') ;
const cartsList = document.querySelector('.js-cartsList') ;
const delAll = document.querySelector('.js-delAll') ;
const finalTotal = document.querySelector('.js-finalTotal') ;
const submitOrder = document.querySelector('.js-submitOrder') ;
const inputs = document.querySelectorAll("input[type=text],input[type=number],input[type=email],input[type=tel],select[name=clientPay]") ;
const topBtn = document.querySelector('.js-top') ;

/* set 變數與初始值 */
const apiUrl = 'https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/vic'
let originProductsData = [] ;
let originCartsData = [] ;
let hasError = false

// validate 表單驗證條件與錯誤訊息 
const constraints = {
  clientName: {
    presence: {
      message: "請輸入姓名",
    },
    length: {
      minimum: 2,
      tooShort: "請勿輸入一個字",
    }
  },
  clientPhone: {
    presence: {
      message: "請輸入電話",
    },
    length: {
      minimum: 10,
      tooShort: "請輸入正確的電話號碼",
    },
    format: {
      pattern: "[0-9]+",
      message: "請輸入正確的電話號碼",
    }
  },
  clientEmail: {
    presence: {
      message: "請輸入電子信箱",
    },
    email: {
      message: "請輸入正確的電子信箱",
    },
  },
  clientAddress: {
    presence: {
      message: "請輸入寄送地址",
    },
    length: {
      minimum: 10,
      tooShort: "請輸入正確地址",
    },
  },
  clientPay: {
    presence: {
      message: "請選擇交易方式",
    },
  }
}

/* function */
// 資料初始化
const init = () => {
  getProducts();
  getCarts();
}

// get Data
const getProducts = () => {
  axios.get(`${apiUrl}/products`).then(response => {
    originProductsData = response.data.products ;
    categoryOptions() ;
    productsRender(originProductsData) ;
  }).catch(() => {
    defaultNotice('warning', '請重新整理頁面！')
  })
}
const getCarts = () => {
  axios.get(`${apiUrl}/carts`).then(response => {
    originCartsData = response.data.carts ;
    cartsRender(originCartsData, response.data.finalTotal) ;
  }).catch(() => {
    defaultNotice('warning', '請重新整理頁面！')
  })
}

// post Data
const postProduct = productID => {
  let tempProduct = {data:{}} ;
  let cartsHas = originCartsData.find(item => {
    return item.product.id === productID ;
  });
  if (cartsHas === undefined) {
    originProductsData.forEach(item => {
      if (item.id === productID){
        tempProduct.data.productId = productID ;
        tempProduct.data.quantity = 1 ;
      }
    })
    axios.post(`${apiUrl}/carts`, tempProduct).then(response => {
      originCartsData = response.data.carts ;
      defaultNotice('success', '已加入購物車')
      cartsRender(originCartsData, response.data.finalTotal) ;
    })
  } else {
    defaultNotice('warning', '購物車已有相同商品!')
  }
}

const postOrder = Event => {
  let userObj = {} ;
  userObj.name    = Event.target[0].value ;
  userObj.tel     = Event.target[1].value ;
  userObj.email   = Event.target[2].value ;
  userObj.address = Event.target[3].value ;
  userObj.payment = Event.target[4].value ;
  // 若購物車為不為空且驗證成功
  if (cartsList.textContent !== '' && !hasError){
    axios.post(`${apiUrl}/orders`, {data:{user:userObj}}).then(() => {
      cartsRender([], 0);
      Event.target.reset()
      originCartsData = []
      defaultNotice('success', '感謝您的預定!')
    }).catch(() => {
      defaultNotice('error', '預定失敗~')
    })
  } else if (hasError) {
    defaultNotice('warning', '請檢查預定資訊是否有誤!')
  } else if (cartsList.textContent === '') {
    defaultNotice('warning', '購物車沒有商品喔!')
  }
}

// patch carts
const patchProduct = (catrsID, newQuantity) => {
  let tempProduct = {data:{}} ;
  if (newQuantity === 0){
    defaultNotice('warning', '數量不可低於 1 呦~') ;
  } else {
    tempProduct.data.id = catrsID ;
    tempProduct.data.quantity = newQuantity ;
    axios.patch(`${apiUrl}/carts`, tempProduct).then(response => {
      cartsRender(response.data.carts, response.data.finalTotal) ;
    })
  }
}

// delete carts
const deleteProduct = (cartsID) => {
  if (cartsID === 'clearAll' && cartsList.textContent === '') {
    defaultNotice('warning', '購物車沒有東西~請趕緊加入!')
  } else if (cartsID === 'clearAll' && cartsList.textContent !== '') {
    axios.delete(`${apiUrl}/carts`).then(() => {
      originCartsData = []
      cartsRender(originCartsData, 0) ;
      defaultNotice('success', '已全部刪除!')
    }).catch(() => {
      defaultNotice('error', '刪除失敗~')
    })
  } else {
    axios.delete(`${apiUrl}/carts/${cartsID}`).then(response => {
      originCartsData = response.data.carts ;
      cartsRender(originCartsData, response.data.finalTotal) ;
      defaultNotice('success', '已成功刪除!')
    }).catch(() => {
      defaultNotice('error', '刪除失敗~')
    })
  }
}

// 渲染畫面
// 產品清單
const productsRender = data => {
  let dataStr = '' ;
  data.forEach(item => {
    dataStr += `
    <li class="col">
      <div class="card border-0 rounded-0 h-100">
        <div class="position-relative">
          <img src="${item.images}" class="card-img-top" alt="${item.title}">
          <p class="position-absolute top-0 end-0 translate-middle-y bg-secondary rounded-start p-3 text-white">新品</p>
        </div>
        <div class="card-body p-0">
          <button type="button" value="${item.id}" class="js-addCartsBtn btn btn-dark rounded-0 w-100">加入購物車</button>
          <h4 class="card-text text-info py-2 mb-0">${item.title}</h4>
          <del>${formatPrice(item.origin_price)}</del>
          <p class="h4">${formatPrice(item.price)}</p>
        </div>
      </div>
    </li>` ;
  })
  productsList.innerHTML = dataStr ;
  const addCartsBtns = document.querySelectorAll('.js-addCartsBtn') ;
  addCartsBtns.forEach(item => {
    item.addEventListener('click', Event => {
      postProduct(Event.target.value) ;
    })
  })
}

// 類別清單
const categoryOptions = () => { 
  let selectOptions = '' ;
  let tempCategory = {} ;
  originProductsData.forEach(item => {
    if (tempCategory[item.category] === undefined){
      tempCategory[item.category] = 1 ;
    } else {
      tempCategory[item.category] += 1 ;
    }
  })
  Object.keys(tempCategory).forEach(item => {
    selectOptions += `<option value="${item}">${item}</option>` ;
  })
  productsCategory.innerHTML = '<option value="all" selected>全部</option>' + selectOptions ;
}

// 購物車清單
const cartsRender = (data, totalMoney) => {
  let dataStr = '' ;
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
          <button type="button" value="${item.id}" class="js-qtDown btn btn-light" data-action="down">-</button>
          <button class="btn btn-light" data-quantity="${item.quantity}">${item.quantity}</button>
          <button type="button" value="${item.id}" class="js-qtUp btn btn-light" data-action="up">+</button>
        </div>
      </td>
      <td>${formatPrice(item.product.price * item.quantity)}</td>
      <td><button type="button" value="${item.id}" class="js-delBtn btn btn-light" data-action="delete">X</button></td>
    </tr>
    ` ;
  })
  cartsList.innerHTML = dataStr ;
  finalTotal.textContent = `NT$${formatPrice(totalMoney)}` ;
}

const defaultNotice = (iconName, content) => { 
  Swal.fire({
    position: 'center',
    icon: iconName,
    title: content,
    showConfirmButton: false,
    timer: 1500
  })
}

// 數字千分位
const formatPrice = numStr => {
  return numStr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") ;
}


// 是否顯示 top
const showTop = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop > 100) {
    topBtn.style.opacity = 1;
  } else {
    topBtn.style.opacity = 0 ;
  }
}

// 預設執行
init() ;
window.addEventListener('scroll', showTop)

/* 監聽事件 */
// 在 DOM 結構被完整的讀取跟解析後，執行函式內動作
document.addEventListener('DOMContentLoaded', () => {
    const recommendDOM = document.querySelector('.custom__recommend') ;
    // 變更滑鼠游標樣式
    recommendDOM.style.cursor = 'grab' ;
    // 定義與紀錄目前滑鼠 x y 座標與捲軸拉條至最左側距離
    let pos = { top: 0, left: 0, x: 0, y: 0 } ;
    const mouseDownHandler = Event => {
        recommendDOM.style.cursor = 'grabbing' ;
        pos = {
          // 取得元素之 X 軸與最左側與上端距離
          left: recommendDOM.scrollLeft,
          top: recommendDOM.scrollTop,
          // 取得滑鼠目前座標
          x: Event.clientX,
          y: Event.clientY,
        };
        // 當滑鼠按下時，開始監聽滑鼠拖動與放開事件
        document.addEventListener('mousemove', mouseMoveHandler) ;
        document.addEventListener('mouseup', mouseUpHandler) ;
    };
    const mouseMoveHandler = Event => {
        // 滑鼠移動距離 = 滑鼠移動時的座標 - 已記錄的滑鼠座標
        let dx = Event.clientX - pos.x ;
        let dy = Event.clientY - pos.y ;

        // 變更捲軸位置，已記錄的捲軸拉條左邊頂端位置 - 滑鼠移動距離
        // 舉例 : 拉條初始值為 0 ，滑鼠按下往左移動 -50，相對拉條往右移動 +50
        recommendDOM.scrollTop = pos.top - dy ;
        recommendDOM.scrollLeft = pos.left - dx ;
    };
    const mouseUpHandler = () => {
        recommendDOM.style.cursor = 'grab' ;
        // 當滑鼠放開時，移除滑鼠移動與放開事件
        document.removeEventListener('mousemove', mouseMoveHandler) ;
        document.removeEventListener('mouseup', mouseUpHandler) ;
    };
    // 監聽滑鼠按下事件
    recommendDOM.addEventListener('mousedown', mouseDownHandler) ;
});

// 產品類別選擇
productsCategory.addEventListener('change', Event => {
  let tempData = [] ;
  if (Event.target.value === 'all') {
    productsRender(originProductsData) ;
  } else {
    originProductsData.forEach(item => {
      if (item.category === Event.target.value){
        tempData.push(item) ;
      }
    })
    productsRender(tempData) ;
  }
})

// 購物車操作
cartsList.addEventListener('click', Event => {
  switch (Event.target.dataset.action) {
    case 'down':
      patchProduct(Event.target.value, Event.target.nextElementSibling.dataset.quantity - 1)
      break;
    case 'up':
      patchProduct(Event.target.value, Event.target.previousElementSibling.dataset.quantity*1 + 1)
      break;
    case 'delete':
      deleteProduct(Event.target.value)
      break;
    case undefined:
      return  
  }
})

// 購物車刪除全部
delAll.addEventListener('click', Event => {
  deleteProduct(Event.target.value)
})

// 驗證表單資訊
inputs.forEach(item => {
  item.addEventListener('change', () => {
    item.nextElementSibling.textContent = '';
    let errors = validate(submitOrder, constraints);
    if (errors) {
      hasError = true
      Object.keys(errors).forEach(item => {
        document.querySelector(`.${item}`).textContent =  errors[item][0].split(' ')[2]
      })
    } else {
      hasError = false
    }
  })
})

// 送出預定表單
submitOrder.addEventListener('submit', Event => {
  Event.preventDefault() ;
  postOrder(Event) ;
})

topBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
})