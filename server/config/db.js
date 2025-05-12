const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {

    });

    console.log(`"🟢 Conectado a MongoDB Atlas"`);
  } catch (error) {
    console.error("🔴 Error al conectar con MongoDB Atlas:", error);
    process.exit(1);
  }
};

module.exports = connectDB;