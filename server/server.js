const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const corsMiddleware = require('./middleware/corsMiddleware.js');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const http = require('http');
const socketIo = require('socket.io');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const allowedOriginsSocket = [
  'https://todo-controlado-pro.vercel.app',
  'https://todo-controlado-pro-git-main-antonios-projects-99da8543.vercel.app',
  'https://todo-controlado-nio9tpp2j-antonios-projects-99da8543.vercel.app',
  'http://localhost:5173'
];

const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin || allowedOriginsSocket.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }
});

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(corsMiddleware);
app.use(mongoSanitize());

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../client')));

// Rutas API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/chatRoutes'));

// Configuración WebSocket para chat
require('./config/socket')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
