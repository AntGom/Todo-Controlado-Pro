const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  uploadTaskPhoto,
  deleteTaskPhoto
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas para tareas
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Rutas para fotos
router.route('/:id/photos')
  .post(upload.single('photo'), uploadTaskPhoto);

router.route('/:taskId/photos/:photoId')
  .delete(deleteTaskPhoto);

module.exports = router;