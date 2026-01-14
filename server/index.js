const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

// In-memory data store
global.users = [];
global.documents = [];

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoute = require('./routes/auth');
const docRoute = require('./routes/document');

// Route Middlewares
app.use('/api/user', authRoute);
app.use('/api/documents', docRoute);

app.get('/', (req, res) => {
  res.json({
    message: 'Real-time Collaboration API (In-Memory Mode)',
    endpoints: {
      auth: {
        register: 'POST /api/user/register',
        login: 'POST /api/user/login'
      },
      documents: {
        list: 'GET /api/documents',
        create: 'POST /api/documents',
        getOne: 'GET /api/documents/:id',
        update: 'PUT /api/documents/:id'
      },
      socket: 'ws://localhost:5000'
    }
  });
});

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for prototype
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`Socket ${socket.id} joined document ${documentId}`);
  });

  socket.on('send-changes', (data) => {
    // data: { documentId, delta }
    socket.to(data.documentId).emit('receive-changes', data.delta);
  });
  
  socket.on('save-document', (data) => {
      // Find document in memory implementation
      const docIndex = global.documents.findIndex(d => d._id === data.documentId);
      if (docIndex !== -1) {
          global.documents[docIndex].content = data.content;
      }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));
