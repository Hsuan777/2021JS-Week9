/* get DOM */
const ordersList = document.querySelector('.js-ordersList') ;
const tokenDisplay = document.querySelector('.js-tokenDisplay') ;
const tokenInput = document.querySelector('.js-tokenInput') ;
const pathInput = document.querySelector('.js-pathInput') ;
const tokenSubmit = document.querySelector('.js-tokenSubmit') ;
const errorMsg = document.querySelector('.js-errorMsg') ;
const orderDisplay = document.querySelector('.js-orderDisplay') ;
const chartsDisplay = document.querySelector('.js-chartsDisplay') ;
const delAllBtn = document.querySelector('.js-delAllBtn') ;
const signOut = document.querySelector('.js-signOut') ;

/* set 變數與初始值 */
const apiUrl = 'https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin' ;
let token = '' ;
let apiPath = '' ;
let originOrdersData = [] ;
let totalProductsData = {} ;
let uuid = {}

/* function */
// get Data
const getOrder = () => { 
  axios.get(`${apiUrl}/${apiPath}/orders`, uuid)
  .then(response => {
    tokenDisplay.classList.add('d-none') ;
    orderDisplay.classList.remove('d-none') ;
    originOrdersData = response.data.orders ;
    if (originOrdersData[0] === undefined) {
      defaultNotice('warning', '還沒有訂單喔!') ;
    } else {
      chartsDisplay.classList.remove('d-none') ;
      highChartRender(originOrdersData) ;
    }
    ordersRender(originOrdersData) ;
  }).catch(() => {
    tokenDisplay.classList.remove('d-none') ;
    errorMsg.textContent = 'Input Error' ;
    document.cookie = 'hexToken=; expires=; path=/' ;
    document.cookie = 'hexPath=; expires=; path=/' ;
    defaultNotice('error', '登入失敗！')
  })
}

const getProducts = () => {
  axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${apiPath}/products`)
  .then(response => {
    let productsData = response.data.products ;
    // 列出所有商品 ID，以利後續圖表整合
    productsData.forEach(item => {
      if (totalProductsData[item.id] === undefined){
        totalProductsData[item.id] = {
          title: item.title,
          price: item.price,
          category: item.category,
          totalQuantity: 0
        }
      }
    })
  }).catch(() => {
    tokenDisplay.classList.remove('d-none') ;
    errorMsg.textContent = 'Input Error' ;
    document.cookie = 'hexToken=; expires=; path=/' ;
    document.cookie = 'hexPath=; expires=; path=/' ;
  })
}

// put Data
const putOrder = (orderID, bool) => { 
  let orderData = {data:{id: orderID, paid: bool}}
  axios.put(`${apiUrl}/${apiPath}/orders`, orderData, uuid).then(response => {
    ordersRender(response.data.orders) ;
  })
}

// delete Data
const deleteOrder = ordersID => { 
  if (ordersID === 'clearAll' && ordersList.textContent === '') {
    defaultNotice('warning', '沒有訂單呦~')
  } else if (ordersID === 'clearAll' && ordersList.textContent !== '') {
    axios.delete(`${apiUrl}/${apiPath}/orders`, uuid).then(response => {
      chartsDisplay.classList.add('d-none') ;
      ordersRender(response.data.orders) ;
      highChartRender(response.data.orders) ;
      defaultNotice('success', '已全部刪除!')
    }).catch(() => {
      defaultNotice('error', '刪除失敗~')
    })
  } else {
    axios.delete(`${apiUrl}/${apiPath}/orders/${ordersID}`,  uuid).then(response => {
      ordersRender(response.data.orders) ;
      highChartRender(response.data.orders) ;
      if (response.data.orders[0] === undefined) {
        chartsDisplay.classList.add('d-none') ;
      }
      defaultNotice('success', '已成功刪除!') ;
    }).catch(() => {
      defaultNotice('error', '刪除失敗~') ;
    })
  }
}

const ordersRender = data => { 
  let dataStr = '' ;
  data.sort((a, b) => {
    return b.createdAt - a.createdAt
  })
  data.forEach((item, index) => {
    let otherProductsStr = '' ;
    let moreStr = '' ;
    if (item.products[1]) {
      moreStr = `
      <a class="btn btn-primary" data-bs-toggle="collapse" href="#collapse${index}" role="button" aria-expanded="false" aria-controls="collapse${index}">
        more
      </a>`
    }
    item.products.forEach((productItem, index) => {
      if (item.products[1] && index !== 0)
      otherProductsStr += `<p class="mb-0">${productItem.title}</p>` ;
    }) 
    dataStr += `
    <tr>
      <td>${item.id}</td>
      <td>
        <p class="mb-0">${item.user.name}</p>
        <p class="mb-0">${item.user.tel}</p>
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
      <td class="bg-dark text-white">
        <div class="d-flex flex-column align-items-center">
          <label class="switch me-2">
            <input type="checkbox" data-orderID="${item.id}" ${item.paid ? 'checked' : ''} >
            <span class="slider round"></span>
          </label>
          <span>${item.paid ? '已處理' : '未處理'}</span> 
        </div>
      </td>
      <td class="text-end">
        ${moreStr}
        <button type="button" value="${item.id}" class="js-delBtn btn btn-outline-danger">刪除</button>
      </td>
    </tr>   
    `
  }) 
  if (dataStr === '') {
    delAllBtn.classList.add('d-none') ;
    ordersList.innerHTML = `<tr><td colspan="9" class="text-center">還沒有訂單喔~</td></tr>` ;
  } else {
    delAllBtn.classList.remove('d-none') ;
    ordersList.innerHTML = dataStr ;
  }
}

// highChart.js
const highChartRender = orderData => {
  // 全部資料暫存
  let tempData = [] ;
  let tempTotalProuctsData = JSON.parse(JSON.stringify(totalProductsData))
  
  // 前三名資料暫存
  let topThreeData = [] ;
  let tempOtherData = {name:'其他', y: 0} ;

  // 類別資料暫存
  let tempCategoryData = []
  let tempCategoryObj = {}

  // 將訂單資料的商品 ID 數量整合並做營收遞減排序
  orderData.forEach(orderItem => {
    orderItem.products.forEach(item => {
      tempTotalProuctsData[item.id].totalQuantity += item.quantity ;
    })
  })
  tempData = Object.keys(tempTotalProuctsData) ;
  tempData.map((item, index) =>{
    tempData[index] = {
      name: tempTotalProuctsData[item].title, 
      y: tempTotalProuctsData[item].price * tempTotalProuctsData[item].totalQuantity,
      category:tempTotalProuctsData[item].category 
    }
    return
  })
  tempData.sort((a, b) => {
    return b.y - a.y
  })

  // 取出前三名資料與其他
  tempData.forEach((item, index) => {
    if (index < 3) {
      topThreeData.push(item)
    } else {
      tempOtherData.y += item.y
    }
  })
  topThreeData.push(tempOtherData)
  
  // 類別營收
  tempData.forEach(item => {
    if (tempCategoryObj [item.category] === undefined) {
      tempCategoryObj[item.category] = item.y
    } else {
      tempCategoryObj[item.category] += item.y
    }
  })
  tempCategoryData = Object.keys(tempCategoryObj)
  tempCategoryData.map((item, index) => {
    tempCategoryData[index] = {name:item, y:tempCategoryObj[item]}
    return
  }) 
  Highcharts.chart('highChart', {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: `全品項營收`
    },
    tooltip: {
      // 格式化為 % 數
      // pointFormat: '{series.name}:<b>{point.percentage:.1f}%</b>'
    },
    colors: ['#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6', '#3B3EAC'],
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
      name: '實際營收',
      data: tempData
    }],
    credits: {
      enabled: false
  	}
  });
  Highcharts.chart('highChartTopThree', {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: '前三名品項營收'
    },
    colors: ['#301E5F', '#5434A7', '#9D7FEA', '#DACBFF'],
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
      name: '實際營收',
      data: topThreeData
    }],
    credits: {
      enabled: false
  	}
  }) ;
  Highcharts.chart('highChartCategory', {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: '類別總營收'
    },
    colors: ['#301E5F', '#5434A7', '#9D7FEA', '#DACBFF'],
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
      name: '實際營收',
      data: tempCategoryData
    }],
    credits: {
      enabled: false
  	}
  }) ;
}

// 資料給的是秒數，而非毫秒數
const formatDate = time => {
  let date = new Date(time) ;
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}` ;
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

// 將 token 存入 cookie
tokenSubmit.addEventListener('click', () => {
  if (pathInput.value !== '' && tokenInput.value !== ''){
    token = tokenInput.value.trim() ;
    apiPath = pathInput.value.trim() ;
    uuid = {headers:{Authorization:token}}
    document.cookie = `hexToken=${token}; expires=${new Date().getTime()*1000}; path=/` ;
    document.cookie = `hexPath=${apiPath}; expires=${new Date().getTime()*1000}; path=/` ;
    tokenInput.value = '' ;
    pathInput.value = '' ;
    getOrder() ;
    getProducts() ;
  } else if (pathInput.value === '' && tokenInput.value === '') {
    defaultNotice('warning', '請輸入 Path 與 Token')
  } else if (pathInput.value === '') {
    defaultNotice('warning', '請輸入 Path')
  } else if (tokenInput.value === '') {
    defaultNotice('warning', '請輸入 Token')
  }
})

// 暫存 patch 與 token
tokenInput.addEventListener('keydown', Event => {
  if (Event.key === 'Enter' && pathInput.value !== '' && tokenInput.value !== ''){
    token = tokenInput.value ;
    apiPath = pathInput.value ;
    uuid = {headers:{Authorization:token}}
    document.cookie = `hexToken=${token}; expires=${new Date().getTime()*10}; path=/` ;
    document.cookie = `hexPath=${apiPath}; expires=${new Date().getTime()*10}; path=/` ;
    tokenInput.value = '' ;
    getOrder() ;
    getProducts() ;
  } else if (Event.key === 'Enter' && pathInput.value === '' && tokenInput.value === '') {
    defaultNotice('warning', '請輸入 Path 與 Token')
  } else if (Event.key === 'Enter' && pathInput.value === '') {
    defaultNotice('warning', '請輸入 Path') ;
  } else if (Event.key === 'Enter' && tokenInput.value === '') {
    defaultNotice('warning', '請輸入 Token') ;
  }
})


// 登出並清除 cookie
signOut.addEventListener('click', () => {
  document.cookie = 'hexToken=; expires=; path=/' ;
  document.cookie = 'hexPath=; expires=; path=/' ;
  tokenDisplay.classList.remove('d-none') ;
  orderDisplay.classList.add('d-none') ;
  chartsDisplay.classList.add('d-none') ;
  errorMsg.textContent = '' ;
  originOrdersData = [] ;
  totalProductsData = {} ;
  token = '' ;
  uuid = {} ;
  ordersRender(originOrdersData) ;
  highChartRender(originOrdersData) ;
  window.location.replace('./index.html') ;
})

// 進入頁面時從 cookie 取出 token
token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*=\s*([^;]*).*$)|^.*$/, '$1') ;
apiPath = document.cookie.replace(/(?:(?:^|.*;\s*)hexPath\s*=\s*([^;]*).*$)|^.*$/, '$1') ;
if (token && apiPath) {
  // 如果被修改，這邊還會重組驗證用物件
  uuid = {headers:{Authorization:token}}
  getOrder() ;
  getProducts() ;
} else {
  tokenDisplay.classList.remove('d-none') ;
}

orderDisplay.addEventListener('click', Event => {
  if (Event.target.tagName === 'BUTTON') {
    deleteOrder(Event.target.value) ;
  }
  if (Event.target.tagName === "INPUT") {
    putOrder(Event.target.getAttribute('data-orderID'), Event.target.checked) ;
  }
}, true)
