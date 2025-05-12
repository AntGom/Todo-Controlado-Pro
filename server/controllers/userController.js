const User = require('../models/User');

// Obtener perfil usuario actual
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil'
    });
  }
};

// Actualizar perfil usuario actual
exports.updateProfile = async (req, res) => {
  try {
    // Eliminar campos sensibles=>no poder modificar
    delete req.body.role;
    delete req.body.resetPasswordToken;
    delete req.body.resetPasswordExpire;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Si nueva contraseña, actualizarla
    if (req.body.password) {
      user.password = req.body.password;
      delete req.body.password;
    }
    
    // Actualizar otros campos
    Object.keys(req.body).forEach(key => {
      user[key] = req.body[key];
    });
    
    await user.save();
    
    const updatedUser = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el perfil'
    });
  }
};

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios'
    });
  }
};

// Obtener un usuario
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario'
    });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    // Eliminar campos sensibles=>no poder modificar
    delete req.body.password;
    delete req.body.resetPasswordToken;
    delete req.body.resetPasswordExpire;

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el usuario'
    });
  }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario'
    });
  }
};