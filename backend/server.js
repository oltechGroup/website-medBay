//backend/server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentamos límite para jsons grandes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuración de Directorios
const directories = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'images')
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📂 Directorio creado: ${dir}`);
  }
});

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== RUTAS ====================

// Importación (El módulo estrella)
app.use('/api/import', require('./src/routes/importRoutes'));

// Módulos Core
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/countries', require('./src/routes/countryRoutes'));
app.use('/api/manufacturers', require('./src/routes/manufacturerRoutes'));
app.use('/api/suppliers', require('./src/routes/supplierRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes')); 
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/documents', require('./src/routes/documentRoutes'));
app.use('/api/compliance', require('./src/routes/complianceRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'MedBay API', 
    mode: process.env.NODE_ENV 
  });
});

// Error Handling Global
app.use((err, req, res, next) => {
  console.error('🔥 Error Global:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor',
    details: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 MedBay Server listo en http://localhosto:${PORT}`);
  console.log(`🌎 Moneda Base: USD`);
});