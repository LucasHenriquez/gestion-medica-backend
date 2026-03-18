const pool = require('../config/db');

// 1. Obtener todas las ofertas
const obtenerOfertas = async (req, res) => {
    try {
        const query = `
            SELECT o.id, o.especialidad_requerida, o.descripcion, o.fecha_turno, o.estado,
                   c.nombre AS centro_medico, c.direccion, c.ciudad
            FROM ofertas_trabajo o
            JOIN centros_medicos c ON o.centro_id = c.id
            ORDER BY o.fecha_turno ASC
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener las ofertas' });
    }
};

// 2. Publicar una nueva oferta
const crearOferta = async (req, res) => {
    const { centro_id, especialidad_requerida, descripcion, fecha_turno } = req.body;
    try {
        const nuevaOferta = await pool.query(
            'INSERT INTO ofertas_trabajo (centro_id, especialidad_requerida, descripcion, fecha_turno) VALUES ($1, $2, $3, $4) RETURNING *',
            [centro_id, especialidad_requerida, descripcion, fecha_turno]
        );
        res.status(201).json({ mensaje: 'Oferta publicada 📢', oferta: nuevaOferta.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear la oferta' });
    }
};

// 3. Cancelar una oferta
const cancelarOferta = async (req, res) => {
    const { id } = req.params;
    try {
        const cancelada = await pool.query(
            "UPDATE ofertas_trabajo SET estado = 'cancelada' WHERE id = $1 RETURNING *",
            [id]
        );
        if (cancelada.rows.length === 0) return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        res.status(200).json({ mensaje: 'Oferta cancelada 🚫', oferta: cancelada.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cancelar la oferta' });
    }
};

// 4. Aceptar Oferta
const aceptarOferta = async (req, res) => {
    const { id } = req.params; 
    const { profesional_id } = req.body; 

    try {
        const ofertaCheck = await pool.query('SELECT estado FROM ofertas_trabajo WHERE id = $1', [id]);
        if (ofertaCheck.rows.length === 0) return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        if (ofertaCheck.rows[0].estado !== 'abierta') return res.status(400).json({ mensaje: 'Oferta ya tomada o cancelada' });

        const ofertaAsignada = await pool.query(
            "UPDATE ofertas_trabajo SET estado = 'asignada', profesional_asignado_id = $1 WHERE id = $2 RETURNING *",
            [profesional_id, id]
        );
        res.status(200).json({ mensaje: '¡Turno aceptado con éxito! 🎉', oferta: ofertaAsignada.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al aceptar oferta' });
    }
};

// 5. El Hub Inteligente (Calcula distancia en KM)
const obtenerOfertasParaProfesional = async (req, res) => {
    const { profesional_id } = req.params; 
    const { lat, lng } = req.query; 

    try {
        const profQuery = await pool.query('SELECT especialidad FROM profesionales WHERE id = $1', [profesional_id]);
        if (profQuery.rows.length === 0) return res.status(404).json({ mensaje: 'Profesional no encontrado' });
        
        const miEspecialidad = profQuery.rows[0].especialidad;
        let queryOfertas, valores;

        if (lat && lng) {
            queryOfertas = `
                SELECT o.id, o.descripcion, o.fecha_turno, c.nombre AS clinica, c.direccion,
                ROUND((6371 * acos(cos(radians($2)) * cos(radians(c.latitud)) * cos(radians(c.longitud) - radians($3)) + sin(radians($2)) * sin(radians(c.latitud))))::numeric, 2) AS distancia_km
                FROM ofertas_trabajo o
                JOIN centros_medicos c ON o.centro_id = c.id
                WHERE o.estado = 'abierta' AND o.especialidad_requerida = $1
                ORDER BY distancia_km ASC
            `;
            valores = [miEspecialidad, lat, lng];
        } else {
            queryOfertas = `
                SELECT o.id, o.descripcion, o.fecha_turno, c.nombre AS clinica, c.direccion
                FROM ofertas_trabajo o
                JOIN centros_medicos c ON o.centro_id = c.id
                WHERE o.estado = 'abierta' AND o.especialidad_requerida = $1
                ORDER BY o.fecha_turno ASC
            `;
            valores = [miEspecialidad];
        }

        const ofertas = await pool.query(queryOfertas, valores);
        res.status(200).json({ mensaje: `Ofertas para ${miEspecialidad}`, total: ofertas.rows.length, ofertas: ofertas.rows });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar ofertas para el profesional' });
    }
};

// 6. Ver Mis Turnos (Historial del Doctor)
const obtenerMisTurnos = async (req, res) => {
    const { profesional_id } = req.params;
    try {
        const query = `
            SELECT o.id, o.descripcion, o.fecha_turno, c.nombre AS clinica, c.direccion, c.ciudad
            FROM ofertas_trabajo o
            JOIN centros_medicos c ON o.centro_id = c.id
            WHERE o.profesional_asignado_id = $1 AND o.estado = 'asignada'
            ORDER BY o.fecha_turno ASC
        `;
        const turnos = await pool.query(query, [profesional_id]);
        res.status(200).json({ mensaje: '📅 Tu agenda', total: turnos.rows.length, turnos: turnos.rows });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el historial' });
    }
};

module.exports = { obtenerOfertas, crearOferta, cancelarOferta, aceptarOferta, obtenerOfertasParaProfesional, obtenerMisTurnos };