const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'https://todo-controlado-pro.vercel.app/'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como desde curl o Postman) y las de origen permitido
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
