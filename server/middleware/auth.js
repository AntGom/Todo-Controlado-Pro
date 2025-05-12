const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware para proteger rutas
exports.protect = async (req, res, next) => {
  let token;

  // Existe cookie de token?
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Si no hay, verificar header de auth
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Verificar si token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No autorizado para acceder a esta ruta",
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Añadir usuario a la petición
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "No autorizado para acceder a esta ruta",
    });
  }
};

// Middleware para roles específicos
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No autorizado para acceder a esta ruta",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `El rol ${req.user.role} no está autorizado para acceder a esta ruta`,
      });
    }

    next();
  };
};
