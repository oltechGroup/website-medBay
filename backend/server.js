const express = require('express');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Crear directorios necesarios
const directories = ['uploads'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Servir archivos estáticos para uploads
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/manufacturers', require('./src/routes/manufacturerRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/suppliers', require('./src/routes/supplierRoutes'));

// NUEVAS RUTAS - MÓDULO INVENTARIO (AGREGAR ESTAS)
app.use('/api/expiry-categories', require('./src/routes/expiryCategoryRoutes'));
app.use('/api/product-lots', require('./src/routes/productLotRoutes'));

// NUEVAS RUTAS - MÓDULO DATOS MAESTROS (AGREGAR ESTAS)
app.use('/api/countries', require('./src/routes/countryRoutes'));
app.use('/api/currencies', require('./src/routes/currencyRoutes'));
app.use('/api/avalara-tax-codes', require('./src/routes/avalaraTaxCodeRoutes'));

// Rutas existentes que ya tienes
app.use('/api/inventory', require('./src/routes/inventoryRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/documents', require('./src/routes/documentRoutes'));
app.use('/api/compliance', require('./src/routes/complianceRoutes'));
app.use('/api/import', require('./src/routes/importRoutes'));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '🚀 MedBay API está funcionando!', 
    timestamp: new Date().toISOString(),
    database: 'Conectado a PostgreSQL',
    features: {
      import: 'Sistema de importación de Excel activo',
      compliance: 'Revisión humana integrada',
      inventory: 'Gestión por lotes y expiración',
      master_data: 'Datos maestros (países, monedas, códigos fiscales)'
    }
  });
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a MedBay Platform API',
    version: '1.0.0',
    description: 'Marketplace médico B2B con cumplimiento normativo',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      auth: '/api/auth',
      products: '/api/products',
      manufacturers: '/api/manufacturers',
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      inventory: '/api/inventory',
      orders: '/api/orders',
      invoices: '/api/invoices',
      documents: '/api/documents',
      compliance: '/api/compliance',
      import: '/api/import',
      // NUEVOS ENDPOINTS - DATOS MAESTROS
      countries: '/api/countries',
      currencies: '/api/currencies',
      tax_codes: '/api/avalara-tax-codes'
    }
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n✨ ==============================================`);
  console.log(`🚀 Servidor MedBay corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Sistema de importación: ACTIVO`);
  console.log(`🔒 Cumplimiento normativo: ACTIVO`);
  console.log(`📦 Gestión de inventario: ACTIVO`);
  console.log(`🌎 Datos maestros: ACTIVO (países, monedas, códigos fiscales)`);
  console.log(`✨ ==============================================\n`);
});