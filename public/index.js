// connect to Moralis server
Moralis.initialize('S1k7puWaAqAsrVqoYeMLfI28hwLmLRtYyuoC3hNH')
Moralis.serverURL = 'https://khep691mo8hw.moralisweb3.com:2053/server'

//   once page loads, check if user is logged in and display appropriate button
$(document).ready(function () {
  // is user logged in
  let user = Moralis.User.current()
  if (!user) {
    $('#btn-login').show()
    $('#btn-logout').hide()
    $('.content').hide()
  } else {
    $('#btn-login').hide()
    $('#btn-logout').show()
    $('.content').show()
  }
})

// add from here down
async function login() {
  let user = Moralis.User.current()
  if (!user) {
    user = await Moralis.Web3.authenticate()
    $('.content').show()
    $('#btn-login').hide()
    $('#btn-logout').show()
  }
  console.log('logged in user:', user)
}

async function logOut() {
  await Moralis.User.logOut()
  console.log('logged out')
  $('.content').hide()
  $('#btn-login').show()
  $('#btn-logout').hide()
}

document.getElementById('btn-login').onclick = login
document.getElementById('btn-logout').onclick = logOut
