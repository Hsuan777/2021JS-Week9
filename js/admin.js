/* get DOM */
const ordersList = document.querySelector('.js-ordersList');
const tokenDisplay = document.querySelector('.js-tokenDisplay');
const tokenInput = document.querySelector('.js-tokenInput');
const pathInput = document.querySelector('.js-pathInput');
const tokenSubmit = document.querySelector('.js-tokenSubmit');
const errorMsg = document.querySelector('.js-errorMsg');
const orderDisplay = document.querySelector('.js-orderDisplay');
const chartDisplay = document.getElementById('highChart')
const signOut = document.querySelector('.js-signOut');

/* set 變數與初始值 */
const apiUrl = 'https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin';
let token = '';
let apiPath = '';
let originOrdersData = []
let totalProductsData = {}

/* function */
// get Data
const getOrder = () => { 
  axios.get(`${apiUrl}/${apiPath}/orders`, {headers:{Authorization:token}})
  .then(response => {
    tokenDisplay.classList.add('d-none')
    orderDisplay.classList.remove('d-none')
    chartDisplay.classList.remove('d-none')
    originOrdersData = response.data.orders
    ordersRender(originOrdersData)
    highChartRender(originOrdersData)
  }).catch(error => {
    if (error) {
      tokenDisplay.classList.remove('d-none')
      errorMsg.textContent = 'Input Error'
      document.cookie = 'hexToken=; expires=; path=/'
      document.cookie = 'hexPath=; expires=; path=/'
    }
  })
}

const getProducts = () => {
  axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${apiPath}/products`).then(response => {
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
  }).catch(error => {
    if (error) {
      tokenDisplay.classList.remove('d-none')
      errorMsg.textContent = 'Input Error'
      document.cookie = 'hexToken=; expires=; path=/'
      document.cookie = 'hexPath=; expires=; path=/'
    }
  })
}

// delete Data
const deleteOrder = (ordersID) => { 
  if (ordersID === 'clearAll' && ordersList.textContent === '') {
    return
  } else if (ordersID === 'clearAll' && ordersList.textContent !== '') {
    axios.delete(`${apiUrl}/${apiPath}/orders`, {headers:{Authorization:token}}).then(response => {
      ordersRender(response.data.orders)
      highChartRender(response.data.orders)
    }) 
  } else {
    axios.delete(`${apiUrl}/${apiPath}/orders/${ordersID}`, {headers:{Authorization:token}}).then(response => {
      ordersRender(response.data.orders)
      highChartRender(response.data.orders)
    })
  }
}

const ordersRender = (data) => { 
  let dataStr = ``;
  data.forEach((item, index) => {
    let otherProductsStr = ``
    let moreStr = ``
    if (item.products[1]) {
      moreStr = `
      <a class="btn btn-primary" data-bs-toggle="collapse" href="#collapse${index}" role="button" aria-expanded="false" aria-controls="collapse${index}">
        more
      </a>`
    }
    item.products.forEach((productItem, index) => {
      if (item.products[1] && index !== 0)
      otherProductsStr += `<p class="mb-0">${productItem.title}</p>`
    }) 
    dataStr += `
    <tr>
      <td>${item.id}</td>
      <td>
        <p class="mb-0">${item.user.name}</p>
        <pclass="mb-0">${item.user.tel}</pclass>
      </td>
      <td>${item.user.address}</td>
      <td>${item.user.email}</td>
      <td>
        ${item.products[0].title}
        <div class="collapse" id="collapse${index}">
          ${otherProductsStr}
        </div>
      </td>
      <td>${formatDate(item.createdAt*1000)}</td>
      <td class="bg-dark text-center text-white">${item.paid ? '已處理' : '未處理'}</td>
      <td class="text-center">
        ${moreStr}
        <button type="button" value="${item.id}" class="js-delBtn btn btn-danger">刪除</button>
      </td>
    </tr>   
    `
  }) 
  ordersList.innerHTML = dataStr
  const delBtns = document.querySelectorAll('.js-delBtn')
  delBtns.forEach(item => {
    item.addEventListener('click', (Event) => {
      deleteOrder(Event.target.value)
    })
  })
}

// highChart.js
const highChartRender = orderData => {
  let tempData = []
  // 將訂單資料的商品 ID 數量整合
  orderData.forEach(orderItem => {
    orderItem.products.forEach(item => {
      totalProductsData[item.id].totalQuantity += item.quantity
    })
  })
  tempData = Object.keys(totalProductsData)
  tempData.map((item, index) =>{
    tempData[index] = {name:totalProductsData[item].title, y:totalProductsData[item].price*totalProductsData[item].totalQuantity}
    return
  })
  let colors = ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6', '#3B3EAC'];
  Highcharts.chart('highChart', {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: '全品項營收'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    colors: colors,
    plotOptions: {
      pie: {
        allowPointSelect: true,
        innerSize: '50%',
        cursor: 'pointer',
        dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            connectorColor: 'black'
        }
      }
    },
    xAxis: {
      categories: Object.keys(totalProductsData)
    },
    series: [{
      name: '營收比例',
      data: tempData
    }],
    credits: {
      enabled: false
  	}
  });
}

// 資料給的是秒數，而非毫秒數
const formatDate = (time) => {
  let date = new Date(time)
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}` 
}

// 將 token 存入 cookie
tokenSubmit.addEventListener('click', () => {
  if (pathInput.value !== "" && tokenInput.value !== ""){
    token = tokenInput.value
    apiPath = pathInput.value
    document.cookie = `hexToken=${token}; expires=${new Date().getTime()*10}; path=/`
    document.cookie = `hexPath=${apiPath}; expires=${new Date().getTime()*10}; path=/`
    tokenInput.value = ''
    pathInput.value = ''
    getOrder()
    getProducts()
  } 
})

// 暫存 patch 與 token
tokenInput.addEventListener('keydown', (Event) => {
  if (Event.key === 'Enter' && pathInput.value !== '' && tokenInput.value !== ''){
    token = tokenInput.value
    apiPath = pathInput.value
    document.cookie = `hexToken=${token}; expires=${new Date().getTime()*10}; path=/`
    document.cookie = `hexPath=${apiPath}; expires=${new Date().getTime()*10}; path=/`
    tokenInput.value = ''
    getOrder()
    getProducts()
  } 
})


// 登出並清除 cookie
signOut.addEventListener('click', () => {
  document.cookie = 'hexToken=; expires=; path=/'
  document.cookie = 'hexPath=; expires=; path=/'
  tokenDisplay.classList.remove('d-none')
  orderDisplay.classList.add('d-none')
  chartDisplay.classList.add('d-none')
  errorMsg.textContent = ''
  originOrdersData = []
  totalProductsData = {}
  ordersRender(originOrdersData)
  highChartRender(originOrdersData)
  window.location.replace('./index.html')
})

// 進入頁面時從 cookie 取出 token
token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/, '$1');
apiPath = document.cookie.replace(/(?:(?:^|.*;\s*)hexPath\s*=\s*([^;]*).*$)|^.*$/, '$1');
if (token && apiPath) {
  getOrder()
  getProducts()
} else {
  tokenDisplay.classList.remove('d-none')
}