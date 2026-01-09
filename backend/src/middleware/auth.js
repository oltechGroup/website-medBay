// backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');

const authMiddleware = {
  // 1. Middleware para verificar token (ESTRICTO)
  // Úsalo cuando la ruta REQUIERA estar logueado obligatoriamente
  verifyToken: (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();

    } catch (error) {
      console.error('Error en autenticación:', error);
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  },

  // 2. Middleware para verificar roles específicos
  requireRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.verification_level)) {
        return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
      }
      next();
    };
  },

  // 3. ✅ NUEVO: Autenticación Opcional (HÍBRIDO)
  // Intenta leer el usuario. Si no hay token o es inválido, deja pasar pero sin req.user.
  // Útil para catálogos que se ven diferente según si eres invitado o usuario.
  optionalAuth: (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      }
      next();
    } catch (error) {
      // Si el token está mal, no bloqueamos, simplemente es un "invitado"
      req.user = null;
      next();
    }
  }
};

module.exports = authMiddleware;