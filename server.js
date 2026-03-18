require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('./src/config/db');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const centroRoutes = require('./src/routes/centroRoutes');
const profesionalRoutes = require('./src/routes/profesionalRoutes');
const ofertaRoutes = require('./src/routes/ofertaRoutes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/centros', centroRoutes);
app.use('/api/profesionales', profesionalRoutes);
app.use('/api/ofertas', ofertaRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: '¡Servidor de Gestión Médica funcionando al 100%! 🏥' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});