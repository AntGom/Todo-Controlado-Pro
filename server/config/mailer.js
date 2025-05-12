const nodemailer = require('nodemailer');

// Crear transporter reutilizable con SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email de bienvenida
const sendWelcomeEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: "Bienvenido a TodoControlado",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">¡Bienvenido a TodoControlado!</h2>
          <p>Hola ${user.name},</p>
          <p>Gracias por registrarte en nuestra plataforma. Estamos emocionados de tenerte con nosotros.</p>
          <p>Ahora puedes comenzar a:</p>
          <ul>
            <li>Ver y gestionar tus tareas diarias</li>
            <li>Organizar tus eventos importantes</li>
            <li>Consultar el clima y las noticias</li>
            <li>Chatear con otros usuarios</li>
          </ul>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos,<br>El equipo de TodoControlado</p>
        </div>
      `,
    });
    console.log(`Email de bienvenida enviado a ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return false;
  }
};

// Email de restablecimiento de contraseña
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    // Obtener URL base del frontend
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://tu-dominio.com' 
      : 'http://localhost:5173';
    
    // URL que apunte a página de restablecer
    const resetURL = `${frontendUrl}/resetPassword.html?token=${resetToken}`;

    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: user.email,
      subject: "Restablecer contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Restablecer tu contraseña</h2>
          <p>Hola ${user.name},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <p>
            <a href="${resetURL}" style="background-color: #2c5282; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Restablecer contraseña
            </a>
          </p>
          <p>Este enlace expirará en 10 minutos.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá siendo la misma.</p>
          <p>Saludos,<br>El equipo de TodoControlado</p>
        </div>
      `,
    });
    console.log(`Email de restablecimiento enviado a ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error al enviar email de restablecimiento:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};