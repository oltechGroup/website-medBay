const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // 1. IMPORTANTE: Importar path
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 2. Crear directorios necesarios (incluyendo subcarpeta images por seguridad)
const directories = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'images') // Aseguramos que exista la subcarpeta
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📂 Directorio creado: ${dir}`);
  }
});

// 3. SOLUCIÓN AL PROBLEMA DE IMÁGENES
// Usamos path.join(__dirname, 'uploads') para asegurar la ruta absoluta
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== RUTAS PRINCIPALES ====================

// 🔐 AUTENTICACIÓN Y USUARIOS
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));

// 📦 MÓDULO PRODUCTOS
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));

// 🏭 MÓDULO DATOS MAESTROS
app.use('/api/countries', require('./src/routes/countryRoutes'));
app.use('/api/manufacturers', require('./src/routes/manufacturerRoutes'));
app.use('/api/suppliers', require('./src/routes/supplierRoutes'));

// 📊 MÓDULO INVENTARIO
app.use('/api/inventory', require('./src/routes/inventoryRoutes')); 

// 💰 MÓDULO COMERCIAL
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));

// 📄 MÓDULO DOCUMENTOS
app.use('/api/documents', require('./src/routes/documentRoutes'));
app.use('/api/compliance', require('./src/routes/complianceRoutes'));
app.use('/api/import', require('./src/routes/importRoutes'));

// ==================== RUTAS DE SISTEMA ====================

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '🚀 MedBay API está funcionando!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    imagePath: path.join(__dirname, 'uploads') // Debug info para ver dónde busca las fotos
  });
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a MedBay Platform API',
    version: '2.0.0',
    description: 'Marketplace médico B2B con cumplimiento normativo'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method 
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error global del servidor:', error);
  res.status(500).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Contacta al administrador del sistema'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n✨ ==============================================`);
  console.log(`🚀 Servidor MedBay corriendo en http://localhost:${PORT}`);
  console.log(`📂 Carpeta de uploads pública: ${path.join(__dirname, 'uploads')}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✨ ==============================================\n`);
});