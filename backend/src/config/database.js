//backend/src/config/database.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Probar la conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error fatal conectando a la BD:', err.stack);
  } else {
    console.log(`✅ Conectado a PostgreSQL | DB: ${process.env.DB_NAME} | User: ${process.env.DB_USER}`);
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool // Exportamos el pool para poder usar transacciones
};