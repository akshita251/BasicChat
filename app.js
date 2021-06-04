  
// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs')
const server = require('https').createServer({
  key: fs.readFileSync('./certificates/server.key'),
  cert: fs.readFileSync('./certificates/server.cert')
},app)
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;
const AuthRoute = require('./routes/Auth.route')
const jwt = require('jsonwebtoken')

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

//Routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/auth', AuthRoute)

// Routing
app.use(express.static(path.join(__dirname, 'public')));
//error handling
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  })
})


// Chatroom
let numUsers = 0;

io.use(function(socket, next){
  if (socket.handshake.query && socket.handshake.query.token){
    // console.log(socket.handshake.query.token)
    jwt.verify(socket.handshake.query.token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
      console.log(decoded)
      if (err) return next(new Error('Authentication error'));
      socket.decoded = decoded;
      next();
    });
  }
  else {
    next(new Error('Authentication error'));
  }    
}).on('connection', (socket) => {
  let addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});