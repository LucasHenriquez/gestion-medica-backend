const express = require('express');
const router = express.Router();
const { obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } = require('../controllers/usuarioController');
const { verificarToken, esAdmin } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, obtenerUsuarios);
router.post('/', crearUsuario); // Sin protección para poder crear el primer admin
router.put('/:id', verificarToken, esAdmin, actualizarUsuario);
router.delete('/:id', verificarToken, esAdmin, eliminarUsuario);

module.exports = router;