const Message = require("../models/Message");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verificar token desde cookies
const verifyToken = async (token) => {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error("Error verificando token:", err);
    return null;
  }
};

// Calcular mensajes no leídos para un usuario
async function calculateUnreadCounts(userId) {
  return await Message.aggregate([
    {
      $match: {
        $or: [
          { room: new RegExp(`private_${userId}_`) },
          { room: new RegExp(`private_.*_${userId}`) },
        ],
        readBy: { $nin: [userId] },
        deleted: false,
        user: { $ne: userId },
      },
    },
    {
      $group: {
        _id: "$room",
        count: { $sum: 1 },
      },
    },
  ]);
}

module.exports = (io) => {
  console.log("⚡ Configurando servidor Socket.io");

  // Map con usuarios conectados y sus socketIds
  const connectedUsers = new Map();

  io.on("connection", async (socket) => {
    console.log("🔌 Nuevo cliente conectado:", socket.id);

    // Autenticar usuario a través de cookie-JWT
    const cookies = socket.handshake.headers.cookie;
    let user = null;

    if (cookies) {
      try {
        const tokenCookie = cookies
          .split(";")
          .find((c) => c.trim().startsWith("token="));
        if (tokenCookie) {
          const token = tokenCookie.split("=")[1];
          const decoded = await verifyToken(token);

          if (decoded && decoded.id) {
            user = await User.findById(decoded.id).select("-password");
            if (user) {
              console.log(
                `👤 Usuario autenticado: ${user.name} (${user.email})`
              );
              socket.user = user;
              const userId = user._id.toString();

              // Añadir o actualizar entradas
              const existing = connectedUsers.get(userId);
              if (existing) {
                existing.socketIds.push(socket.id);
              } else {
                connectedUsers.set(userId, {
                  userId,
                  username: user.name,
                  isAdmin: user.role === "admin",
                  socketIds: [socket.id],
                });
              }

              // Emitir lista actualizada usuarios online
              io.emit("user_connected", {
                userId,
                username: user.name,
                isAdmin: user.role === "admin",
                onlineUsers: Array.from(connectedUsers.values()).map((u) => ({
                  userId: u.userId,
                  username: u.username,
                  isAdmin: u.isAdmin,
                })),
              });

              // Conteo inicial de mensajes NO leídos de usuario
              const unreadCounts = await calculateUnreadCounts(user._id);
              const unreadMap = unreadCounts.reduce((acc, { _id, count }) => {
                acc[_id] = count;
                return acc;
              }, {});

              socket.emit("initial_unread_counts", unreadMap);
            }
          }
        }
      } catch (error) {
        console.error("Error al autenticar usuario por socket:", error);
      }
    }

    if (!user) {
      console.log("⚠️ Cliente no autenticado. Desconectando...");
      socket.emit("error", { message: "No autorizado" });
      socket.disconnect();
      return;
    }

    // Marcar mensajes como leídos
    socket.on("mark_as_read", async (data) => {
      // Cambio el parámetro de 'room' a 'data'
      try {
        if (!socket.user) {
          socket.emit("error", { message: "No autorizado" });
          return;
        }

        // Extrae el string de la sala desde el objeto data
        const room = data.room;

        if (!room) {
          socket.emit("error", { message: "Se requiere especificar una sala" });
          return;
        }

        // Actualizar en BBDD
        const result = await Message.updateMany(
          {
            room: room,
            readBy: { $nin: [socket.user._id] },
            deleted: false,
          },
          {
            $addToSet: { readBy: socket.user._id },
          }
        );

        // Notificar NO leidos
        if (room.startsWith("private_")) {
          // Sala privada: notificar solo a usuario receptor
          const userIds = room.replace("private_", "").split("_");

          userIds.forEach((userId) => {
            const userSockets = connectedUsers.get(userId);
            if (userSockets) {
              userSockets.socketIds.forEach((socketId) => {
                io.to(socketId).emit("messages_marked_as_read", {
                  room,
                  markedBy: socket.user._id.toString(),
                  modifiedCount: result.modifiedCount,
                });
              });
            }
          });
        } else {
          // Sala pública: notificar a todos
          io.emit("messages_marked_as_read", {
            room,
            markedBy: socket.user._id.toString(),
            modifiedCount: result.modifiedCount,
          });
        }
      } catch (error) {
        console.error("Error al marcar mensajes como leídos:", error);
        socket.emit("error", {
          message: "Error al marcar mensajes como leídos",
        });
      }
    });

    // Evento para solicitar actualización de no leídos
    socket.on("request_unread_updates", async () => {
      if (socket.user) {
        const unreadCounts = await calculateUnreadCounts(socket.user._id);
        const unreadMap = unreadCounts.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {});

        socket.emit("update_unread_counts", unreadMap);
      }
    });

    // Manejar mensajes entrantes
    socket.on("send_message", async (messageData) => {
      try {
        if (!socket.user) {
          socket.emit("error", { message: "No autorizado" });
          return;
        }

        const messageText = messageData.text;
        const room = messageData.room || "general";

        console.log(
          `📨 Mensaje de ${
            socket.user.name
          } en sala "${room}": ${messageText.substring(0, 20)}${
            messageText.length > 20 ? "..." : ""
          }`
        );

        // Crear nuevo mensaje en la base de datos
        const newMessage = await Message.create({
          user: socket.user._id,
          text: messageText,
          room: room,
          readBy: [socket.user._id],
          deleted: false,
        });

        const populatedMessage = await Message.findById(
          newMessage._id
        ).populate({
          path: "user",
          select: "name email role",
        });

        // Enviar mensaje a los destinatarios
        if (room.startsWith("private_")) {
          const userIds = room.replace("private_", "").split("_");
          const socketIds = [];

          userIds.forEach((userId) => {
            const userSockets = connectedUsers.get(userId);
            if (userSockets && userSockets.socketIds.length > 0) {
              socketIds.push(...userSockets.socketIds);
            }
          });

          // Enviar solo a sockets de usuarios involucrados
          socketIds.forEach((socketId) => {
            io.to(socketId).emit("new_message", populatedMessage);
          });
        } else {
          // Enviar a todos en salas públicas
          io.emit("new_message", populatedMessage);
        }
      } catch (error) {
        console.error("Error al guardar mensaje:", error);
        socket.emit("error", { message: "Error al enviar mensaje" });
      }
    });

    // Manejar desconexión
    socket.on("disconnect", () => {
      const user = socket.user;
      if (!user) return console.log("Cliente anónimo desconectado");
    
      const userId = user._id.toString();
      const entry = connectedUsers.get(userId);
      if (!entry) return;
    
      entry.socketIds = entry.socketIds.filter((id) => id !== socket.id);
    
      if (entry.socketIds.length === 0) {
        connectedUsers.delete(userId);
        console.log(`👋 Usuario desconectado completamente: ${user.name}`);
    
        io.emit("user_disconnected", {
          userId,
          username: user.name,
          onlineUsers: Array.from(connectedUsers.values()).map((u) => ({
            userId: u.userId,
            username: u.username,
            isAdmin: u.isAdmin,
          })),
        });
      } else {
        connectedUsers.set(userId, entry);
        console.log(`🔌 Una pestaña de ${user.name} se desconectó pero sigue online`);
      }
    });
    
    // Manejar errores
    socket.on("error", (error) => {
      console.error("Error de socket:", error);
    });
  });

  io.engine.on("connection_error", (err) => {
    console.log("🔴 Error de conexión en Socket.io:", err);
  });
};
