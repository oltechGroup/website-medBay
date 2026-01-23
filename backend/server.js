// backend/server.js 

const express = require('express');
const cors = require('cors'); // ✅ 1. DESCOMENTADO (Es vital para que funcione)
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
// ⚠️ Puerto 4000 para que coincida con lo que espera Nginx
const PORT = process.env.PORT || 4000; 

// =======================================================
// 🛡️ CONFIGURACIÓN DE CORS (LA SOLUCIÓN A TU ERROR)
// =======================================================
// Esto le dice al navegador: "Permite que www.medbaysupply.com se conecte 
// y envíe cookies/credenciales".
app.use(cors({
  origin: [
    'https://www.medbaysupply.com', 
    'https://medbaysupply.com',
  ],
  credentials: true, // 👈 ESTO ARREGLA EL ERROR "Access-Control-Allow-Credentials"
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// =======================================================
// 🔧 CORRECCIÓN DE RUTAS (Vital para que no se rompa al subir)
// =======================================================
const uploadsPath = path.join(__dirname, 'uploads');

const imagesPath = path.join(uploadsPath, 'images');
const evidencePath = path.join(uploadsPath, 'evidence'); 
const documentsPath = path.join(uploadsPath, 'documents');

// Crear directorios si no existen
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath, { recursive: true });
if (!fs.existsSync(evidencePath)) fs.mkdirSync(evidencePath, { recursive: true });
if (!fs.existsSync(documentsPath)) fs.mkdirSync(documentsPath, { recursive: true });

console.log('📂 Sirviendo archivos estáticos desde:', uploadsPath);

app.use('/uploads', express.static(uploadsPath));

// ==================== RUTAS ====================
app.use('/api/import', require('./src/routes/importRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
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
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/countries', require('./src/routes/countryRoutes'));
app.use('/api/manufacturers', require('./src/routes/manufacturerRoutes'));
app.use('/api/suppliers', require('./src/routes/supplierRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes'));
app.use('/api/addresses', require('./src/routes/addressRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'MedBay API',
    cors_enabled: true
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
  console.log(`🛡️ CORS Habilitado para: https://www.medbaysupply.com`);
  console.log(`📸 Carpeta de imágenes configurada en: ${uploadsPath}`);
});