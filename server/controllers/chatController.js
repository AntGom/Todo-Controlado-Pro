const Message = require('../models/Message');

// Obtener mensajes
exports.getMessages = async (req, res) => {
  try {
    const room = req.query.room || 'general';
    const limit = parseInt(req.query.limit) || 50; 
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Mensajes no eliminados de la sala
    const messages = await Message.find({ room, deleted: false })
      .populate({
        path: 'user',
        select: 'name email role'
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Contar total de "netos"
    const total = await Message.countDocuments({ room, deleted: false });

    console.log(`Operación "Obtener mensajes" realizada por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      count: messages.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: messages
    });
  } catch (error) {
    console.error(`Error en operación "Obtener mensajes" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes'
    });
  }
};

// Crear un mensaje
exports.createMessage = async (req, res) => {
  try {
    req.body.user = req.user.id;

    // Deleted es false
    req.body.deleted = false;
    
    // Marcar como leído por receptor
    req.body.readBy = [req.user.id];

    const message = await Message.create(req.body);

    const populatedMessage = await Message.findById(message._id).populate({
      path: 'user',
      select: 'name email role'
    });

    console.log(`Mensaje creado por ${populatedMessage.user.name} (${req.user.name})`);

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error(`Error en operación "Crear mensaje" realizada por ${req.user.name}:`, error);
    res.status(400).json({
      success: false,
      message: 'Error al crear el mensaje'
    });
  }
};

// Soft-delete de mensaje
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }

    if (message.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar este mensaje'
      });
    }

    message.deleted = true;
    await message.save();

    console.log(`Mensaje eliminado lógicamente por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      message: 'Mensaje eliminado lógicamente'
    });
  } catch (error) {
    console.error(`Error en operación "Eliminar mensaje" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el mensaje'
    });
  }
};

// Conteo de NO leídos agrupados por sala
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadMessages = await Message.aggregate([
      { 
        $match: { 
          $or: [
            { room: `private_${userId}_*` },
            { room: `private_*_${userId}` }
          ],
          readBy: { $nin: [userId] },
          deleted: false,
          user: { $ne: userId }
        } 
      },
      {
        $group: {
          _id: "$room",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convertir a un objeto más fácil de usar
    const unreadCounts = {};
    unreadMessages.forEach(item => {
      unreadCounts[item._id] = item.count;
    });

    console.log(`Conteo de mensajes no leídos obtenido por ${req.user.name}`);

    res.status(200).json({
      success: true,
      data: unreadCounts
    });
  } catch (error) {
    console.error(`Error al obtener conteo de mensajes no leídos para ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes no leídos'
    });
  }
};

// Marcar mensajes como leídos
exports.markAsRead = async (req, res) => {
  try {
    const { room } = req.body;
    
    if (!room) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere especificar una sala'
      });
    }
    
    // Actualizar todos los mensajes de la sala que no han sido leídos por el usuario
    const result = await Message.updateMany(
      { 
        room,
        readBy: { $nin: [req.user.id] },
        deleted: false
      },
      { 
        $addToSet: { readBy: req.user.id } // Añadir usuario a readBy
      }
    );

    console.log(`${result.modifiedCount} mensajes marcados como leídos por ${req.user.name} en sala ${room}`);

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        room
      }
    });
  } catch (error) {
    console.error(`Error al marcar mensajes como leídos para ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar mensajes como leídos'
    });
  }
};