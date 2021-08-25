const urlParams = new URLSearchParams(window.location.search)
const chatId = urlParams.get('id')
console.log('chatId', chatId)
let amount

async function appendGroupName() {
  const Chats = await Moralis.Object.extend('Chats')
  const query = new Moralis.Query(Chats)
  query.equalTo('objectId', chatId)
  const results = await query.find()
  let groupName = results[0].attributes.groupName
  document.getElementById('groupNameDisplay').innerHTML = groupName
}

async function getRequiredChatToken() {
  const Chats = await Moralis.Object.extend('Chats')
  const query = new Moralis.Query(Chats)
  query.equalTo('objectId', chatId)
  const results = await query.find()
  let chatToken = results[0].attributes.groupToken
  return chatToken
}

// send message by pressing "enter" (in addition to clicking send)
document.getElementById('chatMessageInput').addEventListener(
  'keydown',
  (e) => {
    if (e.keyCode === 13 || e.keyCode === 10) {
      sendMessage()
    }
  },
  false,
)

// this is me sending a message and it appears in blue box
async function sendMessage() {
  let newMessage = $('#chatMessageInput').val()

  var html = `<div class="message-box my-message-box">
                <div class="message my-message">${newMessage}</div>
                <div class="separator"></div>
              </div>`

  document.getElementById('chatHistory').innerHTML += html

  document.getElementById('chatMessageInput').value = ''

  scrollToBottom()

  let moralisUser = Moralis.User.current()
  let name = moralisUser.get('name')
  let address = moralisUser.get('ethAddress')

  $('#sendMessageChatBtn').removeClass('disabled')
  if (newMessage && newMessage.length > 0) {
    console.log(newMessage, 'from', name, 'for group', chatId)
    const Message = Moralis.Object.extend('Message')
    const message = new Message()
    message.set('senderName', name)
    message.set('senderAddress', address) //must have both to differentiate who sent what
    message.set('message', newMessage)
    message.set('address', address)
    message.set('group', chatId)
    message.set('counter')
    message.increment('counter')
    message.save()
  }
}

async function listenForMessages() {
  let query = new Moralis.Query('Message')
  let subscription = await query.subscribe()

  let moralisUser = Moralis.User.current()

  let address = moralisUser.get('ethAddress')

  subscription.on('create', (object) => {
    console.log('message created', object)
    console.log(object.get('group'), chatId)
    let name = object.get('senderName')
    if (
      object.get('group') == chatId &&
      object.get('senderAddress') != address
    ) {
      var html = `<div class="message-box others-message-box">
                    <div class="message others-message">${name}: ${object.get(
        'message',
      )}</div>
                    <div class="separator"></div>
                  </div>`
      document.getElementById('chatHistory').innerHTML += html

      scrollToBottom()
    }
  })
}

// this is great and it calls all, but after a while, the front end doesn't load any new messages
// for now I have skipped the first 100 but as it grows the problem will continue
async function getHistoryMessages() {
  const Message = Moralis.Object.extend('Message')
  const query = new Moralis.Query(Message)
  query.equalTo('group', chatId)
  query.skip(50)
  const results = await query.find()

  const historyList = document.getElementById('historyList')

  results.forEach((message) => {
    let listItem = document.createElement('li')
    let userInfo = document.createElement('div')

    let date = message.get('createdAt')
    date = new Date(date).toLocaleString()

    var callButton = `<button class="btn btn-sm btn-outline-secondary" id="call-button" onclick="videoCall(${message.get(
      'senderName',
    )})"><i class="fas fa-phone"></i> Call</button>`

    userInfo.innerHTML = `<div class="user-info">
                            <div class="user-name inline">${message.get(
                              'senderName',
                            )}
                              <div class="message-created inline">${date}</div>
                              <div class="call-button inline">${callButton}</div>
                            </div>
                            
                            <div class="user-message">${message.get(
                              'message',
                            )}</div>
                          </div>`

    listItem.appendChild(userInfo)
    historyList.appendChild(listItem)
  })
  scrollToBottom()
}

// build function that allows me to get all historic messages when user scrolls up to the beginning of the chat
async function getOlderMessages() {
  const Message = Moralis.Object.extend('Message')
  const query = new Moralis.Query(Message)
  query.equalTo('group', chatId)
  const results = await query.find()

  const historyList = document.getElementById('historyList')

  results.forEach((message) => {
    let listItem = document.createElement('li')
    let userInfo = document.createElement('div')

    let date = message.get('createdAt')
    date = new Date(date).toLocaleString()

    var callButton = `<button class="btn btn-sm btn-outline-secondary" id="call-button" onclick="videoCall(${message.get(
      'senderName',
    )})"><i class="fas fa-phone"></i> Call</button>`

    userInfo.innerHTML = `<div class="user-info">
                            <div class="user-name inline">${message.get(
                              'senderName',
                            )}
                              <div class="message-created inline">${date}</div>
                              <div class="call-button inline">${callButton}</div>
                            </div>
                            
                            <div class="user-message">${message.get(
                              'message',
                            )}</div>
                          </div>`

    listItem.appendChild(userInfo)
    historyList.appendChild(listItem)
  })
}

async function videoCall(name) {}

// function to call getSkippedMessages function when user is at the beginning of the chat
function scrollToTop() {
  $('#chatHistory').scrollTop($('#chatHistory')[0].scrollHeight)
}

$('#chatHistory').scroll(() => {
  if ($('#chatHistory')[0].scrollTop === 0) {
    getOlderMessages()
    console.log('top')
  }
  if (
    $('#chatHistory')[0].scrollTop ===
    $('#chatHistory')[0].scrollHeight - 800
  ) {
    console.log('bottom')
    getHistoryMessages()
  }
})

// function to ensure history chat is scrolled to the bottom
function scrollToBottom() {
  var chatHistory = document.getElementById('chatHistory')
  chatHistory.scrollTop = chatHistory.scrollHeight
}

function getBottom() {
  var chatHistory = document.getElementById('chatHistory')
  return chatHistory.scrollHeight - chatHistory.scrollTop
}

function goDark() {
  document.body.classList.toggle('dark-mode')
  $('#dark-light-toggle').html('<i class="fas fa-moon"></i>')
  $('.bg-white').addClass('bg-white')
  $('.bg-white').removeClass('bg-black')
  $('#chatMessageInput').removeClass('dark-mode')

  // check to see if in dark mode and if so, switch button to sun icon
  if (document.body.classList.contains('dark-mode')) {
    $('#dark-light-toggle').html('<i class="fas fa-lightbulb"></i>')
    $('.bg-white').removeClass('bg-white')
    $('.bg-white').addClass('bg-black')
    $('#chatMessageInput').addClass('dark-mode')
  }
}

async function verifyUserHoldsToken() {
  // get user tokens:
  const ercBalance = await Moralis.Web3.getAllERC20()
  const nftBalance = await Moralis.Web3.getNFTs()
  const testnetNFTs = await Moralis.Web3.getNFTs({ chain: 'rinkeby' })

  // create a loop to get all symbols form all balance objects
  let symbols = []
  for (let i = 0; i < ercBalance.length; i++) {
    symbols.push(ercBalance[i].symbol)
  }
  for (let i = 0; i < nftBalance.length; i++) {
    symbols.push(nftBalance[i].symbol)
  }
  for (let i = 0; i < testnetNFTs.length; i++) {
    symbols.push(testnetNFTs[i].symbol)
  }
  // many symbols are coming as null, so I want to remove them
  symbols = symbols.filter((x) => x !== null)
  console.log('symbols', symbols)

  let chatToken = await getRequiredChatToken()

  // check if chat token is in the list of symbols
  if (symbols.indexOf(chatToken) > -1) {
    console.log('token found')
    return true
  } else {
    console.log('token not found')
    return false
  }
}

async function allowToChat() {
  var userHasToken = await verifyUserHoldsToken()
  if (!userHasToken) {
    $('#sendMessageChatBtn').addClass('disabled')
    alert(`You are welcome to read, but you must hold ${chatToken} to chat.`)
  }
}

appendGroupName()
allowToChat()
getHistoryMessages()
listenForMessages()
