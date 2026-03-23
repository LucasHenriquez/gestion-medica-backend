const express = require('express');
const router = express.Router();
const { 
    obtenerOfertas, 
    crearOferta, 
    actualizarOferta, 
    eliminarOferta,
    asignarTurnoAdmin,             // 🧑‍⚕️ NUEVA: Para el botón verde del Panel Admin
    aceptarOferta,                 // 🚀 Avanzada: Para que el médico acepte desde su celular
    obtenerOfertasParaProfesional, // 🚀 Avanzada: Para el radar GPS
    obtenerMisTurnos               // 🚀 Avanzada: Para el historial del médico
} = require('../controllers/ofertaController');

// ==========================================
// 🛠️ Rutas del CRUD del Administrador (Panel React)
// ==========================================
router.get('/', obtenerOfertas);
router.post('/', crearOferta);
router.put('/:id', actualizarOferta);
router.delete('/:id', eliminarOferta);

// 🧑‍⚕️ Ruta específica para asignar el turno a un médico manualmente
router.put('/:id/asignar', asignarTurnoAdmin);

// ==========================================
// 🚀 Rutas Avanzadas (Para la App Móvil / GPS)
// ==========================================
router.put('/:id/aceptar', aceptarOferta);
router.get('/profesional/:profesional_id', obtenerOfertasParaProfesional);
router.get('/profesional/:profesional_id/historial', obtenerMisTurnos);

module.exports = router;