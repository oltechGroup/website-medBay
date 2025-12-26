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

// ✅ CORRECCIÓN CRÍTICA: Usamos process.cwd() para apuntar a la raíz del proyecto.
// Esto alinea la carpeta de lectura con la carpeta donde Multer guarda los archivos.
const uploadsPath = path.join(process.cwd(), 'uploads');
const imagesPath = path.join(uploadsPath, 'images');

// Crear directorios si no existen
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath, { recursive: true });
}

// ✅ Servir archivos estáticos desde la ruta absoluta correcta
// Esto hace que http://localhost:3001/uploads/... funcione siempre
app.use('/uploads', express.static(uploadsPath));

// ==================== RUTAS ====================

app.use('/api/import', require('./src/routes/importRoutes'));
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
app.use('/api/contact', require('./src/routes/contactRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

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
  console.log(`\n🚀 MedBay Server listo en http://localhost:${PORT}`);
  console.log(`🌎 Moneda Base: USD`);
  console.log(`📸 Carpeta de imágenes: ${uploadsPath}`);
});