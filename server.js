
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let ROOM_DB = {};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/api/history/:room', (req, res) => {
  res.json(ROOM_DB[req.params.room] || []);
});
app.get('/health', (req, res) => res.json({status:'ok', rooms:Object.keys(ROOM_DB).length}));

io.on('connection', (socket) => {
  socket.on('join_room', (room) => { 
    socket.join(room); 
    socket.emit('room_history', ROOM_DB[room] || []);
  });
  socket.on('send_encrypted_sms', (data) => {
    if (!ROOM_DB[data.room]) ROOM_DB[data.room] = [];
    ROOM_DB[data.room].push({ ...data, timestamp: Date.now() });
    if (ROOM_DB[data.room].length > 200) ROOM_DB[data.room] = ROOM_DB[data.room].slice(-200);
    io.to(data.room).emit('new_encrypted_sms', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running on ${PORT}`));
module.exports = app;
