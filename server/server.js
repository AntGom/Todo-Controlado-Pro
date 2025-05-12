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
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
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
// Directorio para archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/chatRoutes'));

// Configuración WebSockets para chat
require('./config/socket')(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

// Errores no capturados
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});