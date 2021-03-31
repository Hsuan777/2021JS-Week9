/* get DOM */
const ordersList = document.querySelector('.js-ordersList');

/* set 變數與初始值 */
const token = '';
const apiUrl = 'https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/vic/orders';
let originOrdersData = []



/* function */
// get Data
const getOrder = () => { 
  axios.get(apiUrl, {headers:{Authorization:token}})
  .then(response => {
    originOrdersData = response.data.orders
    ordersRender(originOrdersData)
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

// 資料給的是秒數，而非毫秒數
const formatDate = (time) => {
  let date = new Date(time)
  return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}` 
}

getOrder()