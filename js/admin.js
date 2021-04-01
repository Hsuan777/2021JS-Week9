/* get DOM */
const ordersList = document.querySelector('.js-ordersList');

/* set 變數與初始值 */
const token = 'iES1kIWpBWTvhiBYoMVEVxnPBCb2';
const apiUrl = 'https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/vic/orders';
let originOrdersData = []
let totalProductsData = {}

/* function */
// get Data
const getOrder = () => { 
  axios.get(apiUrl, {headers:{Authorization:token}})
  .then(response => {
    originOrdersData = response.data.orders
    c3Render(originOrdersData)
    ordersRender(originOrdersData)
  })
}

const getProducts = () => {
  axios.get('https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/vic/products').then(response => {
    let productsData = response.data.products
    // 列出所有商品 ID，以利後續圖表整合
    productsData.forEach(item => {
      if (totalProductsData[item.id] === undefined){
        totalProductsData[item.id] = {
          title: item.title,
          price: item.price,
          totalQuantity: 0
        }
      }
    })
  })
}

// delete Data
const deleteOrder = (ordersID) => { 
  if (ordersID === 'clearAll' && ordersList.textContent === '') {
    return
  } else if (ordersID === 'clearAll' && ordersList.textContent !== '') {
    axios.delete(apiUrl, {headers:{Authorization:token}}).then(response => {
      if (response.status === 200) {
        ordersRender(response.data.orders)
      }
    }) 
  } else {
    axios.delete(`${apiUrl}/${ordersID}`, {headers:{Authorization:token}}).then(response => {
      ordersRender(response.data.orders)
    })
  }
}

const ordersRender = (data) => { 
  let dataStr = ``;
  data.forEach(item => {
    dataStr += `
    <tr>
      <td>${item.id}</td>
      <td>
        <p class="mb-0">${item.user.name}</p>
        <pclass="mb-0">${item.user.tel}</pclass>
      </td>
      <td>${item.user.address}</td>
      <td>${item.user.email}</td>
      <td>${item.products[0].title}</td>
      <td>${formatDate(item.createdAt*1000)}</td>
      <td class="bg-dark text-center text-white">${item.paid ? '已處理' : '未處理'}</td>
      <td class="text-center">
        <button type="button" value="${item.id}" class="js-delBtn btn btn-danger">刪除</button>
      </td>
    </tr>   
    `
  }) 
  // 訂單資訊用 innerHTML NG
  ordersList.innerHTML = dataStr
  const delBtns = document.querySelectorAll('.js-delBtn')
  delBtns.forEach(item => {
    item.addEventListener('click', (Event) => {
      deleteOrder(Event.target.value)
    })
  })
}

// 全品項營收比重 品項數量 x 單價
// 格式為 [[品項一, 總收益], []]
const c3Render = (orderData) => { 
  let tempArray = []
  // 將訂單資料的商品 ID 數量整合
  orderData.forEach(orderItem => {
    orderItem.products.forEach(item => {
      totalProductsData[item.id].totalQuantity += item.quantity
    })
  })
  console.log(totalProductsData);
  tempArray = Object.keys(totalProductsData)
  tempArray.map((item, index) =>{
    tempArray[index] = [totalProductsData[item].title, totalProductsData[item].price*totalProductsData[item].totalQuantity]
    return
  })
  console.log(tempArray);
  let chart = c3.generate({
    bindto: '#chart',
    data: {
      type : 'pie',
      columns: tempArray,
      colors: {
        'Charles 系列儲物組合': '##6A33F8',
        'Charles 雙人床架': '#9D7FEA',
        'Louvre 單人床架': '#301E5F',
        'Antony 雙人床架／雙人加大': '#5434A7',
        'Louvre 雙人床架／雙人加大': '#DACBFD',
        'Antony 床邊桌': '',
        'Antony 遮光窗簾': '',
      },
    },
    pie: {
      
    },
  });
}

// 資料給的是秒數，而非毫秒數
const formatDate = (time) => {
  let date = new Date(time)
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}` 
}
getProducts()
getOrder()