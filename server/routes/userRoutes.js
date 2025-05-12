const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas (solo autenticación)
router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/', getUsers);

// Rutas privadas (requieren ser admin)
router.use(authorize('admin'));

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;