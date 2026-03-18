const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

pool.connect()
    .then(() => console.log('🟢 Base de datos PostgreSQL conectada con éxito'))
    .catch(err => console.error('🔴 Error de conexión a la base de datos', err.stack));

module.exports = pool;