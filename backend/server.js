// backend/server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =======================================================
// 🔧 CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
// =======================================================

// Usamos __dirname para anclar la ruta a la carpeta donde está este archivo server.js
// Esto evita problemas con PM2 ejecutándose desde otras rutas.
const uploadsPath = path.join(__dirname, 'uploads');

// Definimos subcarpetas para crearlas si no existen
const imagesPath = path.join(uploadsPath, 'images');
const evidencePath = path.join(uploadsPath, 'evidence');
const documentsPath = path.join(uploadsPath, 'documents');

// Crear directorios recursivamente si no existen
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath, { recursive: true });
if (!fs.existsSync(evidencePath)) fs.mkdirSync(evidencePath, { recursive: true });
if (!fs.existsSync(documentsPath)) fs.mkdirSync(documentsPath, { recursive: true });

// Debug: Veremos esto en los logs de PM2 para confirmar la ruta física
console.log('📂 Sirviendo archivos estáticos desde:', uploadsPath);

// Servir la carpeta uploads en la URL /uploads
app.use('/uploads', express.static(uploadsPath));

// =======================================================

// Rutas API
app.use('/api/import', require('./src/routes/importRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/addresses', require('./src/routes/addressRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/countries', require('./src/routes/countryRoutes'));
app.use('/api/manufacturers', require('./src/routes/manufacturerRoutes'));
app.use('/api/suppliers', require('./src/routes/supplierRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes')); 
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/documents', require('./src/routes/documentRoutes'));
app.use('/api/compliance', require('./src/routes/complianceRoutes'));
app.use('/api/contact', require('./src/routes/contactRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/wishlist', require('./src/routes/wishlistRoutes'));
app.use('/api/quotes', require('./src/routes/quoteRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));

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
  console.log(`\n🚀 MedBay Server listo en puerto ${PORT}`);
  console.log(`🌎 Moneda Base: USD`);
  console.log(`📸 Carpeta de imágenes configurada en: ${uploadsPath}`);
});