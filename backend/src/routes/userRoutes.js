// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer'); // ✅ NUEVO: Importamos multer para identificar sus errores
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const uploadEvidence = require('../middleware/uploadEvidence'); 

// ==========================================
// 🔓 RUTAS PÚBLICAS
// ==========================================

// Registro de clientes (Business/Médicos) con documento
// ✅ MODIFICACIÓN: Envolvemos el middleware de Multer para atrapar errores y enviar un mensaje limpio en inglés.
router.post('/register', (req, res, next) => {
  uploadEvidence.single('documentFile')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Error nativo de Multer (ej. archivo muy pesado)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size allowed is 15MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // Error personalizado (ej. el que pusimos en el fileFilter para formatos no válidos)
      return res.status(400).json({ error: err.message });
    }
    // Si todo sale bien, pasamos al controlador
    next();
  });
}, userController.register);

// ==========================================
// 🔒 RUTAS PROTEGIDAS (Gestión de Usuarios)
// ==========================================
// Todo lo de abajo requiere Token válido
router.use(authMiddleware.verifyToken);

// ✅ Actualizar mi propio perfil (Solo teléfono por ahora)
router.put('/profile', userController.updateProfile);

// ✅ Obtener lista de usuarios (Soporta filtros ?role=...&search=...)
router.get('/', authMiddleware.requireRole(['admin', 'sales_agent']), userController.getAllUsers);

// ✅ Crear Staff (Vendedores/Admins)
router.post('/create-staff', authMiddleware.requireRole(['admin']), userController.createStaff);

// ----------------------------------------------------
// 💰 NUEVAS RUTAS DE COMISIONES (SOLO ADMIN)
// ----------------------------------------------------

// ✅ Obtener reporte de comisiones pendientes (Antes de /:id para evitar conflictos)
router.get('/commissions/summary', authMiddleware.requireRole(['admin']), userController.getCommissionsSummary);

// ✅ Pagar comisiones (Corte de Caja) a un vendedor específico
router.post('/:id/pay-commissions', authMiddleware.requireRole(['admin']), userController.payUserCommissions);

// ----------------------------------------------------

// ✅ Detalles de Usuario específico
router.get('/:id', userController.getUserById);

// ✅ Actualizar Estado (Aprobar/Rechazar/Suspender)
router.put('/:id/status', authMiddleware.requireRole(['admin']), userController.updateUserStatus);

// ✅ Eliminar Usuario
router.delete('/:id', authMiddleware.requireRole(['admin']), userController.deleteUser);

module.exports = router;