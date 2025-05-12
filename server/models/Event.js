const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, añade un título al evento'],
    trim: true,
    maxlength: [100, 'El título no puede tener más de 100 caracteres']
  },
  details: {
    type: String,
    trim: true,
    maxlength: [500, 'Los detalles no pueden tener más de 500 caracteres']
  },
  date: {
    type: Date,
    required: [true, 'Por favor, añade una fecha al evento']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'La ubicación no puede tener más de 200 caracteres']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true 
});

// Índice para mejorar eficiencia al consultar eventos de un user
EventSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Event', EventSchema);
