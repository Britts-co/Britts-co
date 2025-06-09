require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de multer para archivos
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Función para generar código
function generarCodigoRequerimiento() {
  const prefijo = "BRT";
  const fecha = new Date();
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0'); 
  const anio = String(fecha.getFullYear()).slice(-2);

  const fechaStr = `${dia}${mes}${anio}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = "";
  for (let i = 0; i < 3; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefijo}${fechaStr}${codigo}`;
}

// Ruta para procesar el formulario
app.post('/api/formulario', upload.single('archivo'), async (req, res) => {
  const {
    email,
    asunto,
    tipo,
    solucion,
    programa,
    version,
    detalle,
    contacto,
    prioridad,
    fecha,
    captcha
  } = req.body;

  const file = req.file;
  const codigoReq = generarCodigoRequerimiento();

  // Crear transportador
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // usar STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Contenido del mensaje
  const mailOptions = {
    from: `"Formulario Web" <${process.env.SMTP_FROM}>`,
    to: process.env.SMTP_TO,
    subject: `Nuevo requerimiento: ${asunto} (Código: ${codigoReq})`,
    html: `
      <h2>Nuevo requerimiento recibido</h2>
      <p><strong>Código:</strong> ${codigoReq}</p>
      <p><strong>Correo:</strong> ${email}</p>
      <p><strong>Asunto:</strong> ${asunto}</p>
      <p><strong>Tipo:</strong> ${tipo}</p>
      <p><strong>Solución:</strong> ${solucion}</p>
      <p><strong>Programa:</strong> ${programa}</p>
      <p><strong>Versión:</strong> ${version}</p>
      <p><strong>Detalle:</strong><br>${detalle}</p>
      <p><strong>Contacto:</strong> ${contacto}</p>
      <p><strong>Prioridad:</strong> ${prioridad}</p>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <p><strong>Captcha marcado:</strong> ${captcha ? 'Sí' : 'No'}</p>
    `,
    attachments: file
      ? [
          {
            filename: file.originalname,
            path: file.path
          }
        ]
      : []
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Correo enviado correctamente.', codigo: codigoReq });
  } catch (err) {
    console.error('Error al enviar correo:', err);
    res.status(500).json({ message: 'Error al enviar el correo.' });
  }
});

// Servir archivos estáticos (opcional)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

