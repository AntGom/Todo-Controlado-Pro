# ¡TODO CONTROLADO!

Una aplicación full-stack para la gestión de tareas, eventos, calendario y comunicación en tiempo real.

## 📝 Descripción

¡TODO CONTROLADO! es una aplicación web completa que permite a los usuarios gestionar sus tareas diarias, programar eventos, consultar el calendario, chatear con otros usuarios y mantenerse informados con noticias y datos del clima.

## 🚀 Funcionalidades

- **Gestión de tareas**: Crear, editar, eliminar y filtrar tareas con diferentes estados (pendiente, en progreso, completada)
- **Gestión de eventos**: Programar eventos con fecha, hora y ubicación
- **Calendario**: Visualiza tus tareas y eventos para tener una perspectiva clara de tu agenda
- **Chat en tiempo real**: Comunicación con otros usuarios a través de una sala general o chats privados
- **Información meteorológica***: Consulta del clima de cualquier ciudad
- **Noticias**:  Mantente informado con noticias de diferentes fuentes (El País, El Mundo, Fórmula 1, MotoGP)
- **Autenticación**: Sistema completo con registro, inicio de sesión y recuperación de contraseña
- **Perfiles de Usuario**: Gestión de información personal y contraseñas

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5: Estructura semántica con etiquetas modernas
- CSS3: Sistema de estilos personalizado con variables CSS
- JavaScript (ES6+): Programación modular orientada a objetos
- Socket.io para comunicación en tiempo real
- Font Awesome para iconografía
- Comunicación con APIs: Consumo de servicios externos (clima y noticias)
- CSS modular y diseño responsive

### Backend
- Node.js y Express
- MongoDB con Mongoose
- Socket.io para WebSockets
- JWT para autenticación
- Multer para carga de archivos
- Nodemailer para envío de correos
- bcrypt para encriptación de contraseñas

## 🏗️ Estructura del Proyecto

```
/
├── client/               # Frontend de la aplicación
│   ├── css/              # Estilos modulares
│   ├── img/              # Imágenes y recursos
│   ├── js/               # Código JavaScript
│   │   ├── api/          # Comunicación con API
│   │   ├── auth/         # Autenticación
│   │   ├── features/     # Funcionalidades principales
│   │   ├── pages/        # Controladores de páginas
│   │   ├── services/     # Servicios externos
│   │   └── utils/        # Utilidades
│   └── *.html            # Páginas HTML
│
├── server/               # Backend de la aplicación
│   ├── config/           # Configuración
│   ├── controllers/      # Controladores
│   ├── middleware/       # Middleware
│   ├── models/           # Modelos de datos
│   └── routes/           # Rutas API
│
├── uploads/              # Archivos subidos por los usuarios
└── .env                  # Variables de entorno
```

## 💾 Modelos de Datos

- **User**: Usuarios de la aplicación con roles y autenticación
- **Task**: Tareas con título, descripción, fecha límite, estado y fotos
- **Event**: Eventos con título, detalles, fecha y ubicación
- **Message**: Mensajes para el sistema de chat con sala, lectura y soft-delete

## 🔁 Flujo de Datos

El flujo de datos en la aplicación sigue un patrón claro:

1. **Cliente a Servidor**: 
   - El cliente hace peticiones HTTP a la API REST del servidor
   - Para datos en tiempo real, se utiliza Socket.io para comunicación bidireccional

2. **Servidor a Base de Datos**:
   - Los controladores procesan las peticiones y se comunican con la base de datos MongoDB
   - Los modelos de Mongoose definen la estructura y validación de los datos

3. **Sistema de Caché**:
   - Las respuestas se almacenan en caché en el cliente para reducir peticiones
   - La caché se invalida cuando hay cambios relevantes en los datos

4. **Flujo de Autenticación**:
   - Las credenciales se envían al servidor
   - El servidor verifica y genera un token JWT
   - El token se almacena en una cookie HTTP-only
   - Las peticiones subsiguientes incluyen la cookie para autenticación

5. **Flujo de Mensajes en Tiempo Real**:
   - Los mensajes se envían mediante WebSockets al servidor
   - El servidor persiste los mensajes en la base de datos
   - El servidor notifica a los clientes correspondientes
   - Los clientes actualizan su interfaz con los nuevos mensajes

## 🔐 Autenticación y Seguridad

- Tokens JWT almacenados en cookies HTTP-only
- Encriptación de contraseñas con bcrypt
- Middleware de autenticación para proteger rutas
- Sistema de roles (usuario/admin)
- Protección CORS y políticas de seguridad
- Sanitización de entradas con express-validator y mongo-sanitize
- Configuraciones de seguridad con Helmet

## 👥 Roles de Usuario

La aplicación implementa dos roles principales con diferentes niveles de acceso:

### 1. Usuario Estándar (role: 'user')
- Puede gestionar solo sus propias tareas y eventos
- Puede participar en chats y enviar mensajes
- Puede modificar su propio perfil
- No puede ver tareas o eventos de otros usuarios
- Puede eliminar solo sus propios mensajes en el chat

### 2. Administrador (role: 'admin')
- Tiene acceso completo a todas las tareas y eventos de todos los usuarios
- Puede moderar el chat (eliminar cualquier mensaje)
- Tiene acceso a funciones de administración avanzadas
- Recibe una identificación visual especial en la interfaz (etiqueta de "ADMIN")
- Puede gestionar usuarios (en la versión actual solo a través de API)

La distinción de roles se implementa tanto en el backend (middleware de autorización) como en el frontend (UI condicional).

## 📢 Comunicación en Tiempo Real

La comunicación en tiempo real se implementa mediante Socket.io, permitiendo:

- Actualizaciones instantáneas en el chat
- Notificación de usuarios conectados/desconectados
- Chats privados entre usuarios
- Sistema de mensajes no leídos
- Soft-delete de mensajes

## 📸 Sistema de Archivos

Se utiliza Multer para gestionar la subida de archivos:

- Configuración de almacenamiento en disco
- Filtrado por tipo de archivo (solo imágenes)
- Límites de tamaño (1MB)
- Nombres de archivo únicos con timestamp
- Asociación de fotos a tareas específicas

## 📱 Diseño Responsive

La aplicación está diseñada para funcionar en dispositivos de diferentes tamaños:

- Layout flexible usando Flexbox
- Media queries para adaptarse a diferentes tamaños de pantalla
- Optimización de la interfaz para móviles, tablets y escritorio

## 🎨 Sistema de Iconografía

Para proporcionar una experiencia visual detallada y coherente, se utiliza Font Awesome como sistema de iconografía:

- Amplia biblioteca de iconos para diferentes contextos
- Fácil implementación y personalización mediante clases CSS
- Iconos vectoriales escalables sin pérdida de calidad
- Categorización visual de elementos (tareas, eventos, alertas, acciones)
- Mejora la usabilidad proporcionando pistas visuales

## ⚙️ Decisiones Técnicas

### Arquitectura Cliente-Servidor
Se optó por separar completamente el frontend y backend para permitir escalabilidad y mejor mantenimiento. El cliente se comunica con el servidor mediante una API RESTful.

### Módulo de Cacheo
Se implementó un sistema de caché en el cliente para reducir peticiones al servidor y mejorar la experiencia del usuario, especialmente en conexiones lentas.

### Soft-Delete para Mensajes
Los mensajes no se eliminan físicamente de la base de datos, sino que se marcan como eliminados, permitiendo auditoría y recuperación si fuera necesario.

### Uso de Mongoose
Mongoose proporciona validación, casting y lógica de negocio para MongoDB, facilitando el desarrollo y mantenimiento.

### WebSockets con Socket.io
Se eligió Socket.io por su robustez en conexiones inestables y sus características avanzadas como rooms, namespaces y reconexión automática.

### Sistema de Autenticación
JWT en cookies HTTP-only ofrece un balance óptimo entre seguridad y experiencia de usuario, evitando problemas de XSS y simplificando la autenticación en WebSockets.

### Multer para Archivos
Multer ofrece un control granular sobre la subida de archivos, permitiendo validación, limitación y transformación de los mismos antes de guardarlos.

## 🔧 Instalación y Configuración

1. Clonar el repositorio
2. Crear archivo `.env` con las variables necesarias (ver `.env.example`)
3. Instalar dependencias:
   ```
   npm install
   ```
4. Iniciar el servidor:
   ```
   npm run dev
   ```

## 📋 Variables de Entorno Requeridas

```
# Servidor
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Email
EMAIL_HOST=smtp.ejemplo.com
EMAIL_PORT=587
EMAIL_USER=tu_email
EMAIL_PASS=tu_password
FROM_NAME=TodoControlado
FROM_EMAIL=noreply@example.com

# Frontend
FRONTEND_URL=http://localhost:5173
```
## 🌐 APIs utilizadas

- **Clima**: API de wttr.in para obtener información meteorológica en formato compacto
- **Noticias**: APIs RSS de El País, El Mundo, y contenido deportivo de Marca (convertidas a JSON mediante api.rss2json.com)

## 🔗 Enlaces útiles

- [Servicio wttr.in](https://github.com/chubin/wttr.in)
- [Font Awesome](https://fontawesome.com/)


## 👤 Autor

Desarrollado por Antonio Gómez © 2025. Desde Andalucía, con ❤.