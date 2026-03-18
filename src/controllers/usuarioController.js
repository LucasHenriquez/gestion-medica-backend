const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const obtenerUsuarios = async (req, res) => {
    try {
        const resultado = await pool.query('SELECT id, nombre, email, rol_id, estado FROM usuarios ORDER BY id ASC');
        res.status(200).json(resultado.rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los usuarios' });
    }
};

const crearUsuario = async (req, res) => {
    const { nombre, email, contrasena, rol_id } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const contrasenaEncriptada = await bcrypt.hash(contrasena, salt);
        const nuevoUsuario = await pool.query(
            'INSERT INTO usuarios (nombre, email, contrasena, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol_id, estado',
            [nombre, email, contrasenaEncriptada, rol_id]
        );
        res.status(201).json({ mensaje: 'Usuario creado exitosamente 🥳', usuario: nuevoUsuario.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear el usuario. Verifica que el email no esté repetido.' });
    }
};

const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, rol_id, estado } = req.body;
    try {
        const actualizado = await pool.query(
            'UPDATE usuarios SET nombre = $1, rol_id = $2, estado = $3 WHERE id = $4 RETURNING id, nombre, email, rol_id, estado',
            [nombre, rol_id, estado, id]
        );
        if (actualizado.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.status(200).json({ mensaje: 'Usuario actualizado ✏️', usuario: actualizado.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
    }
};

const eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const eliminado = await pool.query(
            "UPDATE usuarios SET estado = 'inactivo' WHERE id = $1 RETURNING id, nombre, email, estado",
            [id]
        );
        if (eliminado.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.status(200).json({ mensaje: 'Usuario desactivado 🛑', usuario: eliminado.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al desactivar el usuario' });
    }
};

module.exports = { obtenerUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario };