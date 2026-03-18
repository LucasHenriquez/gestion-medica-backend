const express = require('express');
const router = express.Router();
const { obtenerCentros, crearCentro, actualizarCentro, eliminarCentro } = require('../controllers/centroController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, obtenerCentros);
router.post('/', verificarToken, esAdmin, crearCentro);
router.put('/:id', verificarToken, esAdmin, actualizarCentro);
router.delete('/:id', verificarToken, esAdmin, eliminarCentro);

module.exports = router;