require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
  debug: true,
})
const port = process.env.PORT || 3000
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const storeItems = new Map([
  [
    1,
    {
      priceInCents: 1000,
      name: '1 Time Usage',
    },
  ],
  [
    2,
    {
      priceInCents: 5000,
      name: 'Monthly Plan',
    },
  ],
  [
    3,
    {
      priceInCents: 30000,
      name: 'Annual Plan',
    },
  ],
])

// to generate random roomId, using uuid
// chatRoomId may need to consider using Moralis DB fetching instead of uuid
const roomId = uuidV4()
const chatRoomId = uuidV4()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(cors())

app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: req.body.items.map((item) => {
        const storeItem = storeItems.get(item.id)
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: item.quantity,
        }
      }),
      success_url: `${process.env.CLIENT_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/index.html`,
    })
    res.json({ url: session.url })
    console.log('stripe session', session)
    $('#purchasedItems').append(
      `<li>Item: ${session.name}, Quantity: ${session.quantity}, Price per unit: ${session.unit_amount}</li>`,
    )
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.use('/peerjs', peerServer)

// on connection we go to the home page
app.get('/', (req, res) => {
  res.render('index')
})

// time to take roomID link from index.ejs and redirect to room.ejs when user clicks on room
app.get('/room/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

// need to open the room.ejs file and add the roomId to the roomId variable
// then add the roomId to the roomId variable in the room.ejs file
app.get('/room', (req, res) => {
  res.redirect(`/room/${roomId}`)
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

// socket.io communication for video calls and messages
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId)

    socket.on('message', (message, userId) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message, userId)
      console.log('message created', message, userId)
    })

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId)
    })
  })
})

server.listen(port)
console.log(`listening on port ${port}`)
