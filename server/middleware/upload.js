const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Asegurar que el directorio existe
const taskUploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(taskUploadDir)) {
  fs.mkdirSync(taskUploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // La carpeta donde se guardarán las imágenes
    cb(null, taskUploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre de archivo único (timestamp + nombre original)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `task-${req.params.id}-${uniqueSuffix}${extension}`);
  }
});

// Filtro para permitir solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  // Verificar el mimetype y la extensión
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  
  return cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, gif)'), false);
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB máx
  },
  fileFilter: fileFilter
});

module.exports = { upload };