const { response } = require('express')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
  debug: true,
})

// to generate random roomId, using uuid
// this may need to live on the client side so that it can generate a link to then join the room

// const chatRoomId = uuidV4()

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.use('/peerjs', peerServer)

// on connection we go to the home page
app.get('/home', (req, res) => {
  // if you have a homepage for the application, you can use this:
  res.render('index')
  // to create a brand new room and redirect user there, we do this:
  //   res.redirect(`/room/${roomId}`)
})

// time to take roomID link from index.ejs and redirect to room.ejs when user clicks on room
app.get('/:room', (req, res) => {
  // you get room from :room (which comes from link)
  res.render('room', { roomId: req.params.room })
})

// need to open the room.ejs file and add the roomId to the roomId variable
// then add the roomId to the roomId variable in the room.ejs file
app.get('/room', (req, res) => {
  res.redirect(`/room/${uuidV4()}`)
})

// for the group chat, we already have id and name from Moralis DB
// i want to push the chatRoomId from front end/DB and render chatRoom.ejs
app.get('/chatRoom/:chatRoomId', (req, res) => {
  res.render('chatRoom.ejs', { chatRoomId: req.params.chatRoomId })
})

// now we need to redirect to the chatRoom.ejs file
app.get('/chatRoom', (req, res) => {
  res.redirect(`/chatRoom/${chatRoomId}`)
})

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
    })

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(process.env.PORT || 3030)
