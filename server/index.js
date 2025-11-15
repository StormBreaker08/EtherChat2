const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("EtherChat signaling server is running");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, codename }) => {
    socket.join(roomId);
    socket.codename = codename;
    socket.roomId = roomId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    const roomUsers = Array.from(rooms.get(roomId))
      .map(id => {
        const s = io.sockets.sockets.get(id);
        return { id, codename: s?.codename || 'Anonymous' };
      });

    console.log(`[${roomId}] ${codename} joined. Total users: ${roomUsers.length}`);

    // Notify all users in room about the new user
    io.to(roomId).emit('user-joined', {
      userId: socket.id,
      codename,
      users: roomUsers
    });

    // Send room info to the new user
    socket.emit('room-users', roomUsers);
  });

  socket.on('initiate-call', ({ to, from, codename }) => {
    console.log(`[${socket.roomId}] Call initiated: ${codename} -> ${to}`);
    io.to(to).emit('call-incoming', { from, codename });
  });

  socket.on('signal', ({ to, signal, from }) => {
    io.to(to).emit('signal', { signal, from });
  });

  socket.on('text-message', ({ roomId, message, codename }) => {
    console.log(`[${roomId}] Message from ${codename}: ${message.substring(0, 50)}`);
    io.to(roomId).emit('text-message', {
      from: socket.id,
      codename,
      message,
      timestamp: Date.now()
    });
  });

  socket.on('call-accepted', ({ to, from }) => {
    io.to(to).emit('call-accepted', { from });
  });

  socket.on('call-rejected', ({ to, from }) => {
    io.to(to).emit('call-rejected', { from });
  });

  socket.on('end-call', ({ to }) => {
    if (to) {
      io.to(to).emit('call-ended');
    }
  });

  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] User disconnected: ${socket.id}`);
    
    if (socket.roomId && rooms.has(socket.roomId)) {
      rooms.get(socket.roomId).delete(socket.id);
      
      if (rooms.get(socket.roomId).size === 0) {
        rooms.delete(socket.roomId);
      } else {
        const roomUsers = Array.from(rooms.get(socket.roomId))
          .map(id => {
            const s = io.sockets.sockets.get(id);
            return { id, codename: s?.codename || 'Anonymous' };
          });

        io.to(socket.roomId).emit('user-left', {
          userId: socket.id,
          codename: socket.codename,
          users: roomUsers
        });
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🌐 EtherChat Signaling Server running on port ${PORT}`);
  console.log(`⚡ Ready to handle WebRTC signaling...\n`);
});