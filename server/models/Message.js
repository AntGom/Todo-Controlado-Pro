const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'El mensaje no puede estar vacío'],
    trim: true,
    maxlength: [1000, 'El mensaje no puede tener más de 1000 caracteres']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: String,
    default: 'general'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índice para mejorar eficiencia al buscar mensajes/sala
MessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);