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

// Configuración del Transporter
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

      if (!owner_type || !owner_id || !document_type || !file) {
        return res.status(400).json({ error: 'Faltan campos requeridos o el archivo.' });
      }

      const file_path = `/uploads/evidence/${file.filename}`;

      if (!['user', 'supplier'].includes(owner_type)) {
        return res.status(400).json({ error: 'owner_type debe ser "user" o "supplier"' });
      }

      if (owner_type === 'user') {
        if (owner_id !== req.user.id && req.user.verification_level !== 'admin') {
          return res.status(403).json({ error: 'No tienes permiso para subir documentos a este usuario.' });
        }
      }

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

  // --- REEMPLAZAR DOCUMENTO (SOLUCIÓN COMPLETA: BLOQUEO + NOTIFICACIÓN RICA) ---
  replaceDocument: async (req, res) => {
    try {
      const { id } = req.params; 
      const { notes } = req.body; 
      const file = req.file;

      // 1. Validación de archivo
      if (!file) {
        return res.status(400).json({ error: 'Se requiere subir un nuevo archivo.' });
      }

      // 2. Obtener documento actual Y DATOS DEL USUARIO necesarios para la notificación
      // ✅ MEJORA: Traemos company_name, tax_id, phone para llenar la tarjeta del dashboard
      const checkQuery = `
        SELECT 
          d.*, 
          u.full_name, 
          u.email, 
          u.company_name, 
          u.tax_id, 
          u.phone,
          u.verification_level
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        WHERE d.id = $1
      `;
      const checkRes = await pool.query(checkQuery, [id]);

      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }

      const doc = checkRes.rows[0];

      // 3. Validar Permisos
      if (doc.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado para modificar este documento' });
      }

      // 4. Actualizar en BD (DOCUMENTO + USUARIO)
      const newPath = `/uploads/evidence/${file.filename}`;
      const updateDocQuery = `
        UPDATE documents 
        SET 
          file_path = $1, 
          status = 'uploaded', 
          updated_at = NOW(), 
          notes = $2,
          verified_by = NULL,   
          verified_at = NULL    
        WHERE id = $3
        RETURNING *
      `;
      
      const updateUserQuery = `
        UPDATE users
        SET account_status = 'pending'
        WHERE id = $1
      `;

      // Ejecutamos actualizaciones
      const [updateRes] = await Promise.all([
        pool.query(updateDocQuery, [newPath, notes || 'Actualización solicitada por usuario', id]),
        pool.query(updateUserQuery, [doc.owner_id])
      ]);

      // 5. 🛡️ CONSTRUCCIÓN DE NOTIFICACIÓN COMPLETA (Dashboard)
      try {
        // A) Obtener dirección fiscal para la tarjeta del dashboard
        const addressQuery = `
          SELECT * FROM addresses 
          WHERE user_id = $1 AND (is_fiscal = true OR address_type = 'billing') 
          LIMIT 1
        `;
        const addressRes = await pool.query(addressQuery, [doc.owner_id]);
        const addr = addressRes.rows[0];

        // B) Formatear dirección
        const fullAddress = addr 
          ? `${addr.street} #${addr.street_number}, ${addr.colony || ''}, ${addr.city}, ${addr.state}, CP: ${addr.postal_code}`
          : 'Dirección no registrada';

        // C) Definir Rol amigable
        const roleFriendlyName = doc.verification_level === 'medical_professional' 
          ? 'Profesional de Salud' 
          : doc.verification_level === 'business_verified' 
            ? 'Cuenta Empresarial'
            : 'Usuario';

        // D) Construir Payload Rico (Igual que en Register)
        const notifContent = {
          mensaje: `El usuario ha actualizado un documento legal (${doc.document_type}). Se requiere re-validación.`,
          extra_data: {
            user_id: doc.owner_id,
            role_name: roleFriendlyName,
            company: doc.company_name || 'N/A',
            tax_id: doc.tax_id || 'N/A',
            phone: doc.phone || 'N/A',
            address: fullAddress,
            file_path: newPath // Enviamos el nuevo archivo para que salga en la tarjeta
          }
        };

        // E) Insertar Notificación
        // ✅ TRUCO: Usamos type 'Registro Usuario' para que el Frontend use el componente RegisterDetails
        // y muestre la tarjeta completa con todos los datos.
        await pool.query(
          'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
          [
            'Registro Usuario', // Mantenemos este tipo para activar la vista detallada en el front
            doc.full_name, 
            doc.email, 
            `Actualización: ${roleFriendlyName}`, // Asunto diferenciado
            JSON.stringify(notifContent)
          ]
        );

        // F) Enviar Correo al Admin (HTML Template)
        const htmlContent = generateDocumentUpdateTemplate({
          userName: doc.full_name,
          documentType: doc.document_type,
          notes: notes || 'El usuario ha reemplazado el archivo manualmente.'
        });

        await transporter.sendMail({
          from: `"Seguridad MedBay" <${process.env.EMAIL_USER}>`,
          to: "medbay.info02@gmail.com",
          subject: `🔔 Documento Actualizado: ${doc.full_name}`,
          html: htmlContent,
          attachments: getBrandingAttachments()
        });
        
        console.log(`✅ Notificación completa enviada para: ${id}`);

      } catch (emailError) {
        console.error('⚠️ ALERTA: El documento se actualizó, pero falló la notificación:', emailError.message);
      }

      // 6. Respuesta Exitosa
      res.json({
        message: 'Documento actualizado. Tu cuenta está en revisión.',
        document: updateRes.rows[0]
      });

    } catch (error) {
      console.error('🔥 Error CRÍTICO reemplazando documento:', error);
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