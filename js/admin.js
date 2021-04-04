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
    ordersRender(originOrdersData)
    highChartRender(originOrdersData)
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
        highChartRender(response.data.orders)
      }
    }) 
  } else {
    axios.delete(`${apiUrl}/${ordersID}`, {headers:{Authorization:token}}).then(response => {
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
  // 訂單資訊用 innerHTML NG
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
  console.log(tempData);
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
getProducts()
getOrder()