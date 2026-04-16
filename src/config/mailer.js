const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify().then(() => {
  console.log('📧 Motor de correos listo para enviar mensajes');
}).catch(error => {
  console.error('🚨 Error configurando el motor de correos:', error);
});

module.exports = transporter;