const pool = require('../config/db');

const obtenerCentros = async (req, res) => {
    try {
        const resultado = await pool.query("SELECT * FROM centros_medicos WHERE estado = 'activo' ORDER BY id ASC");
        res.status(200).json(resultado.rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener centros' });
    }
};

const crearCentro = async (req, res) => {
    const { nombre, direccion, ciudad, latitud, longitud } = req.body;
    try {
        const nuevo = await pool.query(
            'INSERT INTO centros_medicos (nombre, direccion, ciudad, latitud, longitud) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, direccion, ciudad, latitud, longitud]
        );
        res.status(201).json({ mensaje: 'Centro creado', centro: nuevo.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear centro' });
    }
};

const actualizarCentro = async (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, ciudad, latitud, longitud, estado } = req.body;
    try {
        const actualizado = await pool.query(
            'UPDATE centros_medicos SET nombre = $1, direccion = $2, ciudad = $3, latitud = $4, longitud = $5, estado = $6 WHERE id = $7 RETURNING *',
            [nombre, direccion, ciudad, latitud, longitud, estado, id]
        );
        if (actualizado.rows.length === 0) return res.status(404).json({ mensaje: 'Centro no encontrado' });
        res.status(200).json({ mensaje: 'Centro actualizado', centro: actualizado.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar centro' });
    }
};

const eliminarCentro = async (req, res) => {
    const { id } = req.params;
    try {
        const eliminado = await pool.query(
            "UPDATE centros_medicos SET estado = 'inactivo' WHERE id = $1 RETURNING *",
            [id]
        );
        if (eliminado.rows.length === 0) return res.status(404).json({ mensaje: 'Centro no encontrado' });
        res.status(200).json({ mensaje: 'Centro desactivado', centro: eliminado.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar centro' });
    }
};

module.exports = { obtenerCentros, crearCentro, actualizarCentro, eliminarCentro };