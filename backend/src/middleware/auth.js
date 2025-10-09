const jwt = require('jsonwebtoken');

const authMiddleware = {
  // Middleware para verificar token
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
      res.status(401).json({ error: 'Token inválido' });
    }
  },

  // Middleware para verificar roles específicos
  requireRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(req.user.verification_level)) {
        return res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
      }
      next();
    };
  }
};

module.exports = authMiddleware;