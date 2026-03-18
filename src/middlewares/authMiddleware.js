const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ mensaje: 'Acceso denegado. No hay token.' });

    try {
        const verificado = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.usuario = verificado;
        next();
    } catch (error) {
        res.status(400).json({ mensaje: 'Token no válido' });
    }
};

const esAdmin = (req, res, next) => {
    if (req.usuario.rol_id !== 1) {
        return res.status(403).json({ mensaje: 'Acceso denegado. Se requieren permisos de Administrador.' });
    }
    next();
};

module.exports = { verificarToken, esAdmin };