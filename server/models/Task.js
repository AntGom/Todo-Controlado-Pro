const mongoose = require('mongoose');

// Esquema para fotos
const TaskPhotoSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, añade un título a la tarea'],
    trim: true,
    maxlength: [100, 'El título no puede tener más de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
  },
  dueDate: {
    type: Date,
    required: [true, 'Por favor, añade una fecha de vencimiento']
  },
  status: {
    type: String,
    enum: ['pending', 'inProgress', 'completed'],
    default: 'pending'
  },
  photos: [TaskPhotoSchema], // Array de fotos
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true 
});

// Índice para mejorar eficiencia al consultar tareas de un usuario
TaskSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model('Task', TaskSchema);