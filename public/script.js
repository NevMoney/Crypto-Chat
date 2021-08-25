const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  host: '/',
  secure: true,
  port: '443',
})

// to run peer: peerjs --port 443

let myVideoStream

const myVideo = document.createElement('video')
myVideo.muted = true

const peers = {}

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream
    addVideoStream(myVideo, stream)
    $('#pageTitle').append(`${ROOM_ID}`)
    myPeer.on('call', (call) => {
      call.answer(stream)
      const video = document.createElement('video')
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream)
      })
    })
    // when user connects, listen that user has connected, get the ID and then connect to that user
    socket.on('user-connected', (userId) => {
      console.log('user connected', userId)
      connectToNewUser(userId, stream)
    })
    // input value
    let text = $('input')
    // when press enter send message
    $('html').keydown(function (e) {
      if (e.which == 13 && text.val().length !== 0) {
        socket.emit('message', text.val())
        text.val('')
      }
    })
    socket.on('createMessage', (message) => {
      $('ul').append(`<li class="message"><b>user</b><br/>${message}</li>`)
      scrollToBottom()
    })
  })

socket.on('user-disconnected', (userId) => {
  if (peers[userId]) peers[userId].close()
})

// as soon as we connect using myPeer server and get id, run this code:
myPeer.on('open', (id) => {
  // this sends an event to the server and we pass the userId
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

const scrollToBottom = () => {
  var d = $('.main__chat_window')
  d.scrollTop(d.prop('scrollHeight'))
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false
    setUnmuteButton()
  } else {
    setMuteButton()
    myVideoStream.getAudioTracks()[0].enabled = true
  }
}

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true
  }
}

$('.main__right').hide()
$('.main__left').css('width', '100%')

// function to show and hide chat window
const showHideChat = () => {
  $('.main__right').toggle()
}

const showParticipants = (userId) => {
  console.log('clicking')
  let participants = []
  //   here is where we would have to get the users from the database
  // then push them into the array
  participants.push(`${userId}`)
  participants.forEach((participant) => {
    console.log(participant)
    // $('.participant__list').append(
    //   `<div class="main__left_user">${participant}</div>`,
    // )
  })
}

const exitMeeting = () => {
  // this function closes the peer connection, socket connection, and video stream and redirects to the home page
  myPeer.destroy()
  socket.emit('exit-room', ROOM_ID)
  socket.disconnect()
  myVideoStream.getTracks().forEach((track) => {
    track.stop()
  })
  window.location.href = '/'
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html
}

// when URL changes to specific chatRoom id, run this code
const roomId = window.location.href.split('/')[3]
console.log(roomId)
if (roomId) {
  socket.emit('join-room', ROOM_ID)
}
