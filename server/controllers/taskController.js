const mongoose = require('mongoose');
const Task = require('../models/Task');
const fs = require('fs');
const path = require('path');

// Verificar si user es owner o admin
const isOwnerOrAdmin = (task, user) => {
  return task.user.toString() === user.id || user.role === 'admin';
};

// Obtener todas las tareas
exports.getTasks = async (req, res) => {
  try {
    let query = req.user.role === 'admin'
      ? Task.find()
      : Task.find({ user: req.user.id });

    if (req.query.status && req.query.status !== 'all') {
      query = query.find({ status: req.query.status });
    }

    query = query.sort({ dueDate: 1 }).populate('user', 'name');

    const tasks = await query;

    console.log(`Operación "Obtener tareas" realizada por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error(`Error en operación "Obtener tareas" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las tareas'
    });
  }
};

// Obtener tarea por ID
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('user', 'name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    if (task.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a esta tarea'
      });
    }

    console.log(`Operación "Obtener tarea por ID" realizada por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(`Error en operación "Obtener tarea por ID" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la tarea'
    });
  }
};

// Crear tarea
exports.createTask = async (req, res) => {
  try {
    req.body.user = req.user.id;

    const task = await Task.create(req.body);
    const populatedTask = await Task.findById(task._id).populate('user', 'name');

    console.log(`Tarea creada por ${populatedTask.user.name} (${req.user.name})`);

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error(`Error en operación "Crear tarea" realizada por ${req.user.name}:`, error);
    res.status(400).json({
      success: false,
      message: 'Error al crear la tarea'
    });
  }
};

// Actualizar tarea
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para actualizar esta tarea'
      });
    }

    req.body.updatedAt = Date.now();

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('user', 'name');

    console.log(`Tarea actualizada por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(`Error en operación "Actualizar tarea" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la tarea'
    });
  }
};

// Eliminar tarea
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar esta tarea'
      });
    }

    // Eliminar fotos asociadas a la tarea
    if (task.photos && task.photos.length > 0) {
      task.photos.forEach(photo => {
        const photoPath = path.join(__dirname, '../../', photo.path);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
          console.log(`Foto eliminada: ${photoPath}`);
        }
      });
    }

    await task.deleteOne();

    console.log(`Tarea eliminada por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(`Error en operación "Eliminar tarea" realizada por ${req.user.name}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la tarea'
    });
  }
};

// Subir foto a tarea
exports.uploadTaskPhoto = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para subir fotos a esta tarea'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, sube un archivo'
      });
    }

    // Crear objeto de foto
    const photo = {
      filename: req.file.filename,
      path: `uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    // Añadir foto a la tarea
    task.photos.push(photo);
    await task.save();

    console.log(`Foto subida a tarea por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      data: photo,
      message: 'Foto subida correctamente'
    });
  } catch (error) {
    console.error(`Error al subir foto: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al subir la foto'
    });
  }
};

// Eliminar foto de tarea
exports.deleteTaskPhoto = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para eliminar fotos de esta tarea'
      });
    }

    // Buscar foto por ID
    const photoId = req.params.photoId;
    const photoIndex = task.photos.findIndex(photo => photo._id.toString() === photoId);

    if (photoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Foto no encontrada'
      });
    }

    // Eliminar archivo físico
    const photoToDelete = task.photos[photoIndex];
    const photoPath = path.join(__dirname, '../../', photoToDelete.path);
    
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }

    // Eliminar referencia de la base de datos
    task.photos.splice(photoIndex, 1);
    await task.save();

    console.log(`Foto eliminada de tarea por ${req.user.name} (${req.user.role})`);

    res.status(200).json({
      success: true,
      message: 'Foto eliminada correctamente'
    });
  } catch (error) {
    console.error(`Error al eliminar foto: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la foto'
    });
  }
};