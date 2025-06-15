const User = require("../models/User");
const crypto = require("crypto");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../config/mailer");

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log("Registro fallido: el email ya está registrado");
      return res.status(400).json({
        success: false,
        message: "El email ya está registrado",
      });
    }

    const user = await User.create({ name, email, password });

    sendWelcomeEmail(user);
    console.log(`Usuario registrado correctamente: ${user.email}`);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Error en register:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Inicio de sesión fallido: faltan credenciales");
      return res.status(400).json({
        success: false,
        message: "Por favor, proporciona email y contraseña",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("Inicio de sesión fallido: usuario no encontrado");
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("Inicio de sesión fallido: contraseña incorrecta");
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    console.log(`Usuario logueado correctamente: ${user.email}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

// Perfil
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    console.log(`Datos del usuario obtenidos: ${user.email}`);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  console.log("Usuario desconectado");
  res.status(200).json({
    success: true,
    data: {},
  });
};

// Forgotpassword
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      console.log("Recuperación fallida: no hay usuario con ese email");
      return res.status(404).json({
        success: false,
        message: "No hay usuario con ese email",
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Envio el token, no la URL completa
    const emailSent = await sendPasswordResetEmail(user, resetToken);

    if (!emailSent) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.log("Error al enviar el email de recuperación");
      return res.status(500).json({
        success: false,
        message: "No se pudo enviar el email",
      });
    }

    console.log(`Email de recuperación enviado a: ${user.email}`);
    res.status(200).json({
      success: true,
      data: "Email enviado",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

// Resetpassword/:resettoken
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      console.log("Token inválido o expirado");
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log(`Contraseña restablecida para el usuario: ${user.email}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

// Enviar respuesta con token
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' ? true : false,
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};

