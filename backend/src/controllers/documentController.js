// backend/src/controllers/documentController.js

const { Pool } = require('pg');
const nodemailer = require('nodemailer'); 
const { 
  generateDocumentUpdateTemplate, 
  generateResponseTemplate, 
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

  // --- REEMPLAZAR DOCUMENTO (ACTUALIZACIÓN DE PERFIL) ---
  // Lógica: Nuevo archivo -> Resetea Doc a 'uploaded' -> Bloquea Usuario 'pending'
  replaceDocument: async (req, res) => {
    try {
      const { id } = req.params; 
      const { notes } = req.body; 
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Se requiere subir un nuevo archivo.' });
      }

      // 1. Obtener datos actuales para notificaciones
      const checkQuery = `
        SELECT d.*, u.full_name, u.email, u.company_name, u.phone, u.verification_level
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        WHERE d.id = $1
      `;
      const checkRes = await pool.query(checkQuery, [id]);

      if (checkRes.rows.length === 0) {
        return res.status(404).json({ error: 'Documento no encontrado' });
      }
      const doc = checkRes.rows[0];

      // 2. Permisos
      if (doc.owner_id !== req.user.id && req.user.verification_level !== 'admin') {
        return res.status(403).json({ error: 'No autorizado.' });
      }

      const newPath = `/uploads/evidence/${file.filename}`;
      
      // 3. ACTUALIZACIÓN EN DB (Transacción implícita con Promise.all)
      
      // A) Resetear el documento.
      // ⚠️ CORRECCIÓN CRÍTICA: Eliminamos "updated_at" porque no existe en tu tabla.
      const updateDocQuery = `
        UPDATE documents 
        SET 
          file_path = $1, 
          status = 'uploaded',      -- Se reinicia a pendiente de revisión
          verified_by = NULL,       -- Se borra quién lo verificó antes
          verified_at = NULL,       -- Se borra la fecha de verificación
          notes = $2
        WHERE id = $3
        RETURNING *
      `;
      
      // B) Bloquear al usuario (Lo regresa a pending)
      const updateUserQuery = `
        UPDATE users
        SET account_status = 'pending'
        WHERE id = $1
      `;

      // Ejecutamos ambas actualizaciones
      const [updateRes] = await Promise.all([
        pool.query(updateDocQuery, [newPath, notes || 'Actualización de documento', id]),
        pool.query(updateUserQuery, [doc.owner_id])
      ]);

      // 4. NOTIFICACIONES (Email y Dashboard)
      try {
        const roleName = doc.verification_level === 'medical_professional' ? 'Profesional Salud' : 'Empresa';
        
        // Obtener dirección para el reporte (Estético)
        const addressQuery = `SELECT * FROM addresses WHERE user_id = $1 AND (is_fiscal = true OR address_type = 'billing') LIMIT 1`;
        const addrRes = await pool.query(addressQuery, [doc.owner_id]);
        const addr = addrRes.rows[0];
        const fullAddress = addr ? `${addr.street} #${addr.street_number}, ${addr.city}` : 'N/A';

        // Dashboard Notification payload
        const notifContent = {
          mensaje: `El usuario ha actualizado su ${doc.document_type}. Se requiere nueva validación.`,
          extra_data: {
            user_id: doc.owner_id,
            role_name: roleName,
            company: doc.company_name || 'N/A',
            tax_id: doc.tax_id || 'N/A',
            phone: doc.phone || 'N/A',
            address: fullAddress,
            file_path: newPath
          }
        };

        await pool.query(
          'INSERT INTO notifications (type, sender_name, sender_email, subject, content) VALUES ($1, $2, $3, $4, $5)',
          ['Registro Usuario', doc.full_name, doc.email, `Documento Actualizado: ${roleName}`, JSON.stringify(notifContent)]
        );

        // Email al Admin
        const htmlContent = generateDocumentUpdateTemplate({
          userName: doc.full_name,
          documentType: doc.document_type,
          notes: notes
        });

        await transporter.sendMail({
          from: `"Seguridad MedBay" <${process.env.EMAIL_USER}>`,
          to: "medbay.info02@gmail.com",
          subject: `🔔 Alerta: Documento Actualizado - ${doc.full_name}`,
          html: htmlContent,
          attachments: getBrandingAttachments()
        });

      } catch (e) { console.error('Error notificando:', e); }

      res.json({
        message: 'Documento actualizado. Tu cuenta ha pasado a revisión.',
        document: updateRes.rows[0]
      });

    } catch (error) {
      console.error('Error crítico en replaceDocument:', error);
      res.status(500).json({ error: 'Error al actualizar documento' });
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

  // --- ACTUALIZAR ESTADO DEL DOCUMENTO (ADMIN) ---
  // ✅ CAMBIO CRÍTICO: Lógica de estados ligados (Doc Aprobado = Cuenta Activa)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // 1. Actualizar el estado del DOCUMENTO
      const query = `
        UPDATE documents 
        SET status = $1, notes = $2, verified_by = $3, verified_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      const result = await pool.query(query, [status, notes, req.user.id, id]);
      
      if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
      
      const updatedDoc = result.rows[0];

      // 2. LÓGICA DE ESTADOS LIGADOS: Si el documento es Legal y se Verifica -> Activar Usuario
      if (['license', 'business_registration'].includes(updatedDoc.document_type)) {
        
        if (status === 'verified') {
          // --- APROBACIÓN: Activar Usuario Automáticamente ---
          
          // Primero verificamos que el usuario exista
          const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [updatedDoc.owner_id]);
          const user = userRes.rows[0];

          if (user && user.account_status !== 'active') {
            await pool.query("UPDATE users SET account_status = 'active' WHERE id = $1", [updatedDoc.owner_id]);
            
            console.log(`✅ Estados Ligados: Documento verificado -> Cuenta Activada (${user.email})`);

            // Correo de Bienvenida / Reactivación
            const html = generateResponseTemplate(
              'Cuenta Verificada', 
              `Hola <strong>${user.full_name}</strong>,<br><br>Tu documentación ha sido validada correctamente. Tu cuenta ahora está <strong>ACTIVA</strong> y tienes acceso completo a la plataforma.`, 
              true
            );
            
            await transporter.sendMail({
              from: `"Admin MedBay" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: "🎉 ¡Tu cuenta está Activa!",
              html: html,
              attachments: getBrandingAttachments()
            });
          }

        } else if (status === 'rejected') {
          // --- RECHAZO: Si se rechaza el documento legal, asegurar que el usuario esté Rejected/Pending ---
          
          await pool.query("UPDATE users SET account_status = 'rejected' WHERE id = $1", [updatedDoc.owner_id]);
          console.log(`⛔ Estados Ligados: Documento rechazado -> Cuenta Rechazada`);
        }
      }

      res.json({ message: 'Estado actualizado y sincronizado.', document: updatedDoc });

    } catch (error) {
      console.error('Error actualizando estado:', error);
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