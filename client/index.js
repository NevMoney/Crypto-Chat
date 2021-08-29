// connect to Moralis server
Moralis.initialize('S1k7puWaAqAsrVqoYeMLfI28hwLmLRtYyuoC3hNH')
Moralis.serverURL = 'https://khep691mo8hw.moralisweb3.com:2053/server'

Moralis.Web3.getSigningData = () => 'Welcome to Crypto Chat'

let user

//   once page loads, check if user is logged in and display appropriate button
$(document).ready(async function () {
  // is user logged in
  let moralisUser = Moralis.User.current()
  if (!moralisUser) {
    notLoggedIn()
  } else {
    loggedIn()
  }
})

function notLoggedIn() {
  $('#welcome_text').empty()
  $('#btn-login').show()
  $('#btn-logout').hide()
  $('.content').hide()
  $('#btn-userInfo').hide()
  $('#userInfo').hide()
  $('#welcome_text').append(`
    <p class="lead text-center text-md-left text-muted mb-6 mb-lg-8">
        Crypto Chat is a place where people can share their knowledge, ask questions, and learn from each other about crypto. 
    </p>
    <p class="lead text-center text-md-left text-muted mb-6 mb-lg-8">
        Unlike other platforms, this place is reserved for crypto HODLers, just like you!
    </p>
    <p class="lead text-center text-md-left text-muted mb-6 mb-lg-8">
        To view and create chats, you must have MetaMask browser extension. Now click "Login" and we'll see you on the other side. 
    </p>
      `)
}

async function loggedIn() {
  const web3 = new Web3(window.ethereum)
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
  user = web3.utils.toChecksumAddress(accounts[0])
  $('#welcome_text').empty()
  $('#btn-login').hide()
  $('#btn-logout').show()
  $('.content').show()
  $('#btn-userInfo').show()
  $('#userInfo').hide()
  $('#welcome_text').append(`
        <p class="lead text-center text-md-left text-muted mb-6 mb-lg-8">
            As a token holder you can create chat rooms where other crypto enthusiasts can join. 
        </p>
        <p class="lead text-center text-md-left text-muted mb-6 mb-lg-8">
            Please note that you can create token specific chat only if you hold it!
        </p>
        <p class="lead text-center text-md-left text-muted mb-6 mb-lg-8">
            And while anyone with crypto-wallet can visit the chat room, only holders can send messages and interact. 
        </p>
      `)
}

// add from here down
async function login() {
  let mUser = Moralis.User.current()
  if (!mUser) {
    mUser = await Moralis.Web3.authenticate()
    loggedIn()
  }
  console.log('logged in user:', mUser)
}

async function logOut() {
  await Moralis.User.logOut()
  console.log('logged out')
  notLoggedIn()
}

// in MyProfile page this information is populated
const showUserInfo = async () => {
  $('#userInfo').show()
  let moralisUser = await Moralis.User.current()
  let userNameField = document.getElementById('userName')

  if (moralisUser) {
    userNameField.value = moralisUser.get('username')
  }
}

// in MyProfile user can update information including add avatar.
const saveUserInfo = async () => {
  let moralisUser = await Moralis.User.current()
  moralisUser.set('username', $('#userName').val())
  await moralisUser.save()
  alert('Username updated!')
  showUserInfo()
}

$('#saveProfileInfoBtn').on('click', function () {
  saveUserInfo()
})

$('#closeProfileInfoBtn').on('click', function () {
  $('#userInfo').hide()
})

async function getUsername() {
  let moralisUser = await Moralis.User.current()
  return moralisUser.get('username')
}

async function getUserHoldings() {
  const queryEth = new Moralis.Query('EthBalance')
  const results = await queryEth.find()

  const queryToken = new Moralis.Query('EthTokenBalance')
  const resultsToken = await queryToken.find()

  const queryNFT = new Moralis.Query('EthNFTOwners')
  const resultsNFT = await queryNFT.find()

  let balances = []
  let userNFTs = []

  for (let i = 0; i < results.length; i++) {
    results[i] = {
      balance: results[0].get('balance'),
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    }
    balances.push(results[i])
  }

  for (let n = 0; n < resultsToken.length; n++) {
    resultsToken[n] = {
      balance: resultsToken[n].get('balance'),
      symbol: resultsToken[n].get('symbol'),
      name: resultsToken[n].get('name'),
      decimals: resultsToken[n].get('decimals'),
      address: resultsToken[n].get('token_address'),
    }

    balances.push(resultsToken[n])
  }

  for (let m = 0; m < resultsNFT.length; m++) {
    resultsNFT[m] = {
      balance: resultsNFT[m].get('amount'),
      symbol: resultsNFT[m].get('symbol'),
      name: resultsNFT[m].get('name'),
      address: resultsNFT[m].get('token_address'),
      tokenId: resultsNFT[m].get('token_id'),
      tokenURI: resultsNFT[m].get('token_uri'),
    }
    userNFTs.push(resultsNFT[m])
  }

  if (balances.length > 0 || userNFTs.length > 0) {
    console.log('user has crypto')
    return [balances, userNFTs]
  } else {
    alert('You do not have any crypto. Get some and join us.')
  }
}

// this function verifies what the user holds
async function verifyHolding() {
  let holdings = await getUserHoldings()
  console.log(holdings)

  // holdings is an aray of arays, need to extract the two
  let balances = holdings[0]
  let userNFTs = holdings[1]

  // each of the above variables is an aray of objects, need to extract the object

  let symbols = []
  for (let i = 0; i < balances.length; i++) {
    symbols.push(balances[i].symbol)
  }
  for (let i = 0; i < userNFTs.length; i++) {
    symbols.push(userNFTs[i].symbol)
  }
  console.log(symbols)
  return symbols
}

// this function checks for groups in DB and returns them
async function checkGroupInfo() {
  // query chats table to ensure there are no other groups with same token or name
  const query = new Moralis.Query('Chats')
  const results = await query.find()
  return results
}

// this function lets users create chat groups by specifying name and token after it verifies that the creator holds that crypto AND there are no other groups with same parameters
async function createGroup() {
  const groupName = $('#groupNameInput').val()
  const groupToken = $('#tokenInput').val()
  const user = Moralis.User.current()
  const creatorAddress = user.get('accounts')
  const creatorName = user.get('username')
  console.log('group', groupName, groupToken, creatorAddress[0])

  let holdings = await verifyHolding()
  var groupInfo = await checkGroupInfo()

  if (groupInfo) {
    // loop through all groups and check if group name or token are already in use
    for (let i = 0; i < groupInfo.length; i++) {
      if (groupInfo[i].attributes.groupName === groupName) {
        alert('This group name already exists. Please select a different name.')
        return
      }
      if (groupInfo[i].attributes.groupToken === groupToken) {
        alert('This token already exists. Please select a different token.')
        return
      }
    }
  }

  if (holdings.indexOf(groupToken) === -1) {
    alert(`You must hold ${groupToken} to create this group.`)
  } else {
    const GroupChat = await Moralis.Object.extend('Chats')
    const groupChat = new GroupChat()
    groupChat.set('groupName', groupName)
    groupChat.set('groupToken', groupToken)
    groupChat.set('creatorAddress', creatorAddress[0])
    groupChat.set('creatorName', creatorName)
    groupChat.save()
    console.log('created groupChat', groupChat)
    getGroupChats()
  }
}

// this function creates a random ID that we save in databased when we create a chat group
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16),
  )
}

// this grabs chat groups from DB and diplays the list. When user clicks on the link they are taken to that chat room
async function getGroupChats() {
  $('#chatRoomsList').empty()
  const Chats = await Moralis.Object.extend('Chats')
  const query = new Moralis.Query(Chats)
  const results = await query.find()

  $('#chatListSpinner').hide()

  for (let object of results) {
    let groupName = object.get('groupName')
    let listItem = document.createElement('li')
    // listItem.innerHTML = `<a href="/chatRoom.ejs?id=${
    //   object.id
    // }" id="${object.get('groupChatId')}">${groupName}</a>`
    listItem.innerHTML = `<a href="http://localhost:3000/chatRoom" id="${object.get(
      'groupChatId',
    )}">${groupName}</a>`
    $('#chatRoomsList').append(listItem)
  }
}

getGroupChats()

// creationg stripe checkout
function stripeCheckout() {
  console.log('stripe checkout')
  // we will use server.js app.post('/create-checkout-session', async (req, res) function to create a checkout session
  fetch(`http://localhost:3000/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        { id: 1, quantity: 1 },
        // { id: 2, quantity: 1 },
        // { id: 3, quantity: 1 },
      ],
    }),
  })
    .then((res) => {
      if (res.ok) return res.json()
      return res.json().then((json) => Promise.reject(json))
    })
    .then(({ url }) => {
      console.log('url', url)
      window.location = url
    })
    .catch((err) => {
      console.log(err.error)
    })
}

function displayCallOptionsDiv() {
  console.log('displayOptions clicked')
  $('#callOptionsDiv').show()
  $('#createVideoCallButton').hide()
}

function createVideoCall() {
  console.log('createVideoCall clicked')
  $('#callOptionsDiv').hide()
  $('#videoCallDiv').show()
}

// need a sleep function to wait for videoRoom to save
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateNewVideoRoom() {
  console.log('generateNewVideoRoom clicked')

  const videoRoom = await getVideoRoomId()
  console.log('videoRoomId', videoRoom)

  // /room/44e2d77b-9d7e-46f6-b28f-d7b496a884e8 is the response, but I only need what comes after the last /
  const videoRoomString = videoRoom.split('/')
  console.log('videoRoomString', videoRoomString)
  const videoRoomId = videoRoomString[videoRoomString.length - 1]
  console.log('videoRoomIdStringLast', videoRoomId)

  // grab moralis DB user info
  const mUser = Moralis.User.current()
  const userAddress = mUser.get('accounts')
  const userName = mUser.get('username')

  // then we need to create a new video room
  const videoRooms = new Moralis.Object('VideoRooms')
  videoRooms.set('creatorAddress', userAddress[0])
  videoRooms.set('creatorUsername', userName)
  videoRooms.set('videoRoomId', videoRoomId)
  videoRooms.save()
  console.log('videoRoom', videoRooms)

  // then display the video room link at index.html ul#videoRoomsList
  const listItem = document.createElement('li')
  listItem.innerHTML = `<a href="http://localhost:3000/room/${videoRoomId}">${videoRoomId}</a>`
  $('#videoRoomsList').append(listItem)

  console.log(`http://localhost:3000/room/${videoRoomId}`)

  sleep(2000).then(() => {
    // open in new tab
    window.open(`http://localhost:3000/room/${videoRoomId}`)

    // instead of window.location.href = 'https://crypto-calls.herokuapp.com/room/';
  })
}

// a function to get videoRoomId from Moralis DB 'VideoRooms' table
async function getVideoRoomIds() {
  const VideoRooms = await Moralis.Object.extend('VideoRooms')
  const query = new Moralis.Query(VideoRooms)
  const results = await query.find()
  return results
}

async function displayPaidVideoRooms() {
  let paidVideos = await getVideoRoomIds()
  let videoCreator = paidVideos[0].get('creatorAddress')

  // put user to lowercase
  let userAddress = user.toLowerCase()

  for (let i = 0; i < paidVideos.length; i++) {
    let callTitle = paidVideos[i].get('callGroupTitle')
    let videoRoomId = paidVideos[i].get('videoRoomId')
    let nextCallDate = paidVideos[i].get('nextCallDate')
    let listItem = document.createElement('li')

    let button = `<button class="btn btn-primary btn-lg" id="joinVideoRmBtn${videoRoomId}" onclick="checkPassword('${videoRoomId}')">Join The Call</button>`

    let ownerSetNameButton = `<button class="btn btn-success btn-lg" id="setNameBtn${videoRoomId}" onclick="setName('${videoRoomId}')">Set Call Name</button>`

    let ownerSetPasswordButton = `<button class="btn btn-success btn-lg" id="setPasswordBtn${videoRoomId}" onclick="setPassword('${videoRoomId}')">Set Call Password</button>`

    let ownerSetCallDateButton = `<button class="btn btn-success btn-lg" id="setCallDateBtn${videoRoomId}" onclick="setNextCallDate('${videoRoomId}')">Set Call Date</button>`

    if (callTitle) {
      videoRoomId = callTitle
    } else {
      videoRoomId = paidVideos[i].get('videoRoomId')
    }

    if (!nextCallDate) {
      nextCallDate = ''
    }

    if (videoCreator == userAddress) {
      listItem.innerHTML = `<div id='videoCallListItem${videoRoomId}' class='container'><b>${videoRoomId}</b> Next Call Date: ${nextCallDate}<br> ${button} <br> ${ownerSetNameButton} ${ownerSetPasswordButton} ${ownerSetCallDateButton}</div>`
    } else {
      listItem.innerHTML = listItem.innerHTML = `<div id='videoCallListItem${videoRoomId}' class='container'><b>${videoRoomId}</b> Next Call Date: ${nextCallDate}<br>${button}</div>`
    }

    $('#videoRoomsList').append(listItem)
  }
}

async function setName(videoRoomId) {
  console.log('setName clicked')
  const query = new Moralis.Query('VideoRooms')
  query.equalTo('videoRoomId', videoRoomId)
  const results = await query.find()
  console.log('results', results)

  const videoRoom = results[0]
  console.log('videoRoom', videoRoom)

  const videoRoomIdString = videoRoom.get('videoRoomId')
  console.log('videoRoomIdString', videoRoomIdString)

  const callTitle = prompt('Enter a title for your call')

  if (callTitle === null) {
    return
  } else {
    videoRoom.set('callGroupTitle', callTitle)
    videoRoom.save()
  }
}

// function to set videoRoomId password and save in Moralis DB
async function setPassword(videoRoomId) {
  console.log('setPassword clicked')
  const query = new Moralis.Query('VideoRooms')
  query.equalTo('videoRoomId', videoRoomId)
  const results = await query.find()
  console.log('results', results)

  const videoRoom = results[0]
  console.log('videoRoom', videoRoom)

  const videoRoomIdString = videoRoom.get('videoRoomId')
  console.log('videoRoomIdString', videoRoomIdString)

  const password = prompt('Enter a password for your call')

  if (password === null) {
    return
  } else {
    videoRoom.set('password', password)
    videoRoom.save()
  }
}

// function to check for password
async function checkPassword(videoRoomId) {
  const query = new Moralis.Query('VideoRooms')
  query.equalTo('videoRoomId', videoRoomId)
  const results = await query.find()

  const videoRoom = results[0]

  // if there is a password, prompt user to enter password
  if (videoRoom.get('password')) {
    const password = prompt('Enter password')
    if (password === null) {
      return
    } else {
      if (password === videoRoom.get('password')) {
        window.open(`http://localhost:3000/room/${videoRoomId}`)
      } else {
        alert('Incorrect password')
      }
    }

    // if there is no password, open video room
  } else {
    window.open(`http://localhost:3000/room/${videoRoomId}`)
  }
}

// function to set date of the next call and save in Moralis DB
async function setNextCallDate(videoRoomId) {
  const query = new Moralis.Query('VideoRooms')
  query.equalTo('videoRoomId', videoRoomId)
  const results = await query.find()

  const videoRoom = results[0]

  // for the prompt, ensure that the user enters a date in the format YYYY-MM-DD
  const nextCallDate = prompt(
    'Enter the date of the next call in the format YYYY-MM-DD',
  )

  // create date object
  const date = new Date(nextCallDate)
  // convert date object to ISO string
  const dateISO = date.toISOString()
  console.log(dateISO)

  if (nextCallDate === null) {
    return
  } else {
    videoRoom.set('nextCallDate', nextCallDate)
    videoRoom.save()
  }
}

displayPaidVideoRooms()
