require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Guardamos la conexión en la variable 'pool' para que el robot y el buscador la usen
const pool = require('./src/config/db');

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

/// =================================================================
// 🔍 BUSCADOR GLOBAL INTELIGENTE (CORREGIDO)
// =================================================================
app.get('/api/buscar', async (req, res) => {
  try {
    const { q } = req.query; 
    if (!q || q.trim() === '') return res.json({ profesionales: [], turnos: [] });

    const terminoBusqueda = `%${q}%`; 

    // 1. Buscar Profesionales
    const profResult = await pool.query(`
      SELECT id, nombres, apellidos, rut, especialidad 
      FROM profesionales 
      WHERE nombres ILIKE $1 OR apellidos ILIKE $1 OR rut ILIKE $1 OR especialidad ILIKE $1
      LIMIT 4
    `, [terminoBusqueda]);

    // 2. Buscar en Turnos
    const turnosResult = await pool.query(`
      SELECT id, especialidad, fecha, horario, tipo_servicio 
      FROM turnos 
      WHERE especialidad ILIKE $1 OR tipo_servicio ILIKE $1
      LIMIT 4
    `, [terminoBusqueda]);

    res.json({
      profesionales: profResult.rows,
      turnos: turnosResult.rows
    });

  } catch (error) {
    console.error('🚨 Error en búsqueda global:', error);
    res.status(500).json({ error: 'Error al buscar en la base de datos' });
  }
});
// =================================================================
// 🧹 ROBOT DE LIMPIEZA AUTOMÁTICA DE BASE DE DATOS
// =================================================================
const limpiarTurnosExpirados = async () => {
  try {
    // 👇 AHORA BUSCA EN LA TABLA CORRECTA Y COLUMNA CORRECTA 👇
    const query = `DELETE FROM turnos WHERE fecha < CURRENT_DATE`;
    
    const resultado = await pool.query(query);
    
    if (resultado.rowCount > 0) {
      console.log(`🧹 Limpieza automática: ${resultado.rowCount} turnos antiguos eliminados de la BD.`);
    }
  } catch (error) {
    console.error('🚨 Error al limpiar turnos en la BD:', error.message);
  }
};
// 1. Ejecutar al iniciar el servidor para limpiar la basura de ayer
limpiarTurnosExpirados();

// 2. Programar para que se ejecute automáticamente cada 12 horas
setInterval(limpiarTurnosExpirados, 12 * 60 * 60 * 1000);
// =================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});