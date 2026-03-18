const express = require('express');
const router = express.Router();
const { obtenerOfertas, crearOferta, cancelarOferta, aceptarOferta, obtenerOfertasParaProfesional, obtenerMisTurnos } = require('../controllers/ofertaController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, obtenerOfertas);
router.post('/', verificarToken, esAdmin, crearOferta);
router.delete('/:id', verificarToken, esAdmin, cancelarOferta);
router.put('/:id/aceptar', verificarToken, aceptarOferta);
router.get('/hub/:profesional_id', verificarToken, obtenerOfertasParaProfesional);
router.get('/mis-turnos/:profesional_id', verificarToken, obtenerMisTurnos);

module.exports = router;