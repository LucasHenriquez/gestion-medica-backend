const pool = require('../config/db');
const express = require('express');

// ==========================================
// 1. LEER: Obtener todos los médicos (GET)
// ==========================================
const obtenerProfesionales = async (req, res) => {
    try {
        const query = `
            SELECT id, nombres, apellidos, rut, fecha_nacimiento, registro_sis, especialidad, email, telefono, estado 
            FROM profesionales 
            WHERE estado = 'activo'
            ORDER BY id DESC
        `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error("Error en obtenerProfesionales:", error);
        res.status(500).json({ mensaje: 'Error al obtener los profesionales' });
    }
};

// ==========================================
// 2. CREAR: Registrar un nuevo médico (POST)
// ==========================================
const crearProfesional = async (req, res) => {
    const { nombres, apellidos, rut, fecha_nacimiento, registro_sis, especialidad, email, telefono } = req.body;
    
    try {
        const query = `
            INSERT INTO profesionales (nombres, apellidos, rut, fecha_nacimiento, registro_sis, especialidad, email, telefono, estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'activo') 
            RETURNING *
        `;
        const valores = [nombres, apellidos, rut, fecha_nacimiento, registro_sis, especialidad, email, telefono];
        const nuevoPro = await pool.query(query, valores);
        
        res.status(201).json({ mensaje: 'Médico registrado exitosamente 🩺', profesional: nuevoPro.rows[0] });
    } catch (error) {
        console.error("Error en crearProfesional:", error);
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El RUT o Registro SIS ya se encuentra registrado.' });
        }
        res.status(500).json({ mensaje: 'Error al registrar el profesional' });
    }
};

// ==========================================
// 3. ACTUALIZAR: Editar datos del médico (PUT)
// ==========================================
const actualizarProfesional = async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, rut, fecha_nacimiento, registro_sis, especialidad, email, telefono } = req.body;

    try {
        const query = `
            UPDATE profesionales 
            SET nombres = $1, apellidos = $2, rut = $3, fecha_nacimiento = $4, registro_sis = $5, especialidad = $6, email = $7, telefono = $8
            WHERE id = $9 
            RETURNING *
        `;
        const valores = [nombres, apellidos, rut, fecha_nacimiento, registro_sis, especialidad, email, telefono, id];
        const proActualizado = await pool.query(query, valores);

        if (proActualizado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Profesional no encontrado' });
        }

        res.status(200).json({ mensaje: 'Datos actualizados ✏️', profesional: proActualizado.rows[0] });
    } catch (error) {
        console.error("Error en actualizarProfesional:", error);
        res.status(500).json({ mensaje: 'Error al actualizar el profesional' });
    }
};

// ==========================================
// 4. ELIMINAR: Borrado Lógico (DELETE)
// ==========================================
const eliminarProfesional = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            UPDATE profesionales 
            SET estado = 'inactivo' 
            WHERE id = $1 
            RETURNING *
        `;
        const proEliminado = await pool.query(query, [id]);

        if (proEliminado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Profesional no encontrado' });
        }

        res.status(200).json({ mensaje: 'Médico desvinculado de la red 🚫', profesional: proEliminado.rows[0] });
    } catch (error) {
        console.error("Error en eliminarProfesional:", error);
        res.status(500).json({ mensaje: 'Error al eliminar el profesional' });
    }
};

module.exports = { 
    obtenerProfesionales, 
    crearProfesional, 
    actualizarProfesional, 
    eliminarProfesional 
};