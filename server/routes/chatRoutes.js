const express = require('express');
const {
  getMessages,
  createMessage,
  deleteMessage,
  getUnreadCount,
  markAsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas para mensajes
router.route('/')
  .get(getMessages)
  .post(createMessage);

router.route('/:id')
  .delete(deleteMessage);

// Rutas para mensajes NO leídos
router.get('/unread/count', getUnreadCount);
router.post('/read', markAsRead);

module.exports = router;