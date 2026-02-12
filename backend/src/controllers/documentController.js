// backend/src/controllers/documentController.js

const { Pool } = require('pg');
const nodemailer = require('nodemailer'); 
const { 
  generateDocumentUpdateTemplate, 
  getBrandingAttachments 
} = require('../utils/emailTemplates');

// Configuración de la Base de Datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

// Configuración del Transporter (Local para evitar conflictos)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const documentController = {
  
  // --- CREAR DOCUMENTO ---
  create: async (req, res) => {
    try {
      const { owner_type, owner_id, document_type, reference_id } = req.body;
      const file = req.file; 

      // Validaciones básicas
      if (!owner_type || !owner_id || !document_type || !file) {
        return res.status(400).json({ error: 'Faltan campos requeridos o el archivo.' });
      }

      // Path relativo para guardar en BD
      const file_path = `/uploads/evidence/${file.filename}`;

      // Verificar owner_type
      if (!['user', 'supplier'].includes(owner_type)) {
        return res.status(400).json({ error: 'owner_type debe ser "user" o "supplier"' });
      }

      // Validar Permisos (Seguridad)
      if (owner_type === 'user') {
        if (owner_id !== req.user.id && req.user.verification_level !== 'admin') {
          return res.status(403).json({ error: 'No tienes permiso para subir documentos a este usuario.' });
        }
      }

      // Insertar en BD
      const query = `
        INSERT INTO documents (owner_type, owner_id, document_type, file_path, status, reference_id, created_at)
        VALUES ($1, $2, $3, $4, 'uploaded', $5, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [owner_type, owner_id, document_type, file_path, reference_id || null]);

      res.status(201).json({
        message: 'Documento subido exitosamente',
        document: result.rows[0]
      });

    } catch (error) {
      console.error('Error al crear documento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- REEMPLAZAR DOCUMENTO (Lógica Mejorada) ---
  replaceDocument: async (req, res) => {
    try {
      const { id } = req.params; 
      const { notes } = req.body; 
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Se requiere subir un nuevo archivo.' });
      }

      // 1. Obtener documento actual para validar propiedad
      const checkQuery = `
        SELECT d.*, u.full_name, u.email 
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        WHERE d.id = $1
      `;
      const checkRes = await pool.query(checkQuery, [id]);

      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      const doc = checkRes.rows[0];

      // 2. Validar Permisos (Solo el dueño o un admin pueden reemplazar)
      if (doc.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado para modificar este documento' });
      }

      // 3. Actualizar en BD
      // ✅ MEJORA: Reseteamos verified_by y verified_at a NULL para limpiar el historial de rechazos
      const newPath = `/uploads/evidence/${file.filename}`;
      const updateQuery = `
        UPDATE documents 
        SET 
          file_path = $1, 
          status = 'uploaded', 
          updated_at = NOW(), 
          notes = $2,
          verified_by = NULL,   -- Limpiamos quien lo revisó antes
          verified_at = NULL    -- Limpiamos la fecha de revisión anterior
        WHERE id = $3
        RETURNING *
      `;
      const updateRes = await pool.query(updateQuery, [newPath, notes || 'Actualización solicitada por usuario', id]);

      // 4. 🚨 ALERTA DE SEGURIDAD AL ADMIN
      const htmlContent = generateDocumentUpdateTemplate({
        userName: doc.full_name,
        documentType: doc.document_type,
        notes: notes || 'El usuario ha reemplazado el archivo manualmente tras un rechazo o actualización.'
      });

      // Insertar Notificación en Panel del Admin
      await pool.query(
        'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
        [
          'security_alert', 
          doc.full_name, 
          doc.email, 
          '📄 Documento Reemplazado', 
          JSON.stringify({ 
            message: `El usuario actualizó su ${doc.document_type}. Requiere nueva validación.`,
            doc_id: id 
          })
        ]
      );

      // Enviar Correo al Admin
      await transporter.sendMail({
        from: `"Seguridad MedBay" <${process.env.EMAIL_USER}>`,
        to: "medbay.info02@gmail.com",
        subject: `🔔 Documento Actualizado: ${doc.full_name}`,
        html: htmlContent,
        attachments: getBrandingAttachments()
      });

      res.json({
        message: 'Documento actualizado y enviado a revisión',
        document: updateRes.rows[0]
      });

    } catch (error) {
      console.error('Error reemplazando documento:', error);
      res.status(500).json({ error: 'Error interno al procesar actualización' });
    }
  },

  // --- OBTENER TODOS (ADMIN) ---
  getAll: async (req, res) => {
    try {
      const query = `
        SELECT 
          d.*,
          u.full_name as user_name,
          u.email as user_email,
          u.company_name,
          u.verification_level as user_role,
          u.account_status as user_status 
        FROM documents d
        LEFT JOIN users u ON d.owner_id = u.id AND d.owner_type = 'user'
        ORDER BY d.created_at DESC
      `;
      
      const result = await pool.query(query);
      res.json(result.rows);

    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // --- OBTENER MIS DOCUMENTOS ---
  getMyDocuments: async (req, res) => {
    try {
      const query = `
        SELECT * FROM documents 
        WHERE owner_type = 'user' AND owner_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [req.user.id]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener mis documentos:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // --- OBTENER POR ID ---
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          d.*, 
          u.full_name as user_name, 
          u.email as user_email,
          u.company_name,
          u.verification_level as user_role,
          u.account_status as user_status
        FROM documents d
        LEFT JOIN users u ON d.owner_id = u.id AND d.owner_type = 'user'
        WHERE d.id = $1
      `;
      const result = await pool.query(query, [id]);
      const document = result.rows[0];
      
      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      // Verificar permisos
      if (document.owner_type === 'user' && document.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para ver este documento' });
      }

      res.json(document);
    } catch (error) {
      console.error('Error al obtener documento:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // --- ACTUALIZAR ESTADO (ADMIN) ---
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const query = `
        UPDATE documents 
        SET status = $1, notes = $2, verified_by = $3, verified_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const result = await pool.query(query, [status, notes, req.user.id, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      res.json({
        message: 'Estado actualizado',
        document: result.rows[0]
      });

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  },

  // --- ELIMINAR DOCUMENTO ---
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const checkQuery = 'SELECT * FROM documents WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      const document = checkResult.rows[0];

      if (!document) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      if (document.owner_type === 'user' && document.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este documento' });
      }

      await pool.query('DELETE FROM documents WHERE id = $1', [id]);

      res.json({ message: 'Documento eliminado exitosamente' });

    } catch (error) {
      console.error('Error al eliminar documento:', error);
      res.status(500).json({ error: 'Error interno' });
    }
  }
};

module.exports = documentController;