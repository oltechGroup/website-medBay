// backend/src/config/database.js

const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // 👇 ESTO ES LO NUEVO Y MÁGICO PARA AWS RDS 👇
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = new Pool(dbConfig);

// Probar la conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error fatal conectando a la BD:', err.message); // Cambié stack por message para leerlo mejor
    console.error('🔍 Detalles:', err);
  } else {
    console.log(`✅ Conectado a PostgreSQL | DB: ${process.env.DB_NAME} | Host: ${process.env.DB_HOST}`);
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};