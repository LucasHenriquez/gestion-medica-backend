const pool = require('../config/db');

const obtenerProfesionales = async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.nombre, p.especialidad, p.estado, c.nombre AS centro_medico 
            FROM profesionales p
            LEFT JOIN centros_medicos c ON p.centro_id = c.id
            ORDER BY p.id ASC
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener profesionales' });
    }
};

const crearProfesional = async (req, res) => {
    const { usuario_id, nombre, especialidad, centro_id } = req.body;
    try {
        const nuevo = await pool.query(
            'INSERT INTO profesionales (usuario_id, nombre, especialidad, centro_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuario_id, nombre, especialidad, centro_id]
        );
        res.status(201).json({ mensaje: 'Profesional registrado', profesional: nuevo.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar profesional' });
    }
};

const actualizarProfesional = async (req, res) => {
    const { id } = req.params;
    const { nombre, especialidad, centro_id, estado } = req.body;
    try {
        const actualizado = await pool.query(
            'UPDATE profesionales SET nombre = $1, especialidad = $2, centro_id = $3, estado = $4 WHERE id = $5 RETURNING *',
            [nombre, especialidad, centro_id, estado, id]
        );
        if (actualizado.rows.length === 0) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
        res.status(200).json({ mensaje: 'Profesional actualizado', profesional: actualizado.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar profesional' });
    }
};

const eliminarProfesional = async (req, res) => {
    const { id } = req.params;
    try {
        const eliminado = await pool.query(
            "UPDATE profesionales SET estado = 'inactivo' WHERE id = $1 RETURNING *",
            [id]
        );
        if (eliminado.rows.length === 0) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
        res.status(200).json({ mensaje: 'Profesional desactivado', profesional: eliminado.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al desactivar profesional' });
    }
};

module.exports = { obtenerProfesionales, crearProfesional, actualizarProfesional, eliminarProfesional };