const pool = require('../config/db');

// =========================================================
// 🛠️ 1. CRUD DE TURNOS (PANEL DE ADMINISTRADOR)
// =========================================================

// LEER (GET)
const obtenerOfertas = async (req, res) => {
    try {
        const query = `
            SELECT o.id, o.especialidad_requerida, o.fecha_turno, o.horario, o.valor_turno, 
                   o.tipo_servicio, o.ubicacion_especifica, o.descripcion, o.estado,
                   c.nombre AS centro_medico, c.direccion, c.ciudad
            FROM ofertas_trabajo o
            JOIN centros_medicos c ON o.centro_id = c.id
            WHERE o.estado != 'cancelada'
            ORDER BY o.fecha_turno ASC
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error("Error en obtenerOfertas:", error);
        res.status(500).json({ mensaje: 'Error al obtener las ofertas' });
    }
};

// CREAR (POST)
const crearOferta = async (req, res) => {
    // 💡 AHORA RECIBIMOS LOS DATOS NUEVOS DESDE REACT
    const { centro_id, especialidad_requerida, fecha_turno, horario, valor_turno, tipo_servicio, ubicacion_especifica, descripcion } = req.body;
    
    try {
        const query = `
            INSERT INTO ofertas_trabajo (centro_id, especialidad_requerida, fecha_turno, horario, valor_turno, tipo_servicio, ubicacion_especifica, descripcion, estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente') 
            RETURNING *
        `;
        const valores = [centro_id, especialidad_requerida, fecha_turno, horario, valor_turno, tipo_servicio, ubicacion_especifica, descripcion];
        const nuevaOferta = await pool.query(query, valores);
        
        res.status(201).json({ mensaje: 'Turno publicado con éxito 📢', oferta: nuevaOferta.rows[0] });
    } catch (error) {
        console.error("Error en crearOferta:", error);
        res.status(500).json({ mensaje: 'Error al publicar el turno' });
    }
};

// ACTUALIZAR (PUT)
const actualizarOferta = async (req, res) => {
    const { id } = req.params;
    const { especialidad_requerida, fecha_turno, horario, valor_turno, tipo_servicio, ubicacion_especifica, descripcion } = req.body;

    try {
        const query = `
            UPDATE ofertas_trabajo 
            SET especialidad_requerida = $1, fecha_turno = $2, horario = $3, valor_turno = $4, tipo_servicio = $5, ubicacion_especifica = $6, descripcion = $7
            WHERE id = $8 
            RETURNING *
        `;
        const valores = [especialidad_requerida, fecha_turno, horario, valor_turno, tipo_servicio, ubicacion_especifica, descripcion, id];
        const ofertaActualizada = await pool.query(query, valores);

        if (ofertaActualizada.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Turno no encontrado' });
        }
        res.status(200).json({ mensaje: 'Turno actualizado ✏️', oferta: ofertaActualizada.rows[0] });
    } catch (error) {
        console.error("Error en actualizarOferta:", error);
        res.status(500).json({ mensaje: 'Error al actualizar el turno' });
    }
};

// ELIMINAR / CANCELAR (DELETE)
const eliminarOferta = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            UPDATE ofertas_trabajo 
            SET estado = 'cancelada' 
            WHERE id = $1 
            RETURNING *
        `;
        const cancelada = await pool.query(query, [id]);

        if (cancelada.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Turno no encontrado' });
        }
        res.status(200).json({ mensaje: 'Turno cancelado 🚫', oferta: cancelada.rows[0] });
    } catch (error) {
        console.error("Error en eliminarOferta:", error);
        res.status(500).json({ mensaje: 'Error al cancelar el turno' });
    }
};
// ==========================================
// ASIGNAR TURNO MANUALMENTE (ADMIN)
// ==========================================
const asignarTurnoAdmin = async (req, res) => {
    const { id } = req.params;
    const { profesional_id } = req.body;

    try {
        const query = `
            UPDATE ofertas_trabajo 
            SET estado = 'asignada', profesional_asignado_id = $1 
            WHERE id = $2 
            RETURNING *
        `;
        const turnoAsignado = await pool.query(query, [profesional_id, id]);

        if (turnoAsignado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Turno no encontrado' });
        }
        res.status(200).json({ mensaje: 'Turno asignado exitosamente al médico ✅', oferta: turnoAsignado.rows[0] });
    } catch (error) {
        console.error("Error al asignar turno:", error);
        res.status(500).json({ mensaje: 'Error al asignar el turno' });
    }
};

// =========================================================
// 🚀 2. FUNCIONES AVANZADAS (APP MÓVIL Y HUB GPS)
// =========================================================

const aceptarOferta = async (req, res) => {
    const { id } = req.params; 
    const { profesional_id } = req.body; 

    try {
        const ofertaCheck = await pool.query('SELECT estado FROM ofertas_trabajo WHERE id = $1', [id]);
        if (ofertaCheck.rows.length === 0) return res.status(404).json({ mensaje: 'Oferta no encontrada' });
        if (ofertaCheck.rows[0].estado !== 'pendiente' && ofertaCheck.rows[0].estado !== 'abierta') return res.status(400).json({ mensaje: 'Oferta ya tomada o cancelada' });

        const ofertaAsignada = await pool.query(
            "UPDATE ofertas_trabajo SET estado = 'asignada', profesional_asignado_id = $1 WHERE id = $2 RETURNING *",
            [profesional_id, id]
        );
        res.status(200).json({ mensaje: '¡Turno aceptado con éxito! 🎉', oferta: ofertaAsignada.rows[0] });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al aceptar oferta' });
    }
};

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
                WHERE (o.estado = 'abierta' OR o.estado = 'pendiente') AND o.especialidad_requerida = $1
                ORDER BY distancia_km ASC
            `;
            valores = [miEspecialidad, lat, lng];
        } else {
            queryOfertas = `
                SELECT o.id, o.descripcion, o.fecha_turno, c.nombre AS clinica, c.direccion
                FROM ofertas_trabajo o
                JOIN centros_medicos c ON o.centro_id = c.id
                WHERE (o.estado = 'abierta' OR o.estado = 'pendiente') AND o.especialidad_requerida = $1
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

// Exportamos TODAS las funciones
module.exports = { 
    obtenerOfertas, 
    crearOferta, 
    actualizarOferta, 
    eliminarOferta,
    asignarTurnoAdmin,
    aceptarOferta, 
    obtenerOfertasParaProfesional, 
    obtenerMisTurnos 
};