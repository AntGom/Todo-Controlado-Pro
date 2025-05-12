const mongoose = require('mongoose');
const Event = require('../models/Event');

// Verificar si user es owner o admin
const isOwnerOrAdmin = (event, user) => {
  return event.user.toString() === user.id || user.role === 'admin';
};

// Obtener todos los eventos (propios o todos si es admin)
exports.getEvents = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user.id };

    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const events = await Event.find(filter).sort({ date: 1 });

    console.log(`Operación "Obtener eventos" realizada por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error(`Error en operación "Obtener eventos" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los eventos'
    });
  }
};

// Evento por ID
exports.getEvent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    if (!isOwnerOrAdmin(event, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a este evento'
      });
    }

    console.log(`Operación "Obtener evento por ID" realizada por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error(`Error en operación "Obtener evento por ID" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el evento'
    });
  }
};

// Crear nuevo evento
exports.createEvent = async (req, res) => {
  try {
    req.body.user = req.user.id;

    const event = await Event.create(req.body);

    const populatedEvent = await Event.findById(event._id).populate('user', 'name');

    console.log(`Evento creado por ${populatedEvent.user.name} (${req.user.name})`);

    res.status(201).json({
      success: true,
      data: populatedEvent
    });
  } catch (error) {
    console.error(`Error en operación "Crear evento" realizada por ${req.user.name}:`, error);
    res.status(400).json({
      success: false,
      message: 'Error al crear el evento'
    });
  }
};

// Actualizar evento
exports.updateEvent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    if (!isOwnerOrAdmin(event, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para actualizar este evento'
      });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    console.log(`Evento actualizado por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error(`Error en operación "Actualizar evento" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el evento'
    });
  }
};

// Eliminar evento
exports.deleteEvent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    if (!isOwnerOrAdmin(event, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar este evento'
      });
    }

    await event.deleteOne();

    console.log(`Evento eliminado por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(`Error en operación "Eliminar evento" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el evento'
    });
  }
};
