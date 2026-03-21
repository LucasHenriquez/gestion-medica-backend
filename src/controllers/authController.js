const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, contrasena } = req.body;
    try {
        const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (resultado.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        const usuario = resultado.rows[0];
        if (usuario.estado !== 'activo') return res.status(403).json({ mensaje: 'Usuario inactivo. Contacte al administrador.' });

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: usuario.id, rol_id: usuario.rol_id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(200).json({ mensaje: 'Login exitoso', token, usuario: { id: usuario.id, nombre: usuario.nombre, rol_id: usuario.rol_id } });
    } catch (error) {
        console.error("🔥 Error en Login:", error); // <-- Agrega esta línea
        res.status(500).json({ mensaje: 'Error en el servidor al intentar iniciar sesión' });
    }
};

module.exports = { login };